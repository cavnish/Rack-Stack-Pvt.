/**
 * Resolves a product's primary image the same way its detail page does, for many
 * products at once.
 *
 * Why this exists
 * ---------------
 * The product detail page builds its image list in `src/lib/product-page.ts`
 * and takes the head of that list, with `heroImage`/`thumbnail` consulted only
 * when the product has no images at all. The homepage used to read `thumbnail`
 * directly off the product row instead, so the two resolved independently and
 * the card could show a completely different photograph from the page it linked
 * to — in practice a shared stock image, because `lockers` and
 * `compactor-storage-systems` share the same `thumbnail` value.
 *
 * This module is the batch form of that same resolution, so the homepage, the
 * category listings and the admin preview all ask one question in one place and
 * get one answer. It deliberately calls `getPrimaryProductImage` rather than
 * reimplementing the order — an ordering rule that exists in two places is an
 * ordering rule that will eventually exist in two different orders.
 *
 * Reordering a product's gallery, or flagging a different row as primary, moves
 * the head of the list — so the product page and the homepage card move to the
 * new image together with no second edit.
 *
 * Why it reads published data and not the database
 * ------------------------------------------------
 * This runs while rendering public pages. Reading `product_images` and
 * `product_gallery_images` here made every homepage render and every product
 * page's related-products strip issue two extra queries, which meant the site
 * needed the database to display content it had already published. The published
 * JSON already contains both lists, localisation has already been applied to
 * them, and the publish step is the only thing that is allowed to write it — so
 * reading it here is both cheaper and what makes the site work with the database
 * switched off. The database is consulted when no published file exists yet (a
 * first run before the first publish), which keeps a fresh checkout working.
 */

import { db, dbConfigured } from "@/db";
import { productGalleryImages, productImages } from "@/db/schema";
import { asc, inArray } from "drizzle-orm";
import { getProductFolderImages, type ProductFolderImage } from "@/lib/product-image-assets";
import { getPrimaryProductImage } from "@/lib/product-page";
import { readCollection } from "@/lib/publish/store";
import { logServer } from "@/lib/logger";

/** The product columns the primary image can come from. */
export type PrimaryImageCandidate = {
  id: number;
  slug: string;
  name: string;
  heroImage?: string | null;
  thumbnail?: string | null;
};

