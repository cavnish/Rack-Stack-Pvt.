import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { allowedImageTypes, cloudinaryClient, isCloudinaryConfigured, MAX_IMAGE_SIZE } from "@/lib/cloudinary";
import { db } from "@/db";
import { media } from "@/db/schema";
import { hasValidOrigin, rateLimit, requestKey } from "@/lib/rate-limit";
import { logActivity } from "@/lib/logger";
export const runtime = "nodejs";

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
    const fallbackAlt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Uploaded image";
    const [item] = await db
      .insert(media)
      .values({
        filename: file.name,
        imageUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        altText: altText || fallbackAlt,
        folder,
        mimeType: file.type,
        width: result.width,
        height: result.height,
        fileSize: result.bytes,
        uploadedBy: user.id,
      })
      .returning();
    await logActivity("IMAGE_UPLOADED", "MEDIA", item.id, user.id, { folder });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
