import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { allowedImageTypes, cloudinaryClient, destroyRemote, isCloudinaryConfigured, MAX_IMAGE_SIZE } from "@/lib/cloudinary";
import { db } from "@/db";
import { media } from "@/db/schema";
import { hasValidOrigin, rateLimit, requestKey } from "@/lib/rate-limit";
import { logActivity, logServer } from "@/lib/logger";
import { cacheImage, flushMediaManifest, verifyImageSource, type AssetGroup } from "@/lib/publish/media";
export const runtime = "nodejs";

const FOLDER_GROUPS: Array<[RegExp, AssetGroup]> = [
  [/hero|banner|slider/i, "hero"],
  [/product|catalog/i, "products"],
  [/service|install/i, "services"],
  [/project/i, "projects"],
  [/client|logo/i, "clients"],
  [/industr/i, "industries"],
  [/gallery/i, "gallery"],
  [/blog|resource/i, "blog"],
  [/about/i, "about"],
];

function groupForFolder(folder: string): AssetGroup {
  for (const [pattern, group] of FOLDER_GROUPS) if (pattern.test(folder)) return group;
  return "misc";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, then restart the server." },
      { status: 503 },
    );
  }
  if (!rateLimit(requestKey(request, "upload"), 20, 60_000).allowed) return NextResponse.json({ error: "Upload limit reached" }, { status: 429 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") ?? "rack-stack").replace(/[^a-z0-9/_-]/gi, "").slice(0, 100);
    const altText = String(form.get("altText") ?? "").trim();
    if (!(file instanceof File)) throw new Error("Choose an image");
    if (!allowedImageTypes.has(file.type)) throw new Error("Use JPG, PNG, WebP or AVIF images");
    if (file.size > MAX_IMAGE_SIZE) throw new Error("Image must be under 10MB");
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<{ secure_url: string; public_id: string; width: number; height: number; bytes: number; format: string }>((resolve, reject) => {
      const stream = cloudinaryClient().uploader.upload_stream({ folder: `rack-stack/${folder}`, resource_type: "image", quality: "auto", fetch_format: "auto" }, (error, upload) =>
        error || !upload ? reject(error ?? new Error("Upload failed")) : resolve(upload as never),
      );
      stream.end(buffer);
    });
    // The URL that goes in the database is the one Cloudinary reports. Building
    // one by hand from the public id and folder looks equivalent and is not:
    // `fetch_format: "auto"` makes the delivered format differ from the uploaded
    // one, so a hand-assembled address can name a file that was never written.
    const secureUrl = result.secure_url;
    logServer("info", "media.cloudinary_uploaded", {
      publicId: result.public_id,
      secureUrl,
      folder: `rack-stack/${folder}`,
      bytes: result.bytes,
      format: result.format,
    });

    // Confirm the asset actually serves bytes before anything is written. A URL
    // that cannot be loaded must not reach a record: the record is what the
    // publish engine downloads from, so a bad address here becomes a blank
    // image on the site with no error anywhere in the admin.
    const probe = await verifyImageSource(secureUrl);
    if (!probe.ok) {
      // The asset is unreachable, so it is an orphan by definition: nothing
      // will ever reference it, and leaving it would fill the account with
      // images no record points at.
      await destroyRemote(result.public_id, "image");
      logServer("error", "media.cloudinary_unreachable", { publicId: result.public_id, secureUrl, status: probe.status });
      throw new Error(
        `The image was uploaded as "${result.public_id}" but could not be read back from Cloudinary (HTTP ${
          probe.status || "no response"
        }). Nothing was saved — please try again.`,
      );
    }

    const fallbackAlt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Uploaded image";
    // Cache the upload into the local asset library right away, so the image is
    // available as a local WebP even before it is attached to a record.
    const localAsset = await cacheImage(secureUrl, {
      group: groupForFolder(folder),
      name: `${folder.split("/").filter(Boolean).pop() ?? "media"}-${item_slug(result.public_id)}`,
      alt: altText || fallbackAlt,
    });
    if (!localAsset) {
      logServer("warn", "media.local_cache_unavailable", { publicId: result.public_id, secureUrl });
    }
    const [item] = await db
      .insert(media)
      .values({
        filename: file.name,
        imageUrl: secureUrl,
        cloudinaryPublicId: result.public_id,
        altText: altText || fallbackAlt,
        folder,
        mimeType: file.type,
        width: localAsset?.width ?? result.width,
        height: localAsset?.height ?? result.height,
        fileSize: result.bytes,
        uploadedBy: user.id,
      })
      .returning();
    await flushMediaManifest();
    await logActivity("IMAGE_UPLOADED", "MEDIA", item.id, user.id, { folder });
    return NextResponse.json(
      {
        ...item,
        // Spelled out rather than left to the media row shape: the editor binds
        // these two names, and an upload that stored a URL under a different key
        // would save an empty image field while reporting success.
        imageUrl: secureUrl,
        cloudinaryPublicId: result.public_id,
        width: localAsset?.width ?? result.width,
        height: localAsset?.height ?? result.height,
        localUrl: localAsset?.url ?? null,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}

function item_slug(publicId: string) {
  return publicId.split("/").filter(Boolean).pop() ?? "asset";
}