/** One row of either image table, reduced to what the ordering rule needs. */
type ImageRow = {
  imageUrl: string | null;
  isActive?: boolean | null;
  isPrimary?: boolean | null;
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
 * Gallery and image rows for many products, read from the published JSON.
 *
 * Returns `null` when there is no published file, which is the signal for the
 * caller to fall back to the database: that is a first-run checkout that has
 * never published, not a broken site.
 */
type PublishedProductImages = {
  images: Map<number, ImageRow[]>;
  gallery: Map<number, ImageRow[]>;
};

async function readPublishedProductImages(): Promise<PublishedProductImages | null> {
  const published = await readCollection<Array<Record<string, unknown>>>("products");
  if (!Array.isArray(published)) return null;
  const images = new Map<number, ImageRow[]>();
  const gallery = new Map<number, ImageRow[]>();
  for (const record of published) {
    const id = Number(record?.id);
    if (!Number.isFinite(id)) continue;
    const list = record.images;
    if (Array.isArray(list)) {
      images.set(
        id,
        list
          .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
          .map((row) => ({ imageUrl: (row.imageUrl as string | null) ?? null })),
      );
    }
    const galleryList = record.gallery;
    if (Array.isArray(galleryList)) {
      gallery.set(
        id,
        galleryList
          .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
          .map((row) => ({
            imageUrl: (row.imageUrl as string | null) ?? null,
            isActive: row.isActive as boolean | null,
            isPrimary: row.isPrimary as boolean | null,
          })),
      );
    }
  }
  return { images, gallery };
}

/**
 * The database form of the same read, for a checkout that has not published yet.
 */
async function readDatabaseProductImages(ids: number[]): Promise<PublishedProductImages> {
  const images = new Map<number, ImageRow[]>();
  const gallery = new Map<number, ImageRow[]>();
  let imageRows: Array<{ productId: number; imageUrl: string | null }> = [];
  let galleryRows: Array<{ productId: number; imageUrl: string | null; isActive: boolean; isPrimary: boolean }> = [];
  if (dbConfigured) {
    try {
      [imageRows, galleryRows] = await Promise.all([
        db
          .select({ productId: productImages.productId, imageUrl: productImages.imageUrl })
          .from(productImages)
          .where(inArray(productImages.productId, ids))
          .orderBy(asc(productImages.displayOrder)),
        db
          .select({
            productId: productGalleryImages.productId,
            imageUrl: productGalleryImages.imageUrl,
            isActive: productGalleryImages.isActive,
            isPrimary: productGalleryImages.isPrimary,
          })
          .from(productGalleryImages)
          .where(inArray(productGalleryImages.productId, ids))
          .orderBy(asc(productGalleryImages.displayOrder)),
      ]);
    } catch (error) {
      logServer("warn", "product_images.fetch.failed", {
        message: error instanceof Error ? error.message : "unknown",
        count: ids.length,
      });
    }
  }
  for (const row of imageRows) {
    const list = images.get(row.productId);
    if (list) list.push(row);
    else images.set(row.productId, [row]);
  }
  for (const row of galleryRows) {
    const list = gallery.get(row.productId);
    if (list) list.push(row);
    else gallery.set(row.productId, [row]);
  }
  return { images, gallery };
}

/**
 * Primary image per product, keyed by product id.
 *
 * Never throws: a published-data or filesystem problem degrades to the product's
 * own `thumbnail`/`heroImage` rather than taking the page down, because a card
 * with a slightly wrong image is far better than a homepage that will not render.
 */
export async function getPrimaryProductImages(
  products: readonly PrimaryImageCandidate[],
): Promise<Map<number, string>> {
  const resolved = new Map<number, string>();
  if (products.length === 0) return resolved;

  const ids = products.map((product) => product.id);
  const published = await readPublishedProductImages();
  const source = published ?? (await readDatabaseProductImages(ids));

  const rowsByProduct = source.images;
  const galleryByProduct = source.gallery;

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
        {
          heroImage: product.heroImage,
          thumbnail: product.thumbnail,
          images,
          gallery: galleryByProduct.get(product.id) ?? [],
        },
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

/**
 * The shape a "related products" row arrives in.
 *
 * A `related` entry is a trimmed-down product record: it has an id, a slug and
 * the two legacy image columns, but no gallery. It is also mixed — CMS rows
 * arrive with a numeric `id` and catalogue rows with a string one — so this type
 * has to allow both.
 */
export type RelatedImageCandidate = {
  id: string | number;
  slug: string;
  name: string;
  heroImage?: string | null;
  thumbnail?: string | null;
};

/**
 * Primary image for every product in a "related" list, keyed by `id`.
 *
 * This is what makes a related-products card show the same photograph as the
 * product page it links to. Reading `thumbnail` straight off the row does not:
 * the detail page leads with the head of `[...folderImages, ...product_images]`,
 * so a card that trusts the column shows a different image from its own target
 * and stops following the admin when the gallery is reordered.
 *
 * The two id shapes need different resolvers, because only a CMS row can be
 * looked up in `product_images`:
 *
 * - numeric id -> `getPrimaryProductImages`, which reads the gallery rows and
 *   the product's `public/` folder;
 * - string id -> `getPrimaryCatalogueImages`, which reads the `public/` folder
 *   and falls back to the catalogue's own image. `adaptCatalogueRelated` has
 *   already folded that image into `thumbnail`, so it is passed through as the
 *   single catalogue image, which reproduces the folder-images-first order that
 *   `adaptCatalogueProduct` uses.
 *
 * Keyed by `id` rather than by slug because that is what the caller already has
 * and it is unique within one list.
 */
export async function getRelatedProductImages(
  items: readonly RelatedImageCandidate[],
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  if (items.length === 0) return resolved;

  const cms = items.filter(
    (item): item is RelatedImageCandidate & { id: number } => typeof item.id === "number",
  );
  const catalogue = items.filter((item) => typeof item.id !== "number");

  const [cmsImages, catalogueImages] = await Promise.all([
    getPrimaryProductImages(cms),
    getPrimaryCatalogueImages(
      catalogue.map((item) => ({
        slug: item.slug,
        name: item.name,
        images: [{ url: item.thumbnail ?? "" }],
      })),
    ),
  ]);

  for (const [id, image] of cmsImages) resolved.set(String(id), image);
  for (const item of catalogue) {
    resolved.set(String(item.id), catalogueImages.get(item.slug) ?? item.thumbnail ?? "");
  }

  return resolved;
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
