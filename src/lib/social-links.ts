/**
 * The company's official social and business profiles.
 *
 * One canonical list, imported by every surface that shows the social links
 * (the footer, the About page and the Contact page) so the four URLs exist in a
 * single place and cannot drift apart between pages. The order here is the
 * display order everywhere.
 *
 * These are plain constants rather than a CMS read on purpose: they are brand
 * assets that change rarely, they must render on the statically-exported About
 * page without an async dependency, and a missing row on any page is a worse
 * failure than a hard-coded URL. The footer still lets the admin override a URL
 * through `settings.socialLinks`, and any value set there wins; these are the
 * defaults it falls back to.
 */
export type SocialPlatform = "google" | "linkedin" | "instagram" | "facebook";

export type SocialProfile = {
  id: SocialPlatform;
  /** Full accessible name, e.g. "Rack & Stack on LinkedIn". */
  label: string;
  /** Short name shown on a card, e.g. "LinkedIn". */
  name: string;
  /** The profile URL exactly as supplied by the business. */
  href: string;
  /** Second line on a card: a handle or a short description of the channel. */
  detail: string;
};

export const SOCIAL_PROFILES: readonly SocialProfile[] = [
  {
    id: "google",
    label: "Rack & Stack on Google Business Profile",
    name: "Google Business Profile",
    href: "https://share.google/72ZOXRGZkBIuRwYuB",
    detail: "Reviews, directions & updates",
  },
  {
    id: "linkedin",
    label: "Rack & Stack on LinkedIn",
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/rack-stack-storage-systems-pvt-ltd/",
    detail: "Company news & team",
  },
  {
    id: "instagram",
    label: "Rack & Stack on Instagram",
    name: "Instagram",
    href: "https://www.instagram.com/rackandstack.pvt",
    detail: "@rackandstack.pvt",
  },
  {
    id: "facebook",
    label: "Rack & Stack on Facebook",
    name: "Facebook",
    href: "https://www.facebook.com/",
    detail: "Community & product updates",
  },
];
