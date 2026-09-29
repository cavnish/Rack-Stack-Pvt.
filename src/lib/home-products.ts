/**
 * Resolving the homepage "What We Offer" cards.
 *
 * A card is a *pointer* to a product, not a copy of one. The columns on
 * `home_offer_cards` are overrides: leave one empty and the card shows the
 * product's own name, description, image, category and URL. That is the whole
 * point — an editor renames a product or swaps its photo in Products, and the
 * homepage follows without a second edit and without the two drifting apart.
 *
 * A card can point at either kind of product:
 *
 * - **CMS products**, which are rows in `products` and are referenced by
 *   `productId`. Deleting the product deletes its card, so a homepage can never
 *   point at something that no longer exists.
 * - **Catalogue products**, which are defined in `src/lib/catalogue.ts` and have
 *   no database row at all. These are referenced by `slug`.
 *
 * Both are indexed here into one lookup so every caller resolves cards the same
 * way, whether it is the homepage, the publish pipeline or the admin preview.
 */

import {
  catalogueCategoryNames,
  getCatalogueProductBySlug,
  getCatalogueProductHref,
  type CatalogueProduct,
} from "@/lib/catalogue";
import { getDatabaseProductHref } from "@/lib/product-page";

/** A product as the home cards need it, flattened from either source. */
export type HomeProductOption = {
  /** `null` for a catalogue product, which has no row in `products`. */
  id: number | null;
  name: string;
  slug: string;
  /** The raw category value, e.g. `industrial-storage`. Rendered uppercase. */
  category: string;
  shortDescription: string;
  /** First available image from the product's own artwork. */
  image: string;
  /** The canonical product detail URL. */
  href: string;
};

export type ProductIndex = {
  byId: Map<number, HomeProductOption>;
  bySlug: Map<string, HomeProductOption>;
  /** Every selectable product, DB first, de-duplicated by slug. */
  all: HomeProductOption[];
};

/** The subset of a `home_offer_cards` row this module reads. */
export type HomeProductCardRow = {
  id: number;
  productId: number | null;
  slug: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  /** Not read here, but the owner of the override image is needed to clear it. */
  imagePublicId: string | null;
  altText: string | null;
  category: string | null;
  href: string | null;
  ctaLabel: string | null;
  showQuoteButton: boolean;
  isActive: boolean;
  displayOrder: number;
};

/** A card with every override applied — the exact shape the renderer consumes. */
export type HomeProductCard = {
  id: number;
  productId: number | null;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  image: string;
  alt: string;
  href: string;
  quoteHref: string;
  ctaLabel: string;
  showQuoteButton: boolean;
  isActive: boolean;
  displayOrder: number;
  /**
   * Which fields this card overrides. Surfaced in the admin so an editor can see
   * at a glance why a card is not showing the product's own copy.
   */
  overrides: string[];
};

/** Minimal shape of a `products` row needed to build an option. */
type DatabaseProductLike = {
  id: number;
  name: string;
  slug: string;
  category: string | null;
  shortDescription: string | null;
  thumbnail: string | null;
  heroImage: string | null;
};

function text(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * How a product's card image is decided.
 *
 * `primaryImages` is keyed by product id and produced by
 * `getPrimaryProductImages` (`src/lib/product-primary-images.ts`), which runs
 * the *same* resolution as the product detail page. It is required rather than
 * optional so this module cannot fall back to a cheaper rule and quietly
 * reintroduce a second answer to "which image is this product's primary one" —
 * that regression is exactly what the homepage had before: it read `thumbnail`
 * off the product row, while the detail page took the head of
 * `[...gallery, ...product.images, ...folderImages]`, and the two showed different
 * photographs for the same product.
 */
function toOption(
  product: DatabaseProductLike,
  primaryImages: ReadonlyMap<number, string>,
): HomeProductOption {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: text(product.category),
    shortDescription: text(product.shortDescription),
    image: primaryImages.get(product.id) || "",
    // The row is a CMS product, so it gets the CMS product's route. Resolving
    // the slug through `getProductHref` would hand the link to a same-slug
    // catalogue product whenever one exists — a different product on a different
    // page — which is exactly the "card opens the wrong product" bug.
    href: getDatabaseProductHref(product.slug),
  };
}

