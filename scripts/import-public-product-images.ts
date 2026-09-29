/**
 * Imports the product photography that already lives in `public/` into the CMS.
 *
 * Why this exists
 * ---------------
 * The eight product pages were built from stock photography: every row in
 * `product_images` and `product_gallery_images` pointed at `images.pexels.com`.
 * The real photographs — the ones the business actually wants shown, which have
 * been sitting in `public/HEAVY DUTY PALLET RACKING/` and seven sibling folders
 * all along — were invisible to the CMS. There was no row to caption, no way to
 * reorder them, no primary to choose, and therefore no way for the admin to
 * manage a single one of them without re-uploading files the repository
 * already contained.
 *
 * This script closes that gap. It reads the folders, registers every image it
 * finds as a gallery row, and leaves the files exactly where they are.
 *
 * What it guarantees
 * ------------------
 *  - It never writes, moves, renames or deletes a file in `public/`. The script
 *    only reads the directory listing and writes rows to PostgreSQL. Removing
 *    the product's photographs is a decision for a person, not for a migration.
 *  - It is idempotent. Re-running it does not duplicate rows, because rows are
 *    matched on the image URL, which `toPublicAssetUrl` derives deterministically
 *    from the folder and file name.
 *  - Editor decisions survive. A caption, alt text, title, visibility or
 *    position already set on a row is kept; the script only fills in blanks and
 *    adds rows that do not exist yet.
 *  - The primary image is a real photograph. Whichever row leads after the
 *    merge is flagged primary, and the product's `heroImage`/`thumbnail` columns
 *    are re-derived from it so the homepage card, the related-product cards and
 *    the social share image all show the same shot as the product page.
 *
 * Usage
 * -----
 *   npm run images:import              # import and report
 *   npm run images:import -- --dry-run # report only, write nothing
 */

import "dotenv/config";
import { eq, inArray, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  productGalleryImages,
  productImages,
  products,
  productSections,
} from "@/db/schema";
import {
  getProductFolderImages,
  listProductAssetFolders,
  resetProductAssetCache,
  resolveProductAssetFolder,
} from "@/lib/product-image-assets";
import { getPrimaryGalleryImageUrl, normalizeGalleryPrimaries } from "@/lib/product-primary-image";
import { productGallerySlots } from "@/lib/product-gallery-slots";
import { stableImageUrl } from "@/lib/public-asset-paths";

const dryRun = process.argv.includes("--dry-run");

/**
 * Host that only ever supplied stock photography.
 *
 * Rows pointing here are the placeholders this migration exists to replace, so
 * they are the one category removed from the gallery. Anything else — a real
 * Cloudinary upload, a hand-pasted URL — is a deliberate choice by an editor and
 * is left in place. The host is matched exactly rather than by substring so a
 * URL that merely mentions the word cannot be caught by it.
 */
const PLACEHOLDER_HOSTS = new Set(["images.pexels.com", "www.pexels.com", "pexels.com"]);

function isPlaceholder(url: string): boolean {
  const match = /^https?:\/\/([^/]+)/i.exec(url.trim());
  return match ? PLACEHOLDER_HOSTS.has(match[1].toLowerCase()) : false;
}

/**
 * Default copy for an imported photograph, in slot order.
 *
 * The first six images of a product adopt the captions the previous six-slot
 * design used — "Warehouse Installation", "Close-Up View" and so on — so the
 * page keeps the wording it had before the gallery became unlimited. Images
 * beyond the sixth are numbered instead of being given an invented description:
 * claiming a photo shows something specific is worse than saying plainly that
 * the editor still has to caption it.
 */
function describeImage(productName: string, index: number): { label: string; altText: string; caption: string } {
  const slot = productGallerySlots[index];
  if (slot) {
    return {
      label: slot.label,
      altText: `${productName}: ${slot.altHint}`,
      caption: slot.fallbackCaption,
    };
  }
  return {
    label: "",
    altText: `${productName}: product photograph ${index + 1}`,
    caption: "",
  };
}

type Report = {
  slug: string;
  folder: string | null;
  added: number;
  kept: number;
  placeholdersRemoved: number;
  total: number;
  primary: string;
};

