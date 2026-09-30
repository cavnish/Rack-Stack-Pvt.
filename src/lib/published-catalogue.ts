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
 */

import productsPayload from "@/data/products.json";
import { localAssetFor } from "@/lib/local-assets";

// ---------------------------------------------------------------- the types

export type CatalogueSeo = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
};

export type CatalogueCategory = {
  slug: CatalogueCategorySlug;
  name: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  /** Counted from the published products, never stored. */
  productCount: number;
  order: number;
  seo: CatalogueSeo;
};

export type CatalogueFeature = {
  title: string;
  description: string;
};

export type CatalogueSpecification = {
  label: string;
  value: string;
};

export type CatalogueImage = {
  url: string;
  alt: string;
  caption: string;
};

export type CatalogueProduct = {
  /** The CMS row id. Stable, and what `related` and cards resolve against. */
  id: string;
  name: string;
  slug: string;
  category: CatalogueCategorySlug;
  shortDescription: string;
  longDescription: string;
  applications: string[];
  industries: string[];
  features: CatalogueFeature[];
  specifications: CatalogueSpecification[];
  variants: string[];
  images: CatalogueImage[];
  featured: boolean;
  order: number;
  seo: CatalogueSeo;
};

/** The category slugs the site recognises, plus any a product has introduced. */
export type CatalogueCategorySlug = string;

// --------------------------------------------------------- category registry

const CATEGORY_ORDER = ["office-storage", "industrial-storage", "material-handling"] as const;

type CategorySeed = Omit<CatalogueCategory, "slug" | "productCount">;

const categorySeeds: readonly (CategorySeed & { slug: string })[] = [
  {
    slug: "office-storage",
    name: "Office Storage Systems",
    eyebrow: "Office Storage",
    title: "Space-smart storage for records and workplaces",
    description:
      "Mobile shelving, filing cabinets, pedestals, tables and lockers planned around office storage needs and available space.",
    image: "https://images.pexels.com/photos/36126272/pexels-photo-36126272.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
    order: 1,
    seo: {
      title: "Office Storage Systems | Rack & Stack",
      description:
        "Explore mobile compactor shelving, filing cabinets, office cupboards, pedestals, tables and lockers for organised storage.",
      ogTitle: "Office Storage Systems | Rack & Stack",
      ogDescription:
        "Explore mobile compactor shelving, filing cabinets, office cupboards, pedestals, tables and lockers for organised storage.",
      ogImage: "https://images.pexels.com/photos/36126272/pexels-photo-36126272.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
    },
  },
  {
    slug: "industrial-storage",
    name: "Industrial Storage Systems",
    eyebrow: "Industrial Storage",
    title: "Storage systems built around your inventory",
    description:
      "Industrial racking and platform systems for warehouses, factories, workshops and stockrooms, configured to project requirements.",
    image: "https://images.pexels.com/photos/36126305/pexels-photo-36126305.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
    order: 2,
    seo: {
      title: "Industrial Storage Systems | Rack & Stack",
      description:
        "Explore slotted angle racks, long span shelving, pallet racking, multi-tier systems, mezzanine floors and cantilever racks.",
      ogTitle: "Industrial Storage Systems | Rack & Stack",
      ogDescription:
        "Explore slotted angle racks, long span shelving, pallet racking, multi-tier systems, mezzanine floors and cantilever racks.",
      ogImage: "https://images.pexels.com/photos/36126305/pexels-photo-36126305.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
    },
  },
  {
    slug: "material-handling",
    name: "Material Handling Equipment",
    eyebrow: "Material Handling",
    title: "Equipment for moving, lifting and loading",
    description:
      "Pallets, trolleys, stackers, cranes and lifting platforms for warehouse, factory and loading-bay material handling.",
    image: "https://images.pexels.com/photos/8760709/pexels-photo-8760709.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
    order: 3,
    seo: {
      title: "Material Handling Equipment | Rack & Stack",
      description:
        "Explore pallets, pallet trucks, dock levelers, stackers, cranes and lifting platforms for industrial material handling.",
      ogTitle: "Material Handling Equipment | Rack & Stack",
      ogDescription:
        "Explore pallets, pallet trucks, dock levelers, stackers, cranes and lifting platforms for industrial material handling.",
      ogImage: "https://images.pexels.com/photos/8760709/pexels-photo-8760709.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
    },
  },
];

/**
 * Human name for a category slug.
 *
 * An editor can file a product under a category that has no entry here, so an
 * unknown slug is title-cased from itself rather than rendering as a raw slug.
 */
export const catalogueCategoryNames: Record<string, string> = Object.fromEntries(
  categorySeeds.map((seed) => [seed.slug, seed.name]),
);

