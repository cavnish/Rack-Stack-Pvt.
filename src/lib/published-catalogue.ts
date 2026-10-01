/**
 * The product catalogue, derived from published CMS data.
 *
 * Why this module exists
 * ----------------------
 * The site used to have two product systems. Eight products were rows in
 * `products`, editable in Admin and served from `src/data/products.json`. The
 * other thirty-two were a hardcoded array in `src/lib/catalogue.ts`, whose
 * names, descriptions, images, categories, ordering and SEO could only be
 * changed by editing TypeScript and redeploying. The header mega menu, the
 * category pages, the product listing, the catalogue browser, the related
 * rail and the homepage cards all read that array, so an editor who renamed a
 * product in Admin changed one page and left the rest showing the old name.
 *
 * All thirty-two are now rows in `products` (see
 * `scripts/import-catalogue-products.mts`). This module is the single read
 * path for the catalogue, and it reads the published payload like every other
 * public surface does. There is no second copy of a product anywhere: rename a
 * product in Admin, publish, and the mega menu, the listing, the category page,
 * the related rail and the homepage all show the new name because they are all
 * reading this one derived list.
 *
 * It is a leaf module on purpose. It imports the published JSON and nothing
 * else, so it can be imported by `data.ts`, by the publish pipeline and by
 * admin preview code without any of them creating a cycle. `catalogue.ts`
 * re-exports everything here, so the twenty-odd existing call sites keep
 * working against the derived data without being edited.
 *
 * Nothing here queries the database. The public catalogue is static-first: it
 * renders from the last published payload and stays readable with the database
 * switched off.
 *
 * Bundle boundary
 * ---------------
 * This module must never be imported by a client component. It pulls in
 * `products.json`, which is around a megabyte, and that is server-side weight
 * only. Types, the category taxonomy and the pure helpers live in
 * `./catalogue-shared`, which is safe to import from anywhere; anything that
 * renders in the browser should import from there, or be handed the products it
 * needs as a prop by a server component.
 */

import productsPayload from "@/data/products.json";
import { localAssetFor } from "@/lib/local-assets";
import {
  CATEGORY_ORDER,
  catalogueCategoryNames,
  categorySeeds,
  collectApplications,
  collectIndustries,
  collectProductTypes,
  getProductHref,
  getProductSearchText,
  getProductTypeLabel,
  orderCategorySlugs,
  titleCaseSlug,
  type CatalogueCategory,
  type CatalogueCategorySlug,
  type CatalogueImage,
  type CatalogueProduct,
  type CatalogueSeo,
  type CatalogueFeature,
  type CatalogueSpecification,
} from "@/lib/catalogue-shared";

// ------------------------------------------------------ published product I/O

type PublishedChild = Record<string, unknown>;

type PublishedProduct = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  longDescription: string | null;
  category: string;
  featured: boolean;
  displayOrder: number;
  heroImage: string | null;
  ogImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: string;
  isActive: boolean;
  features?: PublishedChild[];
  specifications?: PublishedChild[];
  applications?: PublishedChild[];
  configurations?: PublishedChild[];
  gallery?: PublishedChild[];
  images?: PublishedChild[];
  related?: PublishedChild[];
  industries?: PublishedChild[];
};

type PublishedPayload = { products?: PublishedProduct[] } | PublishedProduct[];

const published = (() => {
  const payload = productsPayload as unknown as PublishedPayload;
  const list = Array.isArray(payload) ? payload : (payload.products ?? []);
  // The publish pipeline already filters on status and isActive, so a product
  // that is a draft or switched off is not in this file at all. The check is
  // kept as a guard rather than a filter, because a payload that failed to
  // filter is a bug that should be visible, not silently papered over.
  return list.filter((product) => product.status === "PUBLISHED" && product.isActive !== false);
})();

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * A product's images, in the order the product page shows them.
 *
 * The gallery is the CMS system and is ordered by `displayOrder` with the
 * primary row first. `images` is the older table and is only consulted when a
 * product has no gallery row at all, so a product can never show its
 * photographs twice.
 */
