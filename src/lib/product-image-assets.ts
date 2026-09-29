import { readdir } from "node:fs/promises";
import path from "node:path";
import { toPublicAssetUrl } from "@/lib/public-asset-paths";

/**
 * Discovery of the product photography that already ships inside `public/`.
 *
 * Before this module existed the product page scanned a hard-coded map of eight
 * slugs to eight folder names at request time. That worked, but it meant the
 * images were invisible to the CMS: there was no row to reorder, no caption to
 * edit, no primary to choose, and nothing to publish. The gallery the editor
 * reorders and the gallery the page rendered were two different lists.
 *
 * This module is the single place that knows which files exist. The import
 * script uses it to fill `product_gallery_images`; the admin's media picker uses
 * it to offer images that are already on the server; the page renderer keeps
 * using it as a fallback for a product the editor has not filled in yet.
 *
 * Folder names are matched to products by normalising both to a slug, so a
 * folder added later is found without editing this file. The alias table only
 * exists for the folders whose name does not literally match their product.
 */

export type ProductFolderImage = {
  id: string;
  imageUrl: string;
  altText: string;
  caption: string;
};

export type ProductAssetFile = {
  /** The real name on disk, e.g. `IMG_0254%20-%20Copy.JPG`. */
  file: string;
  /** The stable public URL, percent-encoded, e.g. `/LOCKERS/IMG_0254%2520-%2520Copy.JPG`. */
  imageUrl: string;
};

export type ProductAssetFolder = {
  /** The real directory name under `public/`, e.g. `Mobile Compactor Storage System`. */
  folder: string;
  slug: string;
  images: ProductAssetFile[];
};

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

/**
 * Directories under `public/` that hold a company's own assets rather than one
 * product's photography. Everything else with images in it is treated as a
 * product folder, which is what makes the discovery data-driven: a ninth
 * product folder appears in the admin picker without a code change.
 */
const nonProductFolders = new Set([
  "assets",
  "illustrations",
  "icons",
  "images",
  "uploads",
  "brand",
  "documents",
  "files",
]);

/**
 * Folders whose name cannot be derived from the product they belong to.
 *
 * Only genuinely unmatchable pairs live here. Every other mapping is worked out
 * from the folder name, so renaming a product does not silently orphan its
 * photographs.
 */
const folderAliases: Record<string, string> = {
  "heavy-duty-pallet-racking": "HEAVY DUTY PALLET RACKING",
  "heavy-duty-long-span-racks": "HEAVY DUTY LONG SPAN RACKS",
  "heavy-duty-long-span-shelving-racks": "HEAVY DUTY LONG SPAN RACKS",
  "conventional-pallet-racking-system": "HEAVY DUTY PALLET RACKING",
  "medium-duty-shelving-racks": "MEDIUM DUTY SHELVING RACKS",
  "mobile-shelving-racks": "MOBILE SHELVING RACKS",
  "slotted-angle-racks": "SLOTTED ANGLE RACKS",
  "mezzanine-floor": "MEZZANINE FLOOR",
  lockers: "LOCKERS",
  // The CMS product is `compactor-storage-systems`; the folder predates it and
  // is named after the mechanism. Without this the one product with real client
  // photography had no folder at all.
  "compactor-storage-systems": "Mobile Compactor Storage System",
  "mobile-compactor-storage-system": "Mobile Compactor Storage System",
};

const fileCache = new Map<string, Promise<ProductAssetFile[]>>();
const folderCache = new Map<string, Promise<ProductAssetFolder[]>>();

/** Lower-cases and collapses anything that is not a letter or digit. */
export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Natural filename order, so `5.jpg` sorts after `3.jpg` and `IMG_2` before
 * `IMG_10` instead of the reverse.
 *
 * Implemented by comparing runs of digits as numbers and everything else by
 * code point, rather than with `localeCompare`. ICU collation was tried and is
 * the wrong tool here on two counts:
 *
 *  - it is locale-dependent, so the same folder can come back in a different
 *    order on a different machine or after an OS language change. This module's
 *    output decides the order images are imported in, and an import that lands
 *    in a different order every time is not a migration anyone can re-run
 *    safely;
 *  - its handling of the UUID-shaped names most of these photographs actually
 *    have is arbitrary. It compares `3bb65aae` before `25b40353` because the
 *    first digit run in the first is the single digit `3` and the first in the
 *    second is `25` — a defensible rule, but not one a person looking at the
 *    folder would predict, and not one worth inheriting.
 *
 * Separators sort before letters and digits so a nested-looking name such as
 * `IMG-20170630` groups with its own family rather than drifting into the
 * middle of the UUIDs.
 */
function byNaturalName(left: string, right: string) {
  const pattern = /(\d+)|(\D+)/g;
  const leftParts = left.match(pattern) ?? [left];
  const rightParts = right.match(pattern) ?? [right];
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const a = leftParts[index];
    const b = rightParts[index];
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    if (a === b) continue;
    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);
    if (aNumeric && bNumeric) {
      // Compared as numbers so `IMG_2` precedes `IMG_10`; equal-length digit
      // runs still tie-break on text so `01` and `1` keep a stable relative
      // order rather than depending on the sort implementation.
      const difference = Number(a) - Number(b);
      if (difference !== 0) return difference < 0 ? -1 : 1;
      return a < b ? -1 : 1;
    }
    if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
    return a < b ? -1 : 1;
  }
  return 0;
}