function toCatalogueOption(
  product: CatalogueProduct,
  primaryImages: ReadonlyMap<string, string>,
): HomeProductOption {
  return {
    id: null,
    name: product.name,
    slug: product.slug,
    category: product.category,
    shortDescription: text(product.shortDescription),
    // Same rule as the CMS branch: the product page's own primary image, not a
    // second opinion. A catalogue product that has a `public/` folder shows a
    // folder image on its detail page, so the card must too.
    image: primaryImages.get(product.slug) ?? "",
    href: getCatalogueProductHref(product),
  };
}

/** Inputs to {@link buildProductIndex}. */
export type ProductIndexInput = {
  databaseProducts: readonly DatabaseProductLike[];
  /** Primary image by product id, from `getPrimaryProductImages`. */
  primaryImages: ReadonlyMap<number, string>;
  catalogueProducts: readonly CatalogueProduct[];
  /** Primary image by slug, from `getPrimaryCatalogueImages`. */
  cataloguePrimaryImages: ReadonlyMap<string, string>;
};

/**
 * Builds the product lookup the cards resolve against.
 *
 * Both primary-image maps are required rather than optional so this module
 * cannot fall back to a cheaper rule and quietly reintroduce a second answer to
 * "which image is this product's primary one" — that regression is exactly what
 * the homepage had before: it read `thumbnail` off the product row, while the
 * detail page took the head of `[...folderImages, ...product.images]`, and the
 * two showed different photographs for the same product.
 *
 * Catalogue products are only folded in for slugs the database does not already
 * claim: if a product has been imported into the CMS it is the richer, editable
 * record and must win, or a card would silently stop following CMS edits.
 */
export function buildProductIndex({
  databaseProducts,
  primaryImages,
  catalogueProducts,
  cataloguePrimaryImages,
}: ProductIndexInput): ProductIndex {
  const byId = new Map<number, HomeProductOption>();
  const bySlug = new Map<string, HomeProductOption>();
  const all: HomeProductOption[] = [];

  for (const product of databaseProducts) {
    const option = toOption(product, primaryImages);
    byId.set(option.id as number, option);
    bySlug.set(option.slug, option);
    all.push(option);
  }

  for (const product of catalogueProducts) {
    if (bySlug.has(product.slug)) continue;
    const option = toCatalogueOption(product, cataloguePrimaryImages);
    bySlug.set(option.slug, option);
    all.push(option);
  }

  all.sort((a, b) => a.name.localeCompare(b.name));
  return { byId, bySlug, all };
}

/**
 * Looks a card's product up.
 *
 * `productId` wins over `slug` so a card bound to a CMS row keeps following that
 * row even if its slug text has gone stale. A card whose product has been
 * deleted (or that was never bound to one) falls through to `null` and is
 * reported as unresolvable rather than rendering an empty card.
 */
export function findCardProduct(row: HomeProductCardRow, index: ProductIndex): HomeProductOption | null {
  if (row.productId !== null && row.productId !== undefined && index.byId.has(row.productId)) {
    return index.byId.get(row.productId) ?? null;
  }
  const slug = text(row.slug);
  return slug ? index.bySlug.get(slug) ?? null : null;
}

/**
 * Applies the overrides on one card row.
 *
 * Returns `null` for a card that points at nothing, so a caller can drop it
 * instead of rendering a blank tile. The home cards therefore degrade to fewer
 * cards rather than to broken ones.
 */
