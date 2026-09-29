/**
 * Content for the About page.
 *
 * The company's own description of what it manufactures and exports is the
 * source of truth for the copy here. It lives in this module rather than in the
 * page component for two reasons:
 *
 * 1. Every item names a product line, and most of those have a real page on this
 *    site. The catalogue slug is stored next to the label so the link is resolved
 *    from the catalogue instead of being typed out by hand — a hardcoded href is
 *    exactly the kind of thing that silently rots when a product is renamed.
 *    `href: null` marks a line with no page of its own (cable trays, for
 *    example): those render as plain text rather than as a link to something
 *    that is not really about them.
 *
 * 2. Nothing here is a statistic, a certification or an achievement. Every
 *    sentence is either a description of what the company makes or a statement
 *    it has made about how it works. There is deliberately no number on this
 *    page.
 */

import { getCatalogueProductBySlug, getCatalogueProductHref, catalogueCategories } from "@/lib/catalogue";

/** A product line named on the About page, with its catalogue slug when it has a page. */
export type AboutCapability = {
  label: string;
  /** A `catalogue.ts` slug, a category slug, or null when there is no page of its own. */
  slug: string | null;
};

/**
 * What the company manufactures and exports.
 *
 * The labels are the company's own wording. Slugs point at the real catalogue
 * product where one exists, so "Compactor Storage Systems" links to the compactor
 * product page rather than to a made-up URL.
 */
export const ABOUT_MANUFACTURING: readonly AboutCapability[] = [
  { label: "Compactor Storage Systems", slug: "mobile-compactor-storage-system" },
  { label: "Heavy Duty Pallet Racks", slug: "conventional-pallet-racking-system" },
  { label: "Mezzanine Floors", slug: "mezzanine-floor" },
  { label: "Slotted Angle Racks", slug: "slotted-angle-racks" },
  { label: "Cantilever Racks", slug: "cantilever-racking-system" },
  // No cable-tray page exists, so this line stays unlinked rather than pointing
  // somewhere unrelated.
  { label: "Cable Trays", slug: null },
  { label: "Storage and Warehousing Systems", slug: "industrial-storage" },
  { label: "In-Plant Material Handling Equipment", slug: "material-handling" },
];

/**
 * The material-handling equipment the company supplies.
 *
 * Several of these are the trade name for a product that is catalogued under a
 * fuller name — a hand pallet truck is the hydraulic pallet truck here, an
 * electric lifting platform is a scissors lift platform — so the slug is the
 * catalogue's name for the same equipment rather than a different product.
 */
export const ABOUT_EQUIPMENT: readonly AboutCapability[] = [
  { label: "Hand Pallet Trucks", slug: "hydraulic-pallet-truck" },
  { label: "Drum Trolleys", slug: "drum-loading-trolley" },
  { label: "Platform Trolleys", slug: null },
  { label: "Electric Lifting Platforms", slug: "multi-scissors-lift-platform" },
  { label: "Electrical Dock Levellers", slug: "dock-leveler" },
  { label: "Battery Operated Stackers", slug: "battery-hydraulic-stacker" },
  { label: "Battery Operated Order Pickers", slug: null },
  { label: "Drum Stackers", slug: null },
  { label: "Stainless-Steel Products", slug: "ms-pallet" },
];

/**
 * Resolves a capability to a URL, or null when it has none.
 *
 * Goes through the catalogue rather than formatting a path, so the URL matches
 * whatever shape the product route currently uses. A category slug is accepted
 * as well as a product slug, which is how the two directory-level lines link to
 * their category pages.
 */
export function resolveAboutCapabilityHref(slug: string | null): string | null {
  if (!slug) return null;
  const product = getCatalogueProductBySlug(slug);
  if (product) return getCatalogueProductHref(product);
  const category = catalogueCategories.find((item) => item.slug === slug);
  return category ? `/products/${category.slug}` : null;
}

/** How the company works, in order. */
export const ABOUT_APPROACH: readonly { title: string; detail: string }[] = [
  {
    title: "Site Visit",
    detail: "We start by seeing the space, the existing setup and how material actually moves through it.",
  },
  {
    title: "Requirement Understanding",
    detail: "Stock, item sizes, load weights, access patterns and the equipment already on site.",
  },
  {
    title: "Product Selection",
    detail: "Matching the requirement to a system rather than starting from a standard product list.",
  },
  {
    title: "Layout & Design",
    detail: "A layout drawn against your building — bay widths, aisle widths, levels and clearances.",
  },
  {
    title: "Consulting",
    detail: "Working through the options with you before anything is ordered, including what to change later.",
  },
  {
    title: "Supply",
    detail: "Manufacturing and supply against the agreed specification and timeline.",
  },
  {
    title: "After-Sales Support",
    // Deliberately about the hand-over rather than about the support commitment:
    // the long-term telephonic support the company offers is stated once, in the
    // strengths section, instead of being told here in almost the same words.
    detail: "Installation, hand-over and assistance that continue once the system is working.",
  },
];

/** The company's own stated strengths. */
export const ABOUT_STRENGTHS: readonly { title: string; detail: string }[] = [
  {
    title: "Quality",
    detail: "A commitment to maintaining product and service quality, in what is supplied and in how it is handled.",
  },
  {
    title: "Competitive Pricing",
    detail: "Solutions offered at competitive prices, with the specification behind the price stated clearly.",
  },
  {
    title: "Customer Satisfaction",
    detail: "A strong focus on customer requirements and on the service that surrounds the product.",
  },
  {
    title: "Prompt Service",
    detail: "Attention to timely delivery and to staying responsive while an order is being fulfilled.",
  },
  {
    title: "After-Sales Support",
    detail: "After-sales service along with long-term telephonic support for clients.",
  },
];

/** Vision, mission and commitment, each quoted from the company's own statement. */
export const ABOUT_PILLARS: readonly { label: string; statement: string }[] = [
  {
    label: "Our Vision",
    statement: "Continue delivering storage-system solutions backed by manufacturing and exporting expertise.",
  },
  {
    label: "Our Mission",
    statement: "Deliver products with high standards and world-class technology.",
  },
  {
    label: "Our Commitment",
    statement:
      "Deliver products within the committed timeframe while providing the right quality products, competitive pricing and prompt service.",
  },
];

/**
 * Photography shipped in `public/assets`, chosen per section.
 *
 * Local files rather than CMS rows on purpose: these are the company's own
 * project and product photographs, they are already optimised WebP, and the page
 * should not render differently depending on what an editor has uploaded. Every
 * file here was confirmed to exist in the repository.
 */
export const ABOUT_IMAGES = {
  hero: "/assets/images/hero/warehouse-pallet-storage-hero-374ec6e177.webp",
  about: "/assets/images/about/organised-storage-aisle-b1f2342d4e.webp",
  approach: "/assets/images/services/storage-planning-hero-dea9106a76.webp",
  vision: "/assets/images/industries/manufacturing-hero-fec7419d7c.webp",
  mission: "/assets/images/gallery/warehouse-storage-layout-93823b5d8e.webp",
  commitment: "/assets/images/services/industrial-shelving-installation-d12c10425c.webp",
  trust: "/assets/images/gallery/storage-installation-9d74ba3cbb.webp",
  cta: "/assets/images/misc/about-349aa7fa21.webp",
} as const;
