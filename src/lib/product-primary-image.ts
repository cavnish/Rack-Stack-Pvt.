import { isRemoteImageUrl, isPublicAssetPath } from "@/lib/public-asset-paths";

/**
 * The one rule for "which photograph is this product's main image?".
 *
 * The same answer has to come out of four places, and when they disagree the
 * site looks broken in a way nobody can reproduce: the admin screen badges one
 * image as primary, the product hero shows another, the card on the homepage
 * shows a third, and the social share image shows a fourth. So the rule lives
 * here, once, and every caller uses it — the editor, the save handler, the
 * publish engine and the page renderer.
 *
 * The rule is:
 *
 *  1. only rows that are active and actually have a URL are candidates — a
 *     hidden row must never be the one the site leads with, and a half-filled
 *     row an editor has not finished must not blank the hero;
 *  2. the first row that claims `isPrimary` wins, in the editor's own order;
 *  3. if nothing claims it, the first active row wins. This is the behaviour
 *     the site had before the flag existed, so every product imported or
 *     written before the column was added keeps the photograph it was already
 *     showing instead of snapping to something else.
 *
 * Only one row per product is treated as primary even if several claim it: the
 * earliest by position wins, so a duplicated flag degrades to "the first one"
 * rather than to a random pick that changes between renders.
 */
export type PrimaryCandidate = {
  imageUrl?: string | null;
  isActive?: boolean | null;
  isPrimary?: boolean | null;
  displayOrder?: number | null;
  id?: number | string | null;
};

export type ResolvedPrimary<T extends PrimaryCandidate> = T | null;

/**
 * A gallery row as the admin form sends it.
 *
 * The same object is used for the rows read from the database and the rows
 * being written, so the primary rule above can be applied to a form submission
 * before it is saved and to the stored gallery when the page renders.
 */
export type GalleryImageInput = {
  id?: number | string | null;
  imageUrl: string;
  isActive?: boolean | null;
  isPrimary?: boolean | null;
  displayOrder?: number | null;
};

/** Position of a row: editor order first, row id as the tie-break. */
function position<T extends PrimaryCandidate>(row: T) {
  return [row.displayOrder ?? 0, typeof row.id === "number" ? row.id : 0] as const;
}

/** Orders rows the way the editor sees them. Negative when `left` comes first. */
function compareOrder<T extends PrimaryCandidate>(left: T, right: T) {
  const [leftOrder, leftId] = position(left);
  const [rightOrder, rightId] = position(right);
  return leftOrder - rightOrder || leftId - rightId;
}

/** A row that could be shown at all. */
export function isRenderableGalleryImage<T extends PrimaryCandidate>(row: T | null | undefined): row is T {
  if (!row) return false;
  if (row.isActive === false) return false;
  const url = typeof row.imageUrl === "string" ? row.imageUrl.trim() : "";
  return url.length > 0;
}

/**
 * The gallery row that represents the product, or null when it has no images.
 *
 * `rows` may arrive in any order; the result is decided by `isPrimary` and then
 * by `displayOrder`, never by the order of the array it was handed.
 */
export function resolvePrimaryGalleryImage<T extends PrimaryCandidate>(rows: readonly T[] | null | undefined): ResolvedPrimary<T> {
  if (!Array.isArray(rows)) return null;
  const candidates = rows.filter(isRenderableGalleryImage);
  if (!candidates.length) return null;

  const sorted = [...candidates].sort(compareOrder);
  const claimed = sorted.find((row) => row.isPrimary === true);
  // The first active row is the fallback, so a product that never chose a
  // primary — or one written by an older release — still leads with a real
  // photograph rather than with nothing.
  return claimed ?? sorted[0] ?? null;
}

/** Just the URL of the primary image, or an empty string. */
export function getPrimaryGalleryImageUrl<T extends PrimaryCandidate>(rows: readonly T[] | null | undefined): string {
  const primary = resolvePrimaryGalleryImage(rows);
  const url = typeof primary?.imageUrl === "string" ? primary.imageUrl.trim() : "";
  return url;
}

/**
 * The row a save should write with the `isPrimary` flag.
 *
 * Editors send the whole gallery on every save, so a single flag has to be
 * normalised into an unambiguous state: the chosen primary is kept, the rest
 * are cleared. When the payload flags nothing, the row the page will actually
 * lead with is flagged, which is what makes an old client that only reorders
 * still produce a correct result.
 */
export function normalizeGalleryPrimaries<T extends GalleryImageInput>(rows: readonly T[]): (T & { isPrimary: boolean })[] {
  const primary = resolvePrimaryGalleryImage(rows);
  // Every returned row carries a decided `isPrimary`, so the type says so:
  // typed as a bare `T` the flag was invisible to every caller that reads it
  // back out to write the database.
  return rows.map((row) => ({
    ...row,
    isPrimary: Boolean(primary && row === primary),
  }));
}

/**
 * Whether a URL is a file the CMS is allowed to delete.
 *
 * Only a media-host upload has a public id worth destroying. A `/public/...`
 * path is a file in the repository: it is version controlled, it is served
 * directly by Next, and it may be referenced by another product or by a page
 * that has nothing to do with the row being removed. Deleting one would turn an
 * ordinary "remove this image from this product" into data loss.
 */
export function isDeletableUpload(imageUrl: string | null | undefined, cloudinaryPublicId: string | null | undefined): boolean {
  const url = typeof imageUrl === "string" ? imageUrl.trim() : "";
  const publicId = typeof cloudinaryPublicId === "string" ? cloudinaryPublicId.trim() : "";
  if (!publicId) return false;
  if (!url) return false;
  // Belt and braces: even if a public id were somehow stored against a local
  // path, the local file is still not ours to destroy.
  if (isPublicAssetPath(url) || !isRemoteImageUrl(url)) return false;
  return true;
}
