import { NextResponse } from "next/server";
import { getCurrentUser, canDelete } from "@/lib/auth";
import { deleteEntity, getEntity, isAdminEntity, updateEntity, type AdminEntity } from "@/lib/admin-entities";
import { hasValidOrigin } from "@/lib/rate-limit";
import { logActivity, logServer } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { cloudinaryClient } from "@/lib/cloudinary";
import { publishSerialized, scopeForAdminEntity } from "@/lib/publish";
import { InstagramValidationError } from "@/lib/instagram";
import { UserFacingError } from "@/lib/validation";

/** Rebuilds the static layer for the changed entity and reports failures without blocking the admin. */
async function publishEntity(entity: string) {
  try {
    const result = await publishSerialized(scopeForAdminEntity(entity));
    return { scope: result.scope, collections: result.collections, assetsCached: result.assetsCached, assetsReused: result.assetsReused, skipped: result.skipped };
  } catch (error) {
    logServer("warn", "admin.publish_failed", { entity, message: error instanceof Error ? error.message : "unknown" });
    return { scope: null, error: "static publish failed" };
  }
}
export async function GET(_: Request, context: { params: Promise<{ entity: string; id: string }> }) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const { entity, id } = await context.params; if (!isAdminEntity(entity)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 }); const item = await getEntity(entity, Number(id)); return item ? NextResponse.json(item) : NextResponse.json({ error: "Not found" }, { status: 404 }); }
type ManagedImage = Record<string, string | null | undefined>;

/** Cloudinary fields that are replaced when an admin swaps an image. */
const managedImages: Partial<Record<AdminEntity, { url: string; publicId: string }[]>> = {
  "client-logos": [{ url: "imageUrl", publicId: "imagePublicId" }],
  "home-slider": [
    { url: "imageUrl", publicId: "imagePublicId" },
    { url: "mobileImageUrl", publicId: "mobileImagePublicId" },
  ],
};

/**
 * Video originals owned by a record. Unlike images these are not generated at
 * read time, so an orphaned one is a real cost: a phone-recorded clip is easily
 * tens of megabytes and nothing else in the system will ever clean it up.
 */
const managedVideos: Partial<Record<AdminEntity, { url: string; publicId: string; resourceType: "video" | "image" }[]>> = {
  videos: [
    { url: "videoUrl", publicId: "cloudinaryPublicId", resourceType: "video" },
    { url: "posterUrl", publicId: "posterPublicId", resourceType: "image" },
  ],
};

type ManagedAsset = Record<string, string | null | undefined>;

/** Cloudinary needs an explicit resource type to remove a video original. */
async function destroyRemote(publicId: string, resourceType: "video" | "image") {
  await cloudinaryClient()
    .uploader.destroy(publicId, resourceType === "video" ? { resource_type: "video", invalidate: true } : {})
    .catch(() => { });
}


/**
 * Deletes the Cloudinary originals that the save replaced, and clears the now
 * dangling public id / dimensions on the stored row.
 *
 * Runs only after the database update succeeded: destroying the asset first and
 * then failing validation would leave the row pointing at a deleted image.
 */
async function pruneReplacedImages(entity: AdminEntity, id: number, previous: ManagedImage | null, body: Record<string, unknown>) {
  const fields = managedImages[entity];
  if (!fields || !previous || !process.env.CLOUDINARY_CLOUD_NAME) return;
  const doomed: string[] = [];
  for (const field of fields) {
    const before = previous[field.url];
    const after = body[field.url];
    const beforeId = previous[field.publicId];
    // Only a real replacement counts; an unchanged value keeps its asset.
    if (typeof before !== "string" || before !== after || typeof beforeId !== "string" || !beforeId) continue;
    doomed.push(beforeId);
    if (after === undefined || body[field.publicId] === beforeId) body[field.publicId] = null;
  }
  if (entity === "client-logos" && doomed.length) {
    body.width = null;
    body.height = null;
  }
  if (doomed.length) {
    await Promise.all(doomed.map((publicId) => cloudinaryClient().uploader.destroy(publicId).catch(() => { })));
  }
}