function publishedImages(product: PublishedProduct): CatalogueImage[] {
  const gallery = (product.gallery ?? []).filter((row) => row.isActive !== false);
  const ordered = [...gallery].sort(
    (a, b) => Number(b.isPrimary === true) - Number(a.isPrimary === true),
  );
  const source = ordered.length
    ? ordered
    : (product.images ?? []).filter((row) => row.isActive !== false);

  const seen = new Set<string>();
  const images: CatalogueImage[] = [];
  for (const row of source) {
    const url = text(row.imageUrl);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    images.push({
      url: localAssetFor(url, "products") ?? url,
      alt: text(row.altText) || text(row.label) || text(row.caption) || product.name,
      caption: text(row.caption) || text(row.label),
    });
  }
  // A product with no gallery row still needs one picture for its card.
  if (!images.length) {
    const hero = text(product.heroImage) || text(product.ogImage);
    if (hero) images.push({ url: localAssetFor(hero, "products") ?? hero, alt: product.name, caption: "" });
  }
  return images;
}

function toCatalogueProduct(product: PublishedProduct): CatalogueProduct {
  const longDescription = text(product.longDescription) || text(product.shortDescription);
  const images = publishedImages(product);
  const title = text(product.metaTitle) || product.name;

  return {
    id: String(product.id),
    name: product.name,
    slug: product.slug,
    category: product.category,
    shortDescription: text(product.shortDescription),
    longDescription,
    applications: (product.applications ?? [])
      .filter((row) => row.isActive !== false)
      .map((row) => text(row.title) || text(row.application))
      .filter(Boolean),
    industries: (product.industries ?? [])
      .map((row) => text(row.name))
      .filter(Boolean),
    features: (product.features ?? [])
      .filter((row) => row.isActive !== false)
      .map((row) => ({ title: text(row.title), description: text(row.description) || text(row.shortDescription) }))
      .filter((feature) => feature.title),
    specifications: (product.specifications ?? [])
      .filter((row) => row.isActive !== false)
      .map((row) => ({ label: text(row.specificationName), value: text(row.specificationValue) }))
      .filter((specification) => specification.label),
    variants: (product.configurations ?? []).map((row) => text(row.title)).filter(Boolean),
    images,
    featured: product.featured === true,
    order: product.displayOrder ?? 0,
    seo: {
      title,
      description: text(product.metaDescription) || text(product.shortDescription),
      ogTitle: title,
      ogDescription: text(product.metaDescription) || text(product.shortDescription),
      ogImage: (() => {
        const source = text(product.ogImage) || images[0]?.url || "";
        return source ? (localAssetFor(source, "products") ?? source) : "";
      })(),
    },
  };
}

/** Every published product, in editor order then name. */
export const catalogueProducts: readonly CatalogueProduct[] = published
  .map(toCatalogueProduct)
  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

const bySlug = new Map(catalogueProducts.map((product) => [product.slug, product]));

/**
 * Every category slug in use: the registered ones, plus any category a product
 * has been filed under in Admin. Creating a category in Admin is therefore
 * enough to make it appear in the mega menu and the listing, with no deploy.
 */
export const catalogueCategorySlugs: readonly string[] = orderCategorySlugs([
  ...categorySeeds.map((seed) => seed.slug),
  ...catalogueProducts.map((product) => product.category).filter(Boolean),
]);

/**
 * The categories, with counts counted from the published products.
 *
 * `productCount` is derived, never stored, so it cannot drift from what the
 * listing actually shows. A category with no seed becomes a plain title-cased
 * entry rather than being dropped, so a product is never orphaned by being
 * filed under a new category.
 */
export const catalogueCategories: readonly CatalogueCategory[] = (() => {
  const counts = new Map<string, number>();
  for (const product of catalogueProducts) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }

  const seedBySlug = new Map(categorySeeds.map((seed) => [seed.slug, seed]));

  return catalogueCategorySlugs
    .map((slug, index) => {
      const seed = seedBySlug.get(slug);
      const productCount = counts.get(slug) ?? 0;
      if (seed) return { ...seed, image: localAssetFor(seed.image, "products") ?? seed.image, productCount };
      const name = titleCaseSlug(slug);
      return {
        slug,
        name,
        eyebrow: name,
        title: name,
        description: `Explore our range of ${name.toLowerCase()} products.`,
        image: localAssetFor(categorySeeds[0].image, "products") ?? categorySeeds[0].image,
        productCount,
        // Registered categories come first; a category introduced in Admin
        // sorts after all of them so the mega menu keeps a stable shape.
        order: CATEGORY_ORDER.length + index + 1,
        seo: {
          title: `${name} | Rack & Stack`,
          description: `Explore our range of ${name.toLowerCase()} products.`,
          ogTitle: `${name} | Rack & Stack`,
          ogDescription: `Explore our range of ${name.toLowerCase()} products.`,
          ogImage: localAssetFor(categorySeeds[0].image, "products") ?? categorySeeds[0].image,
        },
      } satisfies CatalogueCategory;
    })
    .sort((a, b) => a.order - b.order);
})();

