/**
 * Catalogue types, taxonomy and pure helpers — with no published data import.
 *
 * Why this module exists
 * ----------------------
 * `published-catalogue.ts` is the single read path for the catalogue and it
 * imports `src/data/products.json`, which is about a megabyte of product rows.
 * That is correct for the server. It was also, until this module existed, being
 * compiled into the browser bundle on every page: the header is a client
 * component that only needed the category list, the product card is a server
 * component that renders a client `QuoteButton`, and both reached the data
 * through `@/lib/catalogue`. Every visitor downloaded and parsed the entire
 * product catalogue — roughly 840 KB of the ~1.5 MB of initial JavaScript — to
 * build a navigation menu and a `<select>`.
 *
 * Everything here is either a type, a constant, or a pure function of data the
 * caller already has. Importing it can therefore never pull the published
 * payload into a client bundle, which is the entire point: components that
 * need a product list are handed one by the server as a prop, and components
 * that only need the taxonomy import this module and stop there.
 *
 * `published-catalogue.ts` imports from here and re-exports, so every existing
 * call site of `@/lib/catalogue` keeps working unchanged.
 */

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

/**
 * The minimal shape a `<select>` needs to offer every product.
 *
 * This is what the quote form is given instead of the catalogue. Forty-odd
 * `{slug, name, category}` pairs are a couple of kilobytes, where the full
 * catalogue — descriptions, specifications, features, galleries and SEO copy
 * for every product — is more than a megabyte.
 */
export type CatalogueProductOption = {
  slug: string;
  name: string;
  category: CatalogueCategorySlug;
};

// --------------------------------------------------------- category registry

export const CATEGORY_ORDER = ["office-storage", "industrial-storage", "material-handling"] as const;

export type CategorySeed = Omit<CatalogueCategory, "slug" | "productCount">;

export const categorySeeds: readonly (CategorySeed & { slug: string })[] = [
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
export function titleCaseSlug(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * The short product type used by the catalogue browser's filter and the card
 * kicker.
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

/** The category label for a product, falling back to a readable default. */
export function getProductTypeLabel(product: Pick<CatalogueProduct, "slug" | "category">): string {
  return productTypes[product.slug] ?? catalogueCategoryNames[product.category] ?? "Storage and handling equipment";
}

/**
 * The canonical product URL.
 *
 * A CMS product has two working addresses: `/products/<slug>` and
 * `/products/<category>/<slug>`. This returns the flat form, which is the
 * canonical one: the mega menu, the listing, the sitemap and every product card
 * link to it, and the category form renders the same product while pointing its
 * canonical at this address.
 *
 * Takes a product or a bare slug, so a caller holding only names and slugs —
 * the navigation, the quote form — does not need the whole catalogue.
 */
export function getProductHref(product: Pick<CatalogueProduct, "slug"> | string): string {
  const slug = typeof product === "string" ? product : product?.slug;
  return slug ? `/products/${slug}` : "/products";
}

/**
 * The canonical product URL for a CMS product row, from its bare slug.
 *
 * Same shape as {@link getProductHref} but without the empty-slug fallback: a
 * database row always has a slug, and callers that already hold one should not
 * be handed a category URL by accident. It lives here rather than in
 * `product-page.ts` because that module reaches the published catalogue, and
 * this function is needed by client components.
 */
export function getDatabaseProductHref(slug: string): string {
  return `/products/${slug}`;
}

/** The single blob of text the site search matches a product against. */
export function getProductSearchText(product: CatalogueProduct): string {
  return [
    product.name,
    product.slug,
    product.shortDescription,
    product.longDescription,
    ...product.applications,
    ...product.industries,
    ...product.features.flatMap((feature) => [feature.title, feature.description]),
    ...product.specifications.flatMap((specification) => [specification.label, specification.value]),
    ...product.variants,
  ]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Distinct applications across the given products, for the browser's filter. */
export function collectApplications(products: readonly CatalogueProduct[]): string[] {
  return Array.from(new Set(products.flatMap((product) => product.applications))).sort((a, b) => a.localeCompare(b));
}

/** Distinct industries across the given products, for the browser's filter. */
export function collectIndustries(products: readonly CatalogueProduct[]): string[] {
  return Array.from(new Set(products.flatMap((product) => product.industries))).sort((a, b) => a.localeCompare(b));
}

/** Distinct short product types across the given products. */
export function collectProductTypes(products: readonly CatalogueProduct[]): string[] {
  return Array.from(new Set(products.map((product) => getProductTypeLabel(product)))).sort((a, b) => a.localeCompare(b));
}

/**
 * Flattens full categories to the `{slug, name}` pair a category `<select>` needs.
 *
 * The browser is a client component and must not import the published
 * catalogue, so its category list arrives as a prop. Server pages that already
 * hold `CatalogueCategory` objects use this to build it without each one
 * re-deriving the same pair list.
 */
export function toBrowserCategories(
  categories: readonly Pick<CatalogueCategory, "slug" | "name">[],
): { slug: string; name: string }[] {
  return categories.map((category) => ({ slug: category.slug, name: category.name }));
}

/**
 * Sorts category slugs the way the site presents them: the three registered
 * categories first in their editorial order, then anything an editor introduced
 * in Admin, alphabetically.
 */
export function orderCategorySlugs(slugs: Iterable<string>): string[] {
  return [...new Set(slugs)].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a as (typeof CATEGORY_ORDER)[number]);
    const bi = CATEGORY_ORDER.indexOf(b as (typeof CATEGORY_ORDER)[number]);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
}