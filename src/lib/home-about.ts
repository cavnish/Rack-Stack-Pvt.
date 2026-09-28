/**
 * Data shaping for the homepage About section.
 *
 * The section is editorially owned: its label, headline, copy, images, feature
 * grid and CTA all come from the `about` row of `homepage_sections` (and
 * therefore from the admin "Homepage" screen and `src/data/homepage.json`).
 * This module turns that loosely-typed row into the exact shape the section
 * renders, so `components/site/home-about.tsx` stays presentational.
 *
 * Every field has a default below. That matters because the CMS column is
 * JSONB: an editor can add a section, clear a field or publish an older record
 * that predates a field added in a later release. Falling back per-field means
 * the section always renders completely and never shows a half-empty grid.
 */

export type HomeAboutImage = { image: string; alt: string };
export type HomeAboutFeature = { title: string; description: string; icon: string };

/**
 * The feature icons the About section can render, and the admin picker's
 * options.
 *
 * One list for both jobs on purpose. The renderer maps these names to lucide
 * components and silently falls back to a neutral check mark for anything it
 * does not recognise, while the admin editor offers a `<select>` of names — two
 * hand-kept lists would drift, and the result is an editor picking an icon that
 * quietly renders as a tick.
 */
export const HOME_ABOUT_FEATURE_ICONS = [
  { value: "Factory", label: "Factory / in-house build" },
  { value: "Warehouse", label: "Warehouse" },
  { value: "Boxes", label: "Boxes / storage" },
  { value: "Truck", label: "Truck / supply" },
  { value: "HardHat", label: "Hard hat / installation" },
  { value: "Wrench", label: "Wrench / service" },
  { value: "SlidersHorizontal", label: "Sliders / custom design" },
  { value: "Ruler", label: "Ruler / site survey" },
  { value: "ShieldCheck", label: "Shield / quality" },
  { value: "Headset", label: "Headset / support" },
] as const;

export type HomeAboutContent = {
  label: string;
  title: string;
  paragraphs: string[];
  /** Main image first, then the two supporting images. Always three entries. */
  images: HomeAboutImage[];
  features: HomeAboutFeature[];
  ctaLabel: string;
  ctaHref: string;
};

/** The CMS row shape this module accepts. Deliberately loose. */
export type HomeAboutSection = {
  title?: string | null;
  subtitle?: string | null;
  content?: Record<string, unknown> | null;
};

const MAIN_IMAGE = "/assets/images/about/organised-storage-aisle-b1f2342d4e.webp";
const SUPPORT_IMAGES: HomeAboutImage[] = [
  {
    image: "/assets/images/misc/about-349aa7fa21.webp",
    alt: "Rack manufacturing in progress, storage racks built in-house",
  },
  {
    image: "/assets/images/products/warehouse-team-working-with-heavy-duty-pallet-ra-3e49427d5a.webp",
    alt: "Rack installation of industrial racking solutions inside a warehouse",
  },
];

const DEFAULT_FEATURES: HomeAboutFeature[] = [
  { title: "In-House Manufacturing", description: "Quality-controlled rack production", icon: "Factory" },
  { title: "Custom Storage Solutions", description: "Designed for your space and requirements", icon: "SlidersHorizontal" },
  { title: "Professional Installation", description: "Safe and accurate installation", icon: "HardHat" },
  { title: "Reliable Support", description: "Service and maintenance after installation", icon: "Headset" },
];

const DEFAULT_TITLE = "Reliable Industrial Storage Solutions";
const DEFAULT_LABEL = "About Rack & Stack";
const DEFAULT_SUBTITLE =
  "Rack & Stack provides industrial storage racks and warehouse storage solutions designed to improve space, organization, and efficiency.\n\nFrom design and manufacturing to supply, installation and maintenance, we deliver reliable racking solutions for warehouses, factories, offices, and industrial facilities.";
const DEFAULT_CTA = "Explore Our Solutions";
const DEFAULT_CTA_HREF = "/products";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pickList<T extends { title: string; description: string; icon: string }>(
  value: unknown,
  fallback: T[],
): T[] {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((entry) => {
      const row = (entry ?? {}) as Record<string, unknown>;
      const title = str(row.title);
      const description = str(row.description);
      if (!title) return null;
      return { title, description, icon: str(row.icon) } as T;
    })
    .filter((entry): entry is T => entry !== null);
  return items.length ? items : fallback;
}

function pickImages(content: Record<string, unknown>): HomeAboutImage[] {
  const [first, ...rest] = Array.isArray(content.gallery) ? content.gallery : [];
  const row = (entry: unknown): Record<string, unknown> => ((entry ?? {}) as Record<string, unknown>);

  const supporting: HomeAboutImage[] = [];
  for (let index = 0; index < SUPPORT_IMAGES.length; index += 1) {
    const source = str(row(rest[index]).image);
    supporting.push(
      source
        ? { image: source, alt: str(row(rest[index]).alt) || `${DEFAULT_LABEL} project photography` }
        : SUPPORT_IMAGES[index],
    );
  }

  const main = str(content.image) || MAIN_IMAGE;
  return [
    {
      image: main,
      alt: str(content.imageAlt) || "Industrial storage racks and warehouse racking in an organised storage aisle",
    },
    ...supporting,
  ];
}

/**
 * Builds the render-ready About payload from the CMS section row.
 *
 * `ctaHref` is only honoured when it is a site-relative path, so a bad CMS
 * value can never turn the CTA into an off-site or `javascript:` link. It
 * otherwise falls back to the existing `/products` route rather than inventing
 * a new one.
 */
export function buildHomeAboutContent(section: HomeAboutSection | null | undefined): HomeAboutContent {
  const content = (section?.content ?? {}) as Record<string, unknown>;
  const subtitle = str(section?.subtitle) || DEFAULT_SUBTITLE;

  return {
    label: str(content.label) || DEFAULT_LABEL,
    title: str(section?.title) || DEFAULT_TITLE,
    paragraphs: subtitle ? subtitle.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean) : [],
    images: pickImages(content),
    features: pickList<HomeAboutFeature>(content.features, DEFAULT_FEATURES),
    ctaLabel: str(content.cta) || DEFAULT_CTA,
    ctaHref: str(content.ctaHref).startsWith("/") ? str(content.ctaHref) : DEFAULT_CTA_HREF,
  };
}

/**
 * The section as it renders when nothing has been entered in the CMS.
 *
 * Exported because the admin About editor seeds its form from this: an existing
 * row predating the structured editor (or one with fields cleared) would
 * otherwise open on a blank form and lose the live copy on the next save.
 */
export const homeAboutDefaults: HomeAboutContent = buildHomeAboutContent(null);
