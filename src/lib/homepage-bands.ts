/**
 * What the public homepage renders, in one place.
 *
 * `/admin/homepage` and the homepage section guard both need the same answer to
 * "which `sectionKey` values does the front page actually use?", and they must
 * agree. When that list lived only inside the renderer, the admin list had no way
 * to tell a live band from a leftover row, and the delete route deleted anything
 * it was given — including `about`.
 *
 * The keys below are the ones `app/(site)/page.tsx` dispatches on. A row whose key
 * is not in this list is not rendered anywhere on the site, which makes it either
 * an orphan left by a rename or a custom band that was never wired up.
 *
 * Deliberately dependency-free and isomorphic: the admin client bundle imports it
 * and so does the server-side delete guard.
 */

/** The section keys the homepage renders, in their intended page order. */
export const HOMEPAGE_BAND_KEYS = [
  "hero",
  "about",
  "trust",
  "services",
  "why",
  "offers",
  "process",
  "manufacturing",
  "cta",
] as const;

export type HomepageBandKey = (typeof HOMEPAGE_BAND_KEYS)[number];

export function isHomepageBandKey(value: unknown): value is HomepageBandKey {
  return typeof value === "string" && (HOMEPAGE_BAND_KEYS as readonly string[]).includes(value);
}

/**
 * Human labels, so the admin and the delete refusal both name the band the way an
 * editor knows it rather than by its raw key.
 */
export const HOMEPAGE_BAND_LABELS: Record<HomepageBandKey, string> = {
  hero: "Hero",
  about: "About",
  trust: "Trust metrics",
  services: "Services",
  why: "Why Rack & Stack",
  offers: "What We Offer",
  process: "How we work",
  manufacturing: "Manufacturing",
  cta: "Closing call to action",
};

/** One line explaining what the band is, shown in the admin list. */
export const HOMEPAGE_BAND_BLURBS: Record<HomepageBandKey, string> = {
  hero: "The full-screen opening: headline, photograph and the three calls to action.",
  about: "Company introduction: three photographs, body copy and the feature grid.",
  trust: "A short band of value points shown as large figures.",
  services: "The heading for the services list, its capability chips and the button.",
  why: "The dark 'why industry leaders' band: differentiators and headline figures.",
  offers: "Heading for the product card grid. The cards live in Home Products.",
  process: "The numbered process row: discover, survey, design, deliver.",
  manufacturing: "The split dark band: installation photograph and a button.",
  cta: "The red band above the footer: heading, copy and up to two buttons.",
};

/** Default position for a band, used when one is created without an explicit order. */
export const HOMEPAGE_BAND_ORDERS: Record<HomepageBandKey, number> = {
  hero: 0,
  about: 1,
  trust: 2,
  services: 3,
  why: 4,
  offers: 5,
  process: 8,
  manufacturing: 9,
  cta: 14,
};

/** The label for any key, falling back to the raw key for a custom one. */
export function homepageBandLabel(key: string): string {
  return isHomepageBandKey(key) ? HOMEPAGE_BAND_LABELS[key] : key;
}