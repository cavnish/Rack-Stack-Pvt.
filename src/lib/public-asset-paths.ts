/**
 * Stable site-relative URLs for files that already live in `public/`.
 *
 * The product photos shipped with the site are plain files under
 * `public/FOLDER/filename.jpg`. They are real, they are the
 * photography the business wants on its pages, and re-uploading them to a CDN
 * would only produce a second copy of the same picture under a name that
 * expires. So the CMS stores them by their public path — `/LOCKERS/abc.jpg` —
 * which never breaks, needs no upload, and keeps working with the database
 * switched off.
 *
 * Two rules make those paths safe:
 *
 *  1. every segment is percent-encoded, because the real folder and file names
 *     contain spaces (`HEAVY DUTY PALLET RACKING`) and one file name already
 *     contains a literal `%20` (`IMG_0254%20-%20Copy.JPG`), which has to become
 *     `%2520` to survive the round trip;
 *  2. the same folder and file always produce the same string, so re-importing
 *     a product never churns its database rows.
 *
 * A path that starts with `/` and is not protocol-relative is a local public
 * asset. Everything else that looks like a URL is a remote asset, and
 * `isPublicAssetPath` is the single place that decides which.
 */

const REMOTE_URL = /^https?:\/\//i;

export function isRemoteImageUrl(value: string): boolean {
  return REMOTE_URL.test(value.trim());
}

/**
 * True for a site-relative path that points inside `public/`.
 *
 * Protocol-relative URLs (`//cdn.example.com/x.jpg`) are rejected on purpose:
 * they are remote, they are not a file this repository can serve, and treating
 * them as local would make publishing look for a file that does not exist.
 */
export function isPublicAssetPath(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("/") && !trimmed.startsWith("//") && trimmed.length > 1;
}

/** True for anything the CMS may store in an image field. */
export function isStorableImageUrl(value: string): boolean {
  return isRemoteImageUrl(value) || isPublicAssetPath(value);
}

/**
 * Percent-encodes one path segment.
 *
 * `encodeURIComponent` is correct rather than `encodeURI` here: it also escapes
 * `&`, `?`, `#` and `+`, none of which are legal unescaped in a path segment and
 * all of which would otherwise change which file the URL resolves to.
 */
export function encodePublicSegment(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Builds the public URL for a file already inside `public/`.
 *
 * `folder` and `file` are the real names on disk, not already-encoded ones.
 * Both are encoded here so `/MEZZANINE FLOOR` and `a b.jpg` produce
 * `/MEZZANINE%20FLOOR/a%20b.jpg`.
 */
export function toPublicAssetUrl(folder: string, file: string): string {
  const segments = [folder, file]
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(encodePublicSegment);
  return segments.length ? `/${segments.join("/")}` : "";
}

/**
 * Resolves a public URL back to the path it addresses on disk.
 *
 * Used by publishing to find the file behind a stored `/...` path. Query
 * strings and fragments are dropped first: they are not part of the file name,
 * and `HEAVY%20DUTY%20.../x.jpg?v=2` must resolve to the same file as
 * `HEAVY%20DUTY%20.../x.jpg`.
 */
export function toPublicFilePath(url: string): string {
  const clean = url.trim().split("?")[0].split("#")[0];
  const relative = decodeURIComponent(clean);
  return relative.replace(/^\/+/, "");
}

/**
 * The public URL of a stored image, with the form publishers want.
 *
 * A remote URL is returned unchanged. A local path is returned with its
 * original encoding intact rather than decoded: publishing writes this string
 * straight into `products.json`, and a decoded path would emit
 * `/HEAVY DUTY PALLET RACKING/x.jpg` — a URL with literal spaces that a
 * browser has to guess at and that no cache or CDN will match.
 */
export function stableImageUrl(value: string | null | undefined): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  if (isRemoteImageUrl(raw)) return raw;
  if (!isPublicAssetPath(raw)) return raw;
  const clean = raw.split("?")[0].split("#")[0];
  return clean.startsWith("/") ? clean : `/${clean}`;
}