async function main() {
  resetProductAssetCache();
  const folders = await listProductAssetFolders();
  const rows = await db.select().from(products).orderBy(asc(products.displayOrder));
  const reports: Report[] = [];

  for (const product of rows) {
    const folder = await resolveProductAssetFolder(product.slug, product.name);
    const discovered = folder ? await getProductFolderImages(product.slug, product.name) : [];
    const existing = await db
      .select()
      .from(productGalleryImages)
      .where(eq(productGalleryImages.productId, product.id))
      .orderBy(asc(productGalleryImages.displayOrder));

    if (!folder) {
      reports.push({
        slug: product.slug,
        folder: null,
        added: 0,
        kept: existing.length,
        placeholdersRemoved: 0,
        total: existing.length,
        primary: getPrimaryGalleryImageUrl(existing),
      });
      continue;
    }

    /**
     * Existing rows keyed by their normalised URL.
     *
     * Normalising matters: the database may hold a row written with a
     * differently-encoded but equivalent path, and matching the raw string would
     * import the same photograph twice.
     */
    const byUrl = new Map(existing.map((row) => [stableImageUrl(row.imageUrl), row]));

    // Preserve the editor's existing order, then append newly discovered images.
    const merged: Array<{ imageUrl: string; label: string | null; altText: string; caption: string | null; isActive: boolean; slot: string | null }> = [];

    for (const row of existing) {
      const url = stableImageUrl(row.imageUrl);
      const isDiscovered = discovered.some((item) => stableImageUrl(item.imageUrl) === url);
      // A stock placeholder is dropped: the photograph it stood in for is about
      // to be registered from `public/`. A row the editor uploaded or chose is
      // kept whether or not a folder image duplicates it.
      if (isPlaceholder(row.imageUrl) && !isDiscovered) {
        continue;
      }
      merged.push({
        imageUrl: row.imageUrl,
        label: row.label,
        altText: row.altText,
        caption: row.caption,
        isActive: row.isActive,
        slot: row.slot,
      });
    }

    let added = 0;
    const mergedUrls = new Set(merged.map((item) => stableImageUrl(item.imageUrl)));
    for (const item of discovered) {
      if (mergedUrls.has(stableImageUrl(item.imageUrl))) continue;
      const defaults = describeImage(product.name, merged.length);
      merged.push({
        imageUrl: item.imageUrl,
        // A caption or title the editor already wrote for a discovered image is
        // not overwritten: this only fills in a blank.
        label: item.label || defaults.label,
        altText: item.altText || defaults.altText,
        caption: item.caption || defaults.caption,
        isActive: true,
        slot: null,
      });
      mergedUrls.add(stableImageUrl(item.imageUrl));
      added += 1;
    }

    const normalized = normalizeGalleryPrimaries(
      merged.map((item, index) => ({ ...item, displayOrder: index })),
    );
    const primary = getPrimaryGalleryImageUrl(normalized);

    const placeholdersRemoved = existing.filter(
      (row) => isPlaceholder(row.imageUrl) && !discovered.some((item) => stableImageUrl(item.imageUrl) === stableImageUrl(row.imageUrl)),
    ).length;

    if (!dryRun) {
      await db.transaction(async (tx) => {
        await tx.delete(productGalleryImages).where(eq(productGalleryImages.productId, product.id));
        if (normalized.length) {
          await tx.insert(productGalleryImages).values(
            normalized.map((item, index) => ({
              productId: product.id,
              slot: item.slot ?? null,
              label: item.label || null,
              imageUrl: item.imageUrl,
              // Never a public id: every one of these is a file in the repository,
              // and a public id is what tells the upload pruner a file may be
              // destroyed. Marking a repository file as removable is the one way
              // this migration could lose the photography.
              cloudinaryPublicId: null,
              altText: item.altText || `${product.name} product image`,
              caption: item.caption || null,
              isActive: item.isActive,
              isPrimary: Boolean(item.isPrimary),
              displayOrder: index,
            })),
          );
        }

        /**
         * Mirror the gallery into `product_images`.
         *
         * Two tables hold product photographs and both are read by the
         * published payload, so leaving them disagreeing would mean the same
         * product showed one photo in its hero and another in the page's image
         * list. The gallery is the list the admin edits, so it is the one that
         * wins, and this table is kept in step for the readers that still use it.
         */
        await tx.delete(productImages).where(eq(productImages.productId, product.id));
        if (normalized.length) {
          await tx.insert(productImages).values(
            normalized.map((item, index) => ({
              productId: product.id,
              imageUrl: item.imageUrl,
              cloudinaryPublicId: null,
              altText: item.altText,
              caption: item.caption,
              displayOrder: index,
            })),
          );
        }

        await tx
          .update(products)
          .set({
            heroImage: primary || null,
            heroImagePublicId: null,
            thumbnail: primary || null,
            thumbnailPublicId: null,
            // The social share image falls back to the primary at render time;
            // clearing a stock placeholder here means it can never be published
            // as the card image on a link someone pastes into Slack.
            ogImage: product.ogImage && !isPlaceholder(product.ogImage) ? product.ogImage : primary || null,
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));
      });
    }

    reports.push({
      slug: product.slug,
      folder: folder.folder,
      added,
      kept: merged.length - added,
      placeholdersRemoved,
      total: merged.length,
      primary,
    });
  }

  console.log(`\n${dryRun ? "[dry run] " : ""}Product image import\n`);
  console.table(reports);

  const withSections = await db.select({ slug: products.slug }).from(products);
  const sectionCount = await db.select({ id: productSections.id }).from(productSections);
  console.log(`\nProducts: ${withSections.length}`);
  console.log(`Content section rows currently in the database: ${sectionCount.length}`);
  console.log(`Folders discovered under public/: ${folders.length}`);
  for (const entry of folders) {
    console.log(`  ${entry.folder} — ${entry.images.length} image(s)`);
  }
  const totalImages = reports.reduce((sum, entry) => sum + entry.total, 0);
  console.log(`\nTotal gallery rows after import: ${totalImages}`);
  if (dryRun) console.log("\nDry run: nothing was written.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Product image import failed:", error);
    process.exitCode = 1;
  });
