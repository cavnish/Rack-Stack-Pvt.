import { catalogueCategoryNames } from "@/lib/catalogue-shared";

/**
 * Wording for the "Recommended systems" section, as stored on `products`.
 *
 * All three are nullable. The defaults below are what a product shows when its
 * editor has not written anything, which is why they are derived rather than
 * hardcoded per product: the subheading names the product's own category, so a
 * pallet racking page says "Systems That Work for Industrial Storage Systems"
 * and a locker page says the same about office storage, without anyone filling
 * anything in.
 */
export type RecommendationCopy = {
  heading?: string | null;
  subheading?: string | null;
  description?: string | null;
};

export const RECOMMENDED_HEADING = "Recommended systems";

export const RECOMMENDED_DESCRIPTION =
  "The final choice depends on your stock, loads, equipment and building.";

/**
 * The subheading for a product, defaulting to its category.
 *
 * A product filed under a category that has no display name falls back to the
 * raw slug rather than rendering an empty heading, so the section is never left
 * saying "Systems That Work for ."
 */
export function recommendedSubheading(category: string | null | undefined): string {
  const name = category ? (catalogueCategoryNames[category] ?? category) : "";
  return name ? `Systems That Work for ${name}.` : "Systems That Work for You.";
}

/**
 * The copy, with a default filled in for anything the editor left blank.
 *
 * Kept separate from the section component, and free of any server import, so
 * the admin editor can show the same defaults as the public page. When this
 * lived in the component, the editor — a client component — had to import the
 * whole server-rendered section to read two strings, which dragged the image
 * resolver and its filesystem access into the browser bundle and broke the
 * editor page.
 */
export function resolveRecommendationCopy(copy: RecommendationCopy = {}, category?: string) {
  return {
    heading: copy.heading?.trim() || RECOMMENDED_HEADING,
    subheading: copy.subheading?.trim() || recommendedSubheading(category),
    description: copy.description?.trim() || RECOMMENDED_DESCRIPTION,
  };
}
