/**
 * Resolves a product's primary image the same way its detail page does, for many
 * products at once.
 *
 * Why this exists
 * ---------------
 * The product detail page builds its image list in
 * `src/lib/product-page.ts` as `[...folderImages, ...product.images]` and takes
 * the head of that list, with `heroImage`/`thumbnail` consulted only when the
 * product has no images at all. The homepage used to read `thumbnail` directly
 * off the product row instead, so the two resolved independently and the card
 * could show a completely different photograph from the page it linked to — in
 * practice a shared stock image, because `lockers` and `compactor-storage-systems`
 * share the same `thumbnail` value.
 *
 * This module is the batch form of that same resolution, so the homepage, the
 * category listings and the admin preview all ask one question in one place and
 * get one answer. It deliberately calls `getPrimaryProductImage` rather than
 * reimplementing the order — an ordering rule that exists in two places is an
 * ordering rule that will eventually exist in two different orders.
 *
 * Reordering a product's gallery in the admin changes the head of the list, so
 * the product page and the homepage card move to the new first image together
 * with no second edit.
 */

import { db, dbConfigured } from "@/db";
import { productImages } from "@/db/schema";
import { asc, inArray } from "drizzle-orm";
import { getProductFolderImages, type ProductFolderImage } from "@/lib/product-image-assets";
import { getPrimaryProductImage } from "@/lib/product-page";
import { logServer } from "@/lib/logger";

/** The product columns the primary image can come from. */
export type PrimaryImageCandidate = {
  id: number;
  slug: string;
  name: string;
  heroImage?: string | null;
  thumbnail?: string | null;
};

function text(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * The fallback used when nothing else is available, and the value a product with
 * no images at all resolves to.
 *
 * `thumbnail` before `heroImage` matches the order the product table's own
 * columns are declared in, and is only ever reached for a product that has no
 * folder images and no `product_images` rows.
 */
function columnFallback(product: PrimaryImageCandidate): string {
  return text(product.thumbnail) || text(product.heroImage);
}

/**
 * Primary image per product, keyed by product id.
 *
 * Never throws: a database or filesystem problem degrades to the product's own
 * `thumbnail`/`heroImage` rather than taking the page down, because a card with
 * a slightly wrong image is far better than a homepage that will not render.
 */
export async function getPrimaryProductImages(
  products: readonly PrimaryImageCandidate[],
): Promise<Map<number, string>> {
  const resolved = new Map<number, string>();
  if (products.length === 0) return resolved;

  const ids = products.map((product) => product.id);

  /**
   * `product_images` for every product in one query rather than one each. A
   * homepage shows a row of cards, and the per-product query pattern used by
   * `getProductBySlug` would make this N round trips on the most requested page
   * on the site.
   */
  let imageRows: Array<{ productId: number; imageUrl: string | null }> = [];
  if (dbConfigured) {
    try {
      const rows = await db
        .select({ productId: productImages.productId, imageUrl: productImages.imageUrl })
        .from(productImages)
        .where(inArray(productImages.productId, ids))
        .orderBy(asc(productImages.displayOrder));
      imageRows = rows;
    } catch (error) {
      logServer("warn", "product_images.fetch.failed", {
        message: error instanceof Error ? error.message : "unknown",
        count: ids.length,
      });
    }
  }

  const rowsByProduct = new Map<number, Array<{ imageUrl: string | null }>>();
  for (const row of imageRows) {
    const list = rowsByProduct.get(row.productId);
    if (list) list.push(row);
    else rowsByProduct.set(row.productId, [row]);
  }

  await Promise.all(
    products.map(async (product) => {
      let folderImages: ProductFolderImage[] = [];
      try {
        folderImages = await getProductFolderImages(product.slug, product.name);
      } catch (error) {
        // `getProductFolderImages` already swallows a missing folder; this only
        // guards an unexpected filesystem failure.
        logServer("warn", "product.folder_images.failed", {
          slug: product.slug,
          message: error instanceof Error ? error.message : "unknown",
        });
      }

      const images = rowsByProduct.get(product.id) ?? [];
      const image = getPrimaryProductImage(
        { heroImage: product.heroImage, thumbnail: product.thumbnail, images },
        folderImages,
      );
      resolved.set(product.id, image || columnFallback(product));
    }),
  );

  return resolved;
}

/** The same resolution for a single product, for callers that only need one. */
export async function getPrimaryProductImageFor(
  product: PrimaryImageCandidate,
): Promise<string> {
  const map = await getPrimaryProductImages([product]);
  return map.get(product.id) || columnFallback(product);
}

/** The fields of a `catalogue.ts` product this module reads. */
export type PrimaryCatalogueImageCandidate = {
  slug: string;
  name: string;
  images: readonly { url?: string | null }[];
};

/**
 * Primary image per catalogue product, keyed by slug.
 *
 * Catalogue products have no database row, so they cannot go through
 * `getPrimaryProductImages` — but they can and do have `public/` folders, and
 * `adaptCatalogueProduct` puts folder images ahead of the catalogue's own. A
 * homepage card for one of those products has to make the same choice, or it
 * shows a different photograph from the page it links to.
 *
 * The order is deliberately the same as `adaptCatalogueProduct`: folder images
 * first, then the catalogue's own images. Note that the catalogue path passes no
 * `heroImage`/`thumbnail` to the resolver, because a catalogue product has
 * neither — inventing a fallback here would mean the homepage could show an
 * image the product page does not.
 */
export async function getPrimaryCatalogueImages(
  products: readonly PrimaryCatalogueImageCandidate[],
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  await Promise.all(
    products.map(async (product) => {
      let folderImages: ProductFolderImage[] = [];
      try {
        folderImages = await getProductFolderImages(product.slug, product.name);
      } catch (error) {
        logServer("warn", "product.folder_images.failed", {
          slug: product.slug,
          message: error instanceof Error ? error.message : "unknown",
        });
      }
      const catalogueImages = product.images.map((image) => ({ imageUrl: image.url ?? null }));
      const image = getPrimaryProductImage(
        { images: folderImages.length > 0 ? [...folderImages, ...catalogueImages] : catalogueImages },
        [],
      );
      resolved.set(product.slug, image);
    }),
  );
  return resolved;
}
