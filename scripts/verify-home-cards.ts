/**
 * Verifies how a homepage card resolves the values it renders.
 *
 * These assertions are about the resolution logic rather than a running server,
 * because the public site is served from the published static layer
 * (`src/data/*.json`) in preference to the database. A direct `UPDATE` is
 * therefore invisible until the publish pipeline runs, so an HTTP test of a raw
 * SQL edit would measure the cache rather than the code. Admin edits go through
 * `publishSerialized` + `revalidatePath`, which is what keeps the two in step.
 *
 * The division of labour this file pins down:
 *
 *  - What the editor typed on the card wins: title, description, image, badge,
 *    alt text and button label. A card is a promotional slot the business
 *    curates, and an override that saves but never renders is a silent failure.
 *  - What the product owns wins for identity: the slug and the canonical URL.
 *    A card can therefore never link to a page that has moved or been deleted.
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

/** A card the editor has given its own title, image and badge. */
const editedCard: HomeProductCardRow = {
  id: 5,
  productId: 6,
  slug: "mezzanine-floor",
  title: "Mezzanine Floor Systems",
  description: "Double your usable floor area without extending the building.",
  imageUrl: "/assets/images/misc/home-offer-cards-abc-123.webp",
  imagePublicId: "rack-stack/home-offer-cards/abc",
  altText: "An installed mezzanine floor deck",
  category: "Space Optimization",
  href: "/products/industrial-storage/mezzanine-floor",
  ctaLabel: "Request a Callback",
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

const [card] = resolveHomeProductCards([editedCard], index);

console.log("-- what the editor set on the card is what the page renders --");
check("image is the card's stored image", card.image, editedCard.imageUrl);
check("title is the card's override", card.name, "Mezzanine Floor Systems");
check("description is the card's override", card.shortDescription, "Double your usable floor area without extending the building.");
check("alt text is the card's override", card.alt, "An installed mezzanine floor deck");
check("button label is the card's override", card.ctaLabel, "Request a Callback");
check("badge override is kept", card.category, "Space Optimization");
check("overrides list reports the image", card.overrides.includes("image"), true);
check("overrides list reports the title", card.overrides.includes("title"), true);

console.log("\n-- what the product owns, the card cannot contradict --");
check("url is the product's canonical route", card.href, "/products/mezzanine-floor");
check("url is not the card's stored href", card.href !== editedCard.href, true);
check("quote link targets the product slug", card.quoteHref, "/request-a-quote?product=mezzanine-floor");

console.log("\n-- a card with no overrides inherits everything from the product --");
const inherited: HomeProductCardRow = {
  ...editedCard,
  title: null,
  description: null,
  imageUrl: null,
  altText: null,
  category: null,
  ctaLabel: null,
};
const [plain] = resolveHomeProductCards([inherited], index);
check("image falls back to the product page's primary image", plain.image, primaryImage);
check("image is not the product's stock thumbnail", plain.image !== product.thumbnail, true);
check("name falls back to the product's", plain.name, product.name);
check("description falls back to the product's", plain.shortDescription, product.shortDescription);
check("button label falls back to the default", plain.ctaLabel, "Get a Quote");
check("no overrides are claimed", plain.overrides, []);

console.log("\n-- a slug change in the CMS moves the card without losing the copy --");
const renamed = { ...product, slug: "mezzanine-floor-platforms", name: "Mezzanine Floor Platforms" };
const renamedIndex = buildProductIndex({
  databaseProducts: [renamed],
  primaryImages: new Map([[renamed.id, primaryImage]]),
  catalogueProducts: [],
  cataloguePrimaryImages: new Map(),
});
// The card row still carries the old slug text; only product_id is trusted.
const [moved] = resolveHomeProductCards([editedCard], renamedIndex);
check("card resolves through product_id, not the stale slug", moved.slug, "mezzanine-floor-platforms");
check("card url follows the new slug", moved.href, "/products/mezzanine-floor-platforms");
check("quote link follows the new slug", moved.quoteHref, "/request-a-quote?product=mezzanine-floor-platforms");
check("the editor's own image survives the move", moved.image, editedCard.imageUrl);

console.log("\n-- a card bound only by slug still resolves --");
const slugOnly: HomeProductCardRow = { ...inherited, productId: null };
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
  [{ ...slugOnly, slug: "mobile-compactor-storage-system", productId: null, title: "Compactors for narrow aisles", imageUrl: "/assets/images/misc/compactor.webp" }],
  mixedIndex,
);
check("catalogue card uses its own image when set", catalogueCard.image, "/assets/images/misc/compactor.webp");
check("catalogue card keeps its own title", catalogueCard.name, "Compactors for narrow aisles");
check("catalogue card keeps the catalogue route", catalogueCard.href, "/products/mobile-compactor-storage-system");
const [catalogueBare] = resolveHomeProductCards(
  [{ ...slugOnly, slug: "mobile-compactor-storage-system", productId: null }],
  mixedIndex,
);
check("catalogue card falls back to its folder primary image", catalogueBare.image, catalogueImage);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exitCode = failures === 0 ? 0 : 1;