/**
 * The images directly inside a `public/` folder, in a stable order.
 *
 * Nothing is deleted, renamed or moved: this only reads. A missing folder yields
 * an empty list rather than throwing, because a product with no photographs is a
 * legitimate state.
 */
export function scanProductFolder(folder: string): Promise<ProductAssetFile[]> {
  const cached = fileCache.get(folder);
  if (cached) return cached;
  const result = readdir(path.join(process.cwd(), "public", folder), { withFileTypes: true })
    .then((entries) =>
      entries
        .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
        .map((entry) => entry.name)
        .sort(byNaturalName)
        .map((file) => ({ file, imageUrl: toPublicAssetUrl(folder, file) })),
    )
    .catch(() => []);
  fileCache.set(folder, result);
  return result;
}

/**
 * Every folder under `public/` that holds images, with those images.
 *
 * The result is cached for the life of the process, so a page that renders
 * several products reads the directory once. The cache is deliberately
 * process-local: the import script and the admin picker run in short-lived
 * processes, and the publish engine must always see the current file system.
 */
export async function listProductAssetFolders(): Promise<ProductAssetFolder[]> {
  const cached = folderCache.get("all");
  if (cached) return cached;
  const result = readdir(path.join(process.cwd(), "public"), { withFileTypes: true })
    .then(async (entries) => {
      const folders = entries
        .filter((entry) => entry.isDirectory() && !nonProductFolders.has(entry.name.toLowerCase()))
        .map((entry) => entry.name);
      const resolved = await Promise.all(
        folders.map(async (folder) => ({ folder, slug: normalizeName(folder), images: await scanProductFolder(folder) })),
      );
      return resolved.filter((entry) => entry.images.length > 0);
    })
    .catch(() => [] as ProductAssetFolder[]);
  folderCache.set("all", result);
  return result;
}

/**
 * The `public/` folder that holds a product's photographs, or null.
 *
 * Resolution order: the alias table, then an exact match on the product name,
 * then a match on the product slug. The name match matters because the folders
 * are the older record — `Mobile Compactor Storage System` is a folder, while
 * `Compactor Storage Systems` is the product the editors work with.
 */
export async function resolveProductAssetFolder(slug: string, productName?: string): Promise<ProductAssetFolder | null> {
  const folders = await listProductAssetFolders();
  if (!folders.length) return null;

  const alias = folderAliases[slug];
  if (alias) {
    const aliased = folders.find((folder) => folder.folder === alias);
    if (aliased) return aliased;
  }

  if (productName) {
    const normalized = normalizeName(productName);
    const byName = folders.find((folder) => normalizeName(folder.folder) === normalized);
    if (byName) return byName;
  }

  const normalizedSlug = normalizeName(slug);
  return (
    folders.find((folder) => folder.slug === normalizedSlug) ??
    folders.find((folder) => normalizedSlug.includes(folder.slug) || folder.slug.includes(normalizedSlug)) ??
    null
  );
}

/**
 * Editor-facing defaults for an imported photo.
 *
 * A caption and alt text are both mandatory in the CMS, and inventing a
 * descriptive sentence for a photo nobody has described yet would be worse than
 * an honest prompt. These are deliberately generic and obviously a starting
 * point for the editor to replace.
 */
function describeFile(file: string, productName: string, index: number) {
  const stem = file.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const isLogo = stem.toLowerCase() === "logo" || /logo/i.test(file);
  if (isLogo) return { label: `${productName} logo`, altText: `${productName} logo`, caption: `${productName} logo` };
  return {
    label: "",
    altText: `${productName} image ${index + 1}`,
    caption: "",
  };
}

/**
 * The photographs of a product, ready to be written to the CMS.
 *
 * This is the shape the import script inserts: the stable public URL, a `label`
 * the editor can overwrite, alt text that satisfies the accessibility rule
 * without claiming knowledge of the photo, and no Cloudinary public id — these
 * are site files, not CDN uploads, and must never be scheduled for deletion by
 * the upload pruner.
 */
export async function getProductFolderImages(slug: string, productName: string): Promise<ProductFolderImage[]> {
  const folder = await resolveProductAssetFolder(slug, productName);
  if (!folder) return [];
  const images = await scanProductFolder(folder.folder);
  return images.map((image, index) => {
    const described = describeFile(image.file, productName, index);
    return {
      id: `${slug}-${index + 1}`,
      imageUrl: image.imageUrl,
      altText: described.altText,
      caption: described.caption,
      label: described.label,
    };
  });
}

/** Drops the cached directory listings. Used by scripts that add files mid-run. */
export function resetProductAssetCache() {
  fileCache.clear();
  folderCache.clear();
}
