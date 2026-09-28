/**
 * The default "What We Offer" cards.
 *
 * The homepage used to hardcode this list of slugs, which made it impossible to
 * reorder, re-title, re-point or hide a card without a deploy. The cards are now
 * rows in `home_offer_cards`, and this list is what the seed imports and what the
 * read layer falls back to before anyone has edited the CMS.
 */

export type HomeOfferCardSeed = {
  slug: string;
};

/**
 * The systems the homepage has always led with, in the same order.
 *
 * This is the *initial* selection for a new site, not the renderer's source of
 * truth: once the rows exist, order, visibility and membership are all CMS
 * decisions, and nothing in the page or the read layer depends on this list.
 *
 * A seed is a slug and nothing else. The card is a pointer to a product, so the
 * name, description, image, badge and link all come from that product — writing
 * them here as well would mean every product rename needed a second edit
 * somewhere else, which is the drift this feature exists to remove.
 */
export const homeOfferCardSeeds: readonly HomeOfferCardSeed[] = [
  { slug: "heavy-duty-long-span-racks" },
  { slug: "heavy-duty-pallet-racking" },
  { slug: "lockers" },
  { slug: "medium-duty-shelving-racks" },
  { slug: "mezzanine-floor" },
  { slug: "mobile-compactor-storage-system" },
  { slug: "mobile-shelving-racks" },
  { slug: "slotted-angle-racks" },
] as const;

/**
 * The three environments the "Why Rack & Stack" panel shows. Kept next to the
 * offer cards because it is the same shortlist, presented as a picture rather
 * than a card.
 */
export const homeWhyEnvironments: readonly { slug: string; title: string; location: string }[] = [
  { slug: "heavy-duty-pallet-racking", title: "Pallet Racking", location: "Heavy-Duty Storage" },
  { slug: "heavy-duty-long-span-racks", title: "Long Span Racks", location: "Industrial Shelving" },
  { slug: "mezzanine-floor", title: "Mezzanine Floors", location: "Space Optimization" },
] as const;
