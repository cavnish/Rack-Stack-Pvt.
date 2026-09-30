import "server-only";
import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}
export function cloudinaryClient() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
  }
  // Trimmed because a trailing space in a `.env` value is invisible in the file
  // and produces a signature Cloudinary rejects with a 401 that reads as bad
  // credentials rather than as a formatting mistake.
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
    secure: true,
  });
  return cloudinary;
}

/**
 * Removes an uploaded original and clears its CDN copy.
 *
 * `invalidate` is the part that is easy to leave out: without it Cloudinary
 * drops the origin but the edge keeps answering `200` for the retired URL, so a
 * replaced image goes on being served from cache long after the save reported it
 * replaced. Failures are swallowed on purpose — a cleanup that cannot reach
 * Cloudinary must not roll back a save that already succeeded, and the asset
 * being left behind is a storage problem rather than a correctness one.
 */
export async function destroyRemote(publicId: string, resourceType: "image" | "video" = "image") {
  await cloudinaryClient()
    .uploader.destroy(publicId, { resource_type: resourceType, invalidate: true })
    .catch(() => {});
}
export function transformCloudinaryUrl(url: string, width = 1200) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}
export const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/**
 * Reels are streamed rather than downloaded, so the video allow-list is kept
 * narrow and MP4-first: those are the only containers every target browser can
 * play back, and an H.264/AAC MP4 is what phones record in the first place.
 */
export const allowedVideoTypes = new Set(["video/mp4", "video/quicktime", "video/webm"]);
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