export function resolveHomeProductCard(
  row: HomeProductCardRow,
  index: ProductIndex,
): HomeProductCard | null {
  const product = findCardProduct(row, index);

  /**
   * The product's slug, not the card's.
   *
   * The card row's `slug` column used to win. It is a text copy of a value the
   * product owns, so the moment an editor renamed a product in the CMS the
   * homepage kept building links from the stale text — the card's own URL came
   * from `product.href` and was correct, while its `View Product` query link and
   * the quote form still carried the old slug, so a quote raised from the
   * homepage arrived for a product that no longer existed under that name. A
   * bound card takes its slug from the product it resolved to; `row.slug` is only
   * used to *find* a product, never to name one.
   */
  const slug = product?.slug || text(row.slug);
  if (!product && !slug) return null;

  /**
   * The product's name, for the same reason as the slug above.
   *
   * `row.title` used to win here, so a product renamed in the CMS kept its old
   * name on the homepage. It is retained only as a fallback for a card that
   * resolved to nothing, where there is no product name to inherit.
   */
  const name = product?.name || text(row.title);
  if (!name) return null;

  /**
   * Which fields the card is actually overriding.
   *
   * Only counts a field that is genuinely in effect. A stored `title` on a card
   * bound to a product is ignored, so reporting it here would tell an editor
   * their override is live when the card is actually showing the product's name.
   */
  const overrides: string[] = [];
  if (!product && text(row.title)) overrides.push("title");
  if (text(row.description)) overrides.push("description");
  if (text(row.category)) overrides.push("badge");

  // The destination is the product's, always.
  //
  // `href` on the card row is deliberately ignored. It used to win, and because
  // it was stored as a hand-written path it went stale the moment a product was
  // renamed, recategorised or deleted — producing 404s and, for the slugs that
  // exist in the catalogue too, a link to a different product entirely. The
  // product row is the only thing that knows its current canonical URL, so it is
  // the only thing allowed to supply one.
  const href = product?.href || (slug ? getDatabaseProductHref(slug) : "/products");

  return {
    id: row.id,
    productId: row.productId,
    slug,
    name,
    category: text(row.category) || product?.category || "",
    shortDescription: text(row.description) || product?.shortDescription || "",
    // The image is the product's primary image, and only the product's.
    //
    // `row.imageUrl` is deliberately ignored. A stored home image is a second
    // copy of an image the product already owns, and a second copy is a second
    // thing to forget: swapping a product's photo in the CMS left every card
    // showing the old one, and a card could end up illustrating a product it
    // did not link to at all. The column is still writable in the schema so an
    // existing value can be cleared, but nothing reads it for display.
    image: product?.image || "",
    alt: text(row.altText) || name,
    href,
    quoteHref: `/request-a-quote?product=${encodeURIComponent(slug)}`,
    ctaLabel: text(row.ctaLabel) || "Get a Quote",
    // A card written before the column existed has no value here. Treated as
    // absent rather than false, so those rows keep the button instead of the
    // quote CTA silently disappearing from the homepage on upgrade.
    showQuoteButton: row.showQuoteButton !== false,
    isActive: row.isActive,
    displayOrder: row.displayOrder,
    overrides,
  };
}

/** Resolves every card, dropping the ones that point at nothing. */
export function resolveHomeProductCards(
  rows: readonly HomeProductCardRow[],
  index: ProductIndex,
): HomeProductCard[] {
  return rows
    .map((row) => resolveHomeProductCard(row, index))
    .filter((card): card is HomeProductCard => card !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
}

/**
 * A readable badge for a product whose raw category is a slug.
 *
 * Only used as a display fallback in the admin picker, where a human is reading
 * a list of checkboxes; the card itself renders whatever the product says, which
 * is the slug uppercased by CSS.
 */
export function describeCategory(category: string): string {
  const slug = text(category);
  if (!slug) return "Uncategorised";
  const known = catalogueCategoryNames[slug as keyof typeof catalogueCategoryNames];
  if (known) return known;
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export { getCatalogueProductBySlug };
