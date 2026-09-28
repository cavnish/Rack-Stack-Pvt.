/**
 * Verifies the homepage card is derived entirely from its product.
 *
 * These assertions are about the resolution logic rather than a running server,
 * because the public site is served from the published static layer
 * (`src/data/*.json`) in preference to the database. A direct `UPDATE` is
 * therefore invisible until the publish pipeline runs, so an HTTP test of a raw
 * SQL edit would measure the cache rather than the code. Admin edits go through
 * `publishSerialized` + `revalidatePath`, which is what keeps the two in step.
 */
import { buildProductIndex, resolveHomeProductCards, type HomeProductCardRow } from "../src/lib/home-products";

let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) failures += 1;
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}${pass ? "" : `\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`}`);
};

const product = {
  id: 6,
  name: "Mezzanine Floor",
  slug: "mezzanine-floor",
  category: "industrial-storage",
  shortDescription: "Extra usable floor area built above.",
  thumbnail: "https://images.example.com/stock-thumb.jpg",
  heroImage: "https://images.example.com/stock-hero.jpg",
};

/** The card page's primary image, which outranks the stock columns. */
const primaryImage = "/MEZZANINE FLOOR/1d585181-379e-4cbd-ad77-13361d61719c.jpg";

/** A card that used to store its own copy of the name, URL and image. */
const staleCard: HomeProductCardRow = {
  id: 5,
  productId: 6,
  slug: "mezzanine-floor",
  title: "Mezzanine Floor (old name)",
  description: null,
  imageUrl: "https://images.example.com/home-only.jpg",
  imagePublicId: null,
  altText: null,
  category: "Space Optimization",
  href: "/products/industrial-storage/mezzanine-floor",
  ctaLabel: null,
  showQuoteButton: true,
  isActive: true,
  displayOrder: 4,
};

const index = buildProductIndex({
  databaseProducts: [product],
  primaryImages: new Map([[product.id, primaryImage]]),
  catalogueProducts: [],
  cataloguePrimaryImages: new Map(),
});

const [card] = resolveHomeProductCards([staleCard], index);

console.log("-- the card inherits from the product --");
check("image is the product page's primary image", card.image, primaryImage);
check("image is not the card's stored override", card.image !== staleCard.imageUrl, true);
check("image is not the product's stock thumbnail", card.image !== product.thumbnail, true);
check("name is the product's", card.name, product.name);
check("url is the product's canonical route", card.href, "/products/mezzanine-floor");
check("url is not the card's stored href", card.href !== staleCard.href, true);
check("quote link targets the product slug", card.quoteHref, "/request-a-quote?product=mezzanine-floor");
check("editorial badge override is kept", card.category, "Space Optimization");
check("overrides list no longer claims an image override", card.overrides.includes("image"), false);

console.log("\n-- a slug change in the CMS moves the card --");
const renamed = { ...product, slug: "mezzanine-floor-platforms", name: "Mezzanine Floor Platforms" };
const renamedIndex = buildProductIndex({
  databaseProducts: [renamed],
  primaryImages: new Map([[renamed.id, primaryImage]]),
  catalogueProducts: [],
  cataloguePrimaryImages: new Map(),
});
// The card row still carries the old slug text; only product_id is trusted.
const [moved] = resolveHomeProductCards([staleCard], renamedIndex);
check("card resolves through product_id, not the stale slug", moved.slug, "mezzanine-floor-platforms");
check("card url follows the new slug", moved.href, "/products/mezzanine-floor-platforms");
check("card name follows the new name", moved.name, "Mezzanine Floor Platforms");
check("quote link follows the new slug", moved.quoteHref, "/request-a-quote?product=mezzanine-floor-platforms");

console.log("\n-- a card bound only by slug still resolves --");
const slugOnly: HomeProductCardRow = { ...staleCard, productId: null, title: null };
const [bySlug] = resolveHomeProductCards([slugOnly], index);
check("resolves by slug when unbound", bySlug.href, "/products/mezzanine-floor");
check("still uses the primary image", bySlug.image, primaryImage);

console.log("\n-- a catalogue-only product is handled too --");
const catalogueProduct = {
  id: 900,
  name: "Mobile Compactor Storage System",
  slug: "mobile-compactor-storage-system",
  category: "office-storage",
  shortDescription: "Mobile compaction for narrow aisles.",
  images: [{ url: "https://images.example.com/catalogue-1.jpg" }],
} as never;
const catalogueImage = "/Mobile Compactor Storage System/5.jpg";
const mixedIndex = buildProductIndex({
  databaseProducts: [],
  primaryImages: new Map(),
  catalogueProducts: [catalogueProduct],
  cataloguePrimaryImages: new Map([["mobile-compactor-storage-system", catalogueImage]]),
});
const [catalogueCard] = resolveHomeProductCards(
  [{ ...slugOnly, slug: "mobile-compactor-storage-system", productId: null }],
  mixedIndex,
);
check("catalogue card uses its folder primary image", catalogueCard.image, catalogueImage);
check("catalogue card keeps the catalogue route", catalogueCard.href, "/products/office-storage/mobile-compactor-storage-system");

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exitCode = failures === 0 ? 0 : 1;