/** Turns `office-storage` into `Office Storage` for an unknown category. */
function titleCaseSlug(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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
export const catalogueCategorySlugs: readonly string[] = (() => {
  const seen = new Set<string>(categorySeeds.map((seed) => seed.slug));
  for (const product of catalogueProducts) if (product.category) seen.add(product.category);
  return [...seen].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a as (typeof CATEGORY_ORDER)[number]);
    const bi = CATEGORY_ORDER.indexOf(b as (typeof CATEGORY_ORDER)[number]);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
})();

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

/**
 * The canonical product URL.
 *
 * A CMS product has two working addresses: `/products/<slug>` and
 * `/products/<category>/<slug>`. This returns the category form, which is the
 * one the mega menu, the listing and the category pages link to and the one the
 * business uses publicly. The flat form redirects to this.
 */
export function getCatalogueProductHref(product: CatalogueProduct | string): string {
  const resolved = typeof product === "string" ? getCatalogueProductBySlug(product) : product;
  if (!resolved) return "/products";
  return `/products/${resolved.category}/${resolved.slug}`;
}

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

export function getCatalogueSearchText(product: CatalogueProduct | string): string {
  const resolved = typeof product === "string" ? getCatalogueProductBySlug(product) : product;
  if (!resolved) return "";

  return [
    resolved.name,
    resolved.slug,
    resolved.shortDescription,
    resolved.longDescription,
    ...resolved.applications,
    ...resolved.industries,
    ...resolved.features.flatMap((feature) => [feature.title, feature.description]),
    ...resolved.specifications.flatMap((specification) => [specification.label, specification.value]),
    ...resolved.variants,
  ]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The short product type used by the catalogue browser's filter.
 *
 * Keyed by slug rather than by the old hardcoded id, because the id is now a
 * database id that differs per environment.
 */
const productTypes: Record<string, string> = {
  "mobile-compactor-storage-system": "Mobile compactor",
  "push-pull-compactor-system": "Push-pull compactor",
  "office-storewell-cupboard": "Office cupboard",
  "frfc-filing-cabinet": "Filing cabinet",
  "2-drawer-filing-cabinet": "Filing cabinet",
  "3-drawer-filing-cabinet": "Filing cabinet",
  "4-drawer-filing-cabinet": "Filing cabinet",
  pedestals: "Office pedestal",
  "office-tables": "Office table",
  "four-tier-lockers": "Lockers",
  "eight-tier-lockers": "Lockers",
  "twelve-tier-lockers": "Lockers",
  "eighteen-tier-lockers": "Lockers",
  "slotted-angle-racks": "Slotted angle rack",
  "heavy-duty-long-span-shelving-racks": "Long span shelving",
  "conventional-pallet-racking-system": "Pallet racking",
  "multi-tier-racking-system": "Multi-tier racking",
  "mezzanine-floor": "Mezzanine floor",
  "cantilever-racking-system": "Cantilever racking",
  "ms-pallet": "Pallet",
  "wooden-pallet": "Pallet",
  "hydraulic-pallet-truck": "Pallet truck",
  "drum-loading-trolley": "Drum trolley",
  "dock-leveler": "Dock leveler",
  "high-level-front-dumper": "Front dumper",
  "manual-mechanical-stacker": "Manual stacker",
  "battery-hydraulic-stacker": "Battery stacker",
  "floor-crane": "Floor crane",
  "multi-scissors-lift-platform": "Scissor lift",
  "hydraulic-stacker": "Hydraulic stacker",
  "scissors-lift-platform": "Scissor lift",
  "porter-goods-lifting-platform": "Goods lifting platform",
  // The products that predate the catalogue import.
  "mobile-shelving-racks": "Mobile shelving",
  lockers: "Lockers",
  "heavy-duty-long-span-racks": "Long span racking",
  "heavy-duty-pallet-racking": "Pallet racking",
  "medium-duty-shelving-racks": "Shelving",
};

export function getCatalogueProductType(product: CatalogueProduct | string): string {
  const resolved = typeof product === "string" ? getCatalogueProductBySlug(product) : product;
  if (!resolved) return "";
  return productTypes[resolved.slug] ?? catalogueCategoryNames[resolved.category] ?? "Storage and handling equipment";
}

export function getCatalogueApplications(products: readonly CatalogueProduct[] = catalogueProducts): string[] {
  return Array.from(new Set(products.flatMap((product) => product.applications))).sort((a, b) => a.localeCompare(b));
}

export function getCatalogueIndustries(products: readonly CatalogueProduct[] = catalogueProducts): string[] {
  return Array.from(new Set(products.flatMap((product) => product.industries))).sort((a, b) => a.localeCompare(b));
}

export function getCatalogueProductTypes(products: readonly CatalogueProduct[] = catalogueProducts): string[] {
  return Array.from(new Set(products.map((product) => getCatalogueProductType(product)))).sort((a, b) => a.localeCompare(b));
}
