/**
 * Editorial + SEO content for the catalogue product pages.
 *
 * This is a pure content layer: it carries copy only, and is merged into the
 * records defined in `src/lib/catalogue.ts` by `applyCatalogueSeoContent`.
 * Nothing here changes layout, components, imagery or the data model.
 *
 * Rules that the copy in this folder follows, so future additions stay
 * consistent:
 * - Titles deliberately omit the `| Rack & Stack` suffix. `src/app/layout.tsx`
 *   appends it through the `%s | Rack & Stack` template, and repeating it here
 *   produced a doubled brand suffix in every `<title>`.
 * - Load capacities are only stated when the product record already carries a
 *   confirmed figure. Everything project-dependent reads
 *   "Available as per project requirement" rather than guessing a number.
 * - Mumbai / India are mentioned once per product at most, in plain language.
 */
export type CatalogueSeoContent = {
  /** Hero subtitle. One short paragraph, manufacturer-focused. */
  heroDescription: string;
  /** Product Overview body, rendered as two short paragraphs. */
  overview: [string, string];
  /** The six Key Feature cards. */
  features: { title: string; description: string }[];
  /**
   * A short sentence for each entry in the product's existing `applications`
   * list, keyed by the application title. Fills the description slot that
   * `ApplicationsSection` already renders when present.
   */
  applicationDetails: Record<string, string>;
  /** Alt text for the product's images, in order. */
  imageAlts: string[];
  /**
   * Extra specification rows appended after the product's own, so confirmed
   * dimensions and capacities are never displaced. Labels already present on
   * the product are skipped, so nothing is duplicated.
   */
  specificationAdditions?: { label: string; value: string }[];
  seo: {
    /** Rendered as "<title> | Rack & Stack" by the root layout template. */
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    /** Alt for the Open Graph / Twitter preview image. */
    ogImageAlt: string;
  };
};