/**
 * Removes the video or poster that the save replaced. Runs after the database
 * write, for the same reason as images: destroying first would leave the row
 * pointing at a file that no longer exists.
 */
async function pruneReplacedVideos(entity: AdminEntity, previous: ManagedAsset | null, body: Record<string, unknown>) {
  const fields = managedVideos[entity];
  if (!fields || !previous || !process.env.CLOUDINARY_CLOUD_NAME) return;
  const doomed: Array<{ publicId: string; resourceType: "video" | "image" }> = [];
  for (const field of fields) {
    const before = previous[field.url];
    const beforeId = previous[field.publicId];
    // The derived poster is not stored as its own public id, so a swapped video
    // takes its generated poster with it and nothing needs to be cleaned up.
    if (typeof before !== "string" || !beforeId) continue;
    if (field.resourceType === "video" && before !== body[field.url]) continue;
    if (field.resourceType === "image" && before === body[field.url]) continue;
    doomed.push({ publicId: beforeId, resourceType: field.resourceType });
  }
  await Promise.all(doomed.map((item) => destroyRemote(item.publicId, item.resourceType)));
}

export async function PUT(request: Request, context: { params: Promise<{ entity: string; id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { entity, id } = await context.params;
  if (!isAdminEntity(entity)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  if (entity === "users" && user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const previous = (managedImages[entity] || managedVideos[entity]
      ? ((await getEntity(entity, Number(id))) as ManagedImage | null)
      : null) as ManagedImage | null;
    const item = await updateEntity(entity, Number(id), body, user.id);
    await pruneReplacedImages(entity, Number(id), previous, body);
    await pruneReplacedVideos(entity, previous, body);
    await logActivity(entity === "inquiries" ? "INQUIRY_STATUS_CHANGED" : `${entity.toUpperCase()}_UPDATED`, entity, id, user.id);
    const publish = await publishEntity(entity);
    revalidatePath("/", "layout");
    return NextResponse.json({ ...(item as object), publish });
  } catch (error) {
    logServer("error", "admin.update_failed", { entity, id, message: error instanceof Error ? error.message : "unknown" });
    // A typed validation failure carries a message written for the person
    // filling in the form, so it is safe to return as-is.
    const message =
      error instanceof Error && (error instanceof InstagramValidationError || error instanceof UserFacingError)
        ? error.message
        : "";
    return NextResponse.json(
      { error: message || "Unable to save. Check required fields and unique values." },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request, context: { params: Promise<{ entity: string; id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canDelete(user.role)) return NextResponse.json({ error: "Your role cannot delete records" }, { status: 403 });
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { entity, id } = await context.params;
  if (!isAdminEntity(entity)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  try {
    const doomed = new Set<string>();
    // Read the row once, then remove the remote originals it owns.
    const current = (await getEntity(entity, Number(id))) as Record<string, unknown> | null;
    if (current && process.env.CLOUDINARY_CLOUD_NAME) {
      const fields = entity === "media" ? ["cloudinaryPublicId"] : (managedImages[entity] ?? []).map((f) => f.publicId);
      for (const field of fields) {
        const publicId = current[field];
        if (typeof publicId === "string" && publicId) doomed.add(publicId);
      }
    }
    if (doomed.size) {
      await Promise.all([...doomed].map((publicId) => cloudinaryClient().uploader.destroy(publicId).catch(() => { })));
    }
    // Videos are deleted with their explicit resource type, and a poster whose
    // own public id was never stored is a derived frame, so it dies with the
    // video original rather than lingering as an orphan.
    for (const field of managedVideos[entity] ?? []) {
      const publicId = current?.[field.publicId];
      if (typeof publicId === "string" && publicId) await destroyRemote(publicId, field.resourceType);
    }
    await deleteEntity(entity, Number(id));
    await logActivity(`${entity.toUpperCase()}_DELETED`, entity, id, user.id);
    const publish = await publishEntity(entity);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, publish });
  } catch (error) {
    logServer("warn", "admin.delete_failed", { entity, id });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete" }, { status: 400 });
  }
}
