import { NextResponse } from "next/server";
import { getCurrentUser, canDelete } from "@/lib/auth";
import { deleteEntity, getEntity, isAdminEntity, updateEntity, type AdminEntity } from "@/lib/admin-entities";
import { hasValidOrigin } from "@/lib/rate-limit";
import { logActivity, logServer } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { destroyRemote } from "@/lib/cloudinary";
import { isRemoteUrl, verifyImageSource } from "@/lib/publish/media";
import { publishEntitySummary } from "@/lib/publish";
import { InstagramValidationError } from "@/lib/instagram";
import { UserFacingError } from "@/lib/validation";
export async function GET(_: Request, context: { params: Promise<{ entity: string; id: string }> }) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const { entity, id } = await context.params; if (!isAdminEntity(entity)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 }); const item = await getEntity(entity, Number(id)); return item ? NextResponse.json(item) : NextResponse.json({ error: "Not found" }, { status: 404 }); }
type ManagedImage = Record<string, string | null | undefined>;

/** Cloudinary fields that are replaced when an admin swaps an image. */
const managedImages: Partial<Record<AdminEntity, { url: string; publicId: string }[]>> = {
  "client-logos": [{ url: "imageUrl", publicId: "imagePublicId" }],
  "home-slider": [
    { url: "imageUrl", publicId: "imagePublicId" },
    { url: "mobileImageUrl", publicId: "mobileImagePublicId" },
  ],
  "home-offer-cards": [{ url: "imageUrl", publicId: "imagePublicId" }],
  // A testimonial avatar has no public-id column, so nothing is ever destroyed
  // for it — but the pre-write probe is still worth having. The value is pasted
  // into the homepage carousel, and an unreachable or wrong-type URL is a card
  // with a broken picture on the front page of the site.
  testimonials: [{ url: "image", publicId: "cloudinaryPublicId" }],
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
/**
 * Rejects the save when a newly supplied image URL does not actually serve an
 * image, so a record can never end up pointing at a file the site cannot load.
 *
 * Only changed URLs are checked: an unchanged one was verified when it was
 * first saved, and re-probing it would turn a routine copy edit into a
 * dependency on the image host. A local `/assets/...` path is skipped for the
 * same reason — there is no host to ask.
 */
async function assertImagesAvailable(entity: AdminEntity, previous: ManagedImage | null, body: Record<string, unknown>) {
  const fields = managedImages[entity];
  if (!fields) return;
  for (const field of fields) {
    const after = body[field.url];
    if (typeof after !== "string" || !after.trim() || !isRemoteUrl(after.trim())) continue;
    if (previous?.[field.url] === after) continue;
    const url = after.trim();
    const probe = await verifyImageSource(url);
    if (probe.ok) {
      logServer("info", "admin.image_verified", { entity, field: field.url, url, status: probe.status, bytes: probe.bytes });
      continue;
    }
    logServer("error", "admin.image_unavailable", {
      entity,
      field: field.url,
      url,
      publicId: typeof body[field.publicId] === "string" ? body[field.publicId] : null,
      status: probe.status,
    });
    throw new UserFacingError(
      `The new image could not be loaded from the image host (HTTP ${probe.status || "no response"}). ` +
        "Nothing was saved — the image host rejected the URL, so saving it would leave the page without a picture. " +
        "Please upload the image again.",
    );
  }
}

/**
 * Pixel dimensions that describe a record's image.
 *
 * Only `clientLogos` stores them. The upload path fills them in, but a record can
 * also get a new image by pasting a URL into the editor, which supplies no
 * measurements — the row would then keep the previous file's width and height.
 * Wrong numbers are worse than none, so they are dropped whenever the image
 * changes and the request does not carry fresh ones.
 */
const dimensionColumns: Partial<Record<AdminEntity, { url: string; keys: string[] }[]>> = {
  "client-logos": [{ url: "imageUrl", keys: ["width", "height"] }],
};

function clearStaleDimensions(entity: AdminEntity, previous: ManagedImage | null, body: Record<string, unknown>) {
  for (const field of dimensionColumns[entity] ?? []) {
    if (previous?.[field.url] === body[field.url]) continue;
    for (const key of field.keys) {
      if (body[key] === undefined) body[key] = null;
    }
  }
}

/**
 * Deletes the Cloudinary originals that the save replaced, and clears the now
 * dangling public id / dimensions on the stored row.
 *
 * Runs only after the database update succeeded: destroying the asset first and
 * then failing validation would leave the row pointing at a deleted image.
 *
 * A previous original is only removed when the field genuinely points somewhere
 * else now, and never when the saved row still names that same public id — the
 * desktop and mobile fields can share one upload, and destroying it there would
 * blank an image the record is still using.
 */
async function pruneReplacedImages(
  entity: AdminEntity,
  previous: ManagedImage | null,
  body: Record<string, unknown>,
  saved: ManagedImage | null,
) {
  const fields = managedImages[entity];
  if (!fields || !previous || !process.env.CLOUDINARY_CLOUD_NAME) return;
  const stillReferenced = new Set<string>();
  for (const field of fields) {
    const id = saved?.[field.publicId];
    if (typeof id === "string" && id) stillReferenced.add(id);
  }
  const doomed: string[] = [];
  for (const field of fields) {
    const before = previous[field.url];
    const beforeId = previous[field.publicId];
    if (typeof before !== "string" || !before || typeof beforeId !== "string" || !beforeId) continue;
    // An unchanged value still points at this original, so it is not a
    // replacement and the asset has to survive.
    if (before === body[field.url]) continue;
    if (stillReferenced.has(beforeId)) continue;
    doomed.push(beforeId);
  }
  if (doomed.length) {
    await Promise.all(doomed.map((publicId) => destroyRemote(publicId, "image")));
    logServer("info", "admin.replaced_images_destroyed", { entity, publicIds: doomed });
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

/**
 * Removes the product gallery originals the save dropped.
 *
 * A gallery slot that is cleared (or whose photo is swapped) leaves a real file
 * behind on Cloudinary, and nothing else in the system would ever reclaim it.
 * The write has already succeeded by the time this runs, so destroying first
 * could never leave a row pointing at a deleted image.
 */
async function pruneProductGallery(entity: AdminEntity, previous: ManagedImage | null, body: Record<string, unknown>) {
  if (entity !== "products" || !previous || !process.env.CLOUDINARY_CLOUD_NAME) return;
  const before = Array.isArray(previous.gallery) ? (previous.gallery as ManagedImage[]) : [];
  if (!before.length) return;
  // An absent `gallery` key means the caller did not manage the gallery on this
  // save, not that it is empty. Only an explicit array is authoritative; a PUT
  // from a form that omits the field must not destroy six originals.
  if (!Array.isArray(body.gallery)) return;
  const after = body.gallery as ManagedImage[];
  const kept = new Set(after.map((item) => String(item.imageUrl ?? "")));
  const doomed = new Set<string>();
  for (const item of before) {
    const publicId = item.cloudinaryPublicId;
    if (typeof publicId !== "string" || !publicId) continue;
    if (!kept.has(String(item.imageUrl ?? ""))) doomed.add(publicId);
  }
  if (doomed.size) {
    await Promise.all([...doomed].map((publicId) => destroyRemote(publicId, "image")));
  }
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
    const previous = (managedImages[entity] || managedVideos[entity] || entity === "products"
      ? ((await getEntity(entity, Number(id))) as ManagedImage | null)
      : null) as ManagedImage | null;
    // Before the write, not after: a URL that cannot be loaded must leave no trace.
    await assertImagesAvailable(entity, previous, body);
    clearStaleDimensions(entity, previous, body);
    const item = await updateEntity(entity, Number(id), body, user.id);
    await pruneReplacedImages(entity, previous, body, item as unknown as ManagedImage | null);
    await pruneReplacedVideos(entity, previous, body);
    await pruneProductGallery(entity, previous, body);
    await logActivity(entity === "inquiries" ? "INQUIRY_STATUS_CHANGED" : `${entity.toUpperCase()}_UPDATED`, entity, id, user.id);
    const publish = await publishEntitySummary(entity);
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
      await Promise.all([...doomed].map((publicId) => destroyRemote(publicId, "image")));
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
    const publish = await publishEntitySummary(entity);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, publish });
  } catch (error) {
    logServer("warn", "admin.delete_failed", { entity, id });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete" }, { status: 400 });
  }
}