// ------------------------------------------------------------- the accessors

export function getCatalogueProductBySlug(slug: string): CatalogueProduct | undefined {
  return bySlug.get(slug);
}

export function getCatalogueProductsByCategory(category: CatalogueCategorySlug | string): CatalogueProduct[] {
  return catalogueProducts.filter((product) => product.category === category);
}

export function getCatalogueCategory(slug: string): CatalogueCategory | undefined {
  return catalogueCategories.find((category) => category.slug === slug);
}

export const getCatalogueProductHref = getProductHref;

/**
 * The related rail.
 *
 * Curated relationships win, because an editor chose them. Anything the product
 * has not curated is filled from its own category, which is the only sensible
 * fallback for a product that has just been imported.
 */
export function getRelatedCatalogueProducts(product: CatalogueProduct | string, limit = 3): CatalogueProduct[] {
  const resolved = typeof product === "string" ? getCatalogueProductBySlug(product) : product;
  const maximum = Math.max(0, Math.trunc(limit));
  if (!resolved || maximum === 0) return [];

  const curated = published.find((row) => String(row.id) === resolved.id)?.related ?? [];
  const curatedProducts = curated
    .map((row) => bySlug.get(text(row.slug)))
    .filter((item): item is CatalogueProduct => Boolean(item));

  const sameCategory = catalogueProducts.filter(
    (item) => item.category === resolved.category && item.slug !== resolved.slug,
  );
  const others = catalogueProducts.filter(
    (item) => item.category !== resolved.category && item.slug !== resolved.slug,
  );

  const seen = new Set<string>();
  const result: CatalogueProduct[] = [];
  for (const candidate of [...curatedProducts, ...sameCategory, ...others]) {
    if (result.length >= maximum) break;
    if (seen.has(candidate.slug)) continue;
    seen.add(candidate.slug);
    result.push(candidate);
  }
  return result;
}

export const getCatalogueSearchText = getProductSearchText;
export const getCatalogueProductType = getProductTypeLabel;

export const getCatalogueApplications = (products: readonly CatalogueProduct[] = catalogueProducts): string[] =>
  collectApplications(products);
export const getCatalogueIndustries = (products: readonly CatalogueProduct[] = catalogueProducts): string[] =>
  collectIndustries(products);
export const getCatalogueProductTypes = (products: readonly CatalogueProduct[] = catalogueProducts): string[] =>
  collectProductTypes(products);

// ------------------------------------------------------- server-only exports

/**
 * The three values a navigation menu or a product `<select>` needs, with the
 * published catalogue flattened down to them.
 *
 * Passing this to a client component instead of letting it import the catalogue
 * is what keeps a megabyte of product rows out of the browser bundle: a name and
 * a slug per product is roughly two kilobytes.
 */
export function getCatalogueOptions() {
  return catalogueProducts.map((product) => ({ slug: product.slug, name: product.name, category: product.category }));
}

/** The mega-menu structure: each category with its products, in menu order. */
export function getCatalogueNavGroups() {
  return catalogueCategories.map((category) => ({
    slug: category.slug,
    name: category.name,
    eyebrow: category.eyebrow,
    title: category.title,
    description: category.description,
    image: category.image,
    productCount: category.productCount,
    order: category.order,
    seo: category.seo,
    products: getCatalogueProductsByCategory(category.slug).map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      href: getProductHref(product),
      category: product.category,
      shortDescription: product.shortDescription,
    })),
  }));
}

export {
  catalogueCategoryNames,
  categorySeeds,
  titleCaseSlug,
  type CatalogueCategory,
  type CatalogueCategorySlug,
  type CatalogueFeature,
  type CatalogueImage,
  type CatalogueProduct,
  type CatalogueSeo,
  type CatalogueSpecification,
};