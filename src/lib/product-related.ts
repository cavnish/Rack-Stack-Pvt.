/**
 * Which products a product page recommends.
 *
 * Exists as one function because this rule was implemented twice — once in the
 * publish generator that bakes `products.json`, once in the database fallback in
 * `data.ts` — and the two are what a product page actually reads depending on
 * whether the published static file is present. That duplication is how the bug
 * this fixes survived: both copies said "the editor's picks, or a short
 * same-category sample", so a product added in the CMS appeared on no other
 * product page until an editor also linked it into `productRelatedProducts` on
 * every one of those pages by hand. The relationship is a join table, so adding
 * a product adds no links anywhere.
 *
 * The rule is therefore: the editor's picks lead, in editor order, and the rest
 * of the live catalogue follows. Nothing is truncated. A longer roster is more
 * rows in the wrapping grid, not fewer cards.
 */

export type RelatedCandidate = {
  id: number;
  category?: string | null;
  displayOrder?: number | null;
};

/**
 * @param curated   The editor's own picks, already in editor order.
 * @param pool      Every product eligible to be recommended.
 * @param self      The product being rendered. It is never recommended to itself.
 */
export function buildRelatedProducts<T extends RelatedCandidate>(
  curated: readonly T[],
  pool: readonly T[],
  self: { id: number; category?: string | null },
): T[] {
  const seen = new Set<number>([self.id]);

  const picks: T[] = [];
  for (const item of curated) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    picks.push(item);
  }

  const sameCategory: T[] = [];
  const otherCategories: T[] = [];
  for (const item of pool) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    if (item.category && item.category === self.category) sameCategory.push(item);
    else otherCategories.push(item);
  }

  // Same-category recommendations lead the automatic tail because they are the
  // plausible next purchase; everything else follows in the pool's own order,
  // which is the catalogue's display order.
  return [...picks, ...sameCategory, ...otherCategories];
}