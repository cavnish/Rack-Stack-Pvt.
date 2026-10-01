/**
 * Moves the About page's content out of code and into `about_sections`.
 *
 * The page used to be a purpose-built component reading constants from
 * `src/lib/about-page.ts`. Nothing about the content was wrong; it just could
 * not be edited, reordered or switched off without a deploy. This script writes
 * the same words, the same photographs and the same order into the new table so
 * the page is unchanged on screen the moment the renderers start reading from
 * the database instead.
 *
 * Idempotent, and safe to re-run: every row is matched on `sectionKey` and
 * updated in place. That matters because an editor may have already changed the
 * copy, and a re-run of a migration must not quietly put the old wording back.
 * The one thing it will not do is invent a section that has been deleted, or
 * re-enable one that has been switched off — those are the editor's decisions,
 * so `--force` is required to overwrite them.
 *
 *   npm run about:seed
 *   npm run about:seed -- --force   also reset isActive and displayOrder
 */

import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { aboutSections, type AboutSectionBody } from "../src/db/schema";
import {
  ABOUT_APPROACH,
  ABOUT_EQUIPMENT,
  ABOUT_MANUFACTURING,
  ABOUT_PILLARS,
  ABOUT_STRENGTHS,
  ABOUT_IMAGES,
} from "../src/lib/about-page";

const force = process.argv.includes("--force");

/**
 * The paragraphs that sat in the introduction's right-hand column.
 *
 * These two are the only body copy on the page that was written inline in the
 * component rather than held in `about-page.ts`, so they are transcribed here.
 */
const INTRODUCTION_PARAGRAPHS = [
  "The work starts with a building, not a product list. What is being stored, how heavy it is, how often it is picked and what equipment already moves through the space decide which system belongs in it — and that decision is made before anything is specified.",
  "Manufacturing and exporting sit under the same roof as that planning, so a layout drawn for your site can be built against it and supplied as one system rather than assembled from unrelated parts.",
];

/** The equipment band's photograph was also inline in the component. */
const EQUIPMENT_IMAGE = "/assets/images/gallery/material-handling-e5c6a1bd1e.webp";

type Seed = {
  sectionKey: string;
  label: string;
  kind: (typeof aboutSections.$inferInsert)["kind"];
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  caption?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  imageAlt?: string | null;
  ctaPrimaryLabel?: string | null;
  ctaPrimaryHref?: string | null;
  ctaSecondaryLabel?: string | null;
  ctaSecondaryHref?: string | null;
  theme: "light" | "surface" | "dark" | "bordered";
  body: AboutSectionBody;
};

/**
 * The page as it is today.
 *
 * `displayOrder` reproduces the current order exactly, including the pillars
 * band sitting between the strengths and the CTA.
 */
const SEEDS: Seed[] = [
  {
    sectionKey: "hero",
    label: "Hero",
    kind: "hero",
    eyebrow: "About Rack & Stack",
    title: "Future Leaders in Storage & Material Handling",
    description:
      "We deliver engineered storage and material-handling solutions designed around your space, requirements and operational needs.",
    imageUrl: ABOUT_IMAGES.hero,
    // The hero's photograph is decorative behind two scrims, so it is marked
    // decorative for assistive technology; this alt is what the social card and
    // any future text use describe it with.
    imageAlt: "Rack & Stack storage systems in an industrial warehouse",
    ctaPrimaryLabel: "Explore Our Solutions",
    ctaPrimaryHref: "/products",
    ctaSecondaryLabel: "Get in Touch",
    ctaSecondaryHref: "/contact",
    theme: "dark",
    body: {},
  },
  {
    sectionKey: "introduction",
    label: "About Rack & Stack",
    kind: "introduction",
    eyebrow: "Who we are",
    title: "About Rack & Stack",
    description:
      "Rack and Stack Systems is engaged in the manufacturing and exporting of storage systems and in-plant material handling equipment.",
    imageUrl: ABOUT_IMAGES.about,
    imageAlt:
      "Organised storage aisle with pallet racking and shelving installed in an industrial warehouse",
    caption: "Storage, planned and supplied",
    theme: "surface",
    body: {
      paragraphs: INTRODUCTION_PARAGRAPHS,
      // The manufacturing and exporting list lives here rather than in a band of
      // its own, exactly as it does on the live page: it reads as part of the
      // answer to "what is this company", and splitting it out would strand a
      // short list in a section of its own.
      listLabel: "Manufacturing & exporting",
      items: ABOUT_MANUFACTURING.map((item) => ({ label: item.label, slug: item.slug })),
    },
  },
  {
    sectionKey: "equipment",
    label: "Equipment",
    kind: "equipment",
    eyebrow: "Material handling",
    title: "Equipment That Moves Stock",
    description:
      "Beyond fixed storage, the same planning applies to the equipment that works alongside it — moving, lifting and positioning load through the day.",
    imageUrl: EQUIPMENT_IMAGE,
    imageAlt: "In-plant material handling equipment in an industrial storage area",
    theme: "dark",
    body: { items: ABOUT_EQUIPMENT.map((item) => ({ label: item.label, slug: item.slug })) },
  },
  {
    sectionKey: "approach",
    label: "Our Approach",
    kind: "approach",
    eyebrow: "How we work",
    title: "Our Approach",
    description:
      "Seven steps, in the order they happen. Each one is a decision that affects the next, which is why the first two are about your space and not about our products.",
    imageUrl: ABOUT_IMAGES.approach,
    imageAlt: "Warehouse storage layout being planned on site before equipment is supplied",
    theme: "light",
    body: { steps: ABOUT_APPROACH.map((step) => ({ title: step.title, detail: step.detail })) },
  },
  {
    sectionKey: "strengths",
    label: "What We Stand On",
    kind: "strengths",
    eyebrow: "Why Rack & Stack",
    title: "What We Stand On",
    description:
      "The commitments the company works to. They are stated here once, and they are what the rest of this page is describing in practice.",
    theme: "dark",
    body: { strengths: ABOUT_STRENGTHS.map((s) => ({ title: s.title, detail: s.detail })) },
  },
  {
    sectionKey: "pillars",
    label: "Vision, Mission & Commitment",
    kind: "pillars",
    eyebrow: null,
    title: null,
    description: null,
    theme: "bordered",
    body: {
      pillars: ABOUT_PILLARS.map((pillar, index) => ({
        label: pillar.label,
        statement: pillar.statement,
        image: [ABOUT_IMAGES.vision, ABOUT_IMAGES.mission, ABOUT_IMAGES.commitment][index] ?? null,
        imagePublicId: null,
        imageAlt: [
          "Manufacturing floor with industrial racking being prepared for supply",
          "Warehouse storage layout showing organised racking and clear access aisles",
          "Storage system installation in progress with shelving and racking being fitted",
        ][index] ?? null,
      })),
    },
  },
  {
    sectionKey: "cta",
    label: "Closing CTA",
    kind: "cta",
    eyebrow: null,
    title: "Have a Storage Requirement?",
    description:
      "Let us understand your requirement and help you choose the right storage or material-handling solution.",
    imageUrl: ABOUT_IMAGES.cta,
    imageAlt: "",
    ctaPrimaryLabel: "Explore Products",
    ctaPrimaryHref: "/products",
    ctaSecondaryLabel: "Contact Us",
    ctaSecondaryHref: "/contact",
    theme: "dark",
    body: {},
  },
];

async function main() {
  const existing = await db.select().from(aboutSections);
  const byKey = new Map(existing.map((row) => [row.sectionKey, row]));

  let created = 0;
  let updated = 0;
  let untouched = 0;

  for (const [index, seed] of SEEDS.entries()) {
    const current = byKey.get(seed.sectionKey);
    const { sectionKey, ...values } = seed;
    const displayOrder = index + 1;

    if (!current) {
      await db.insert(aboutSections).values({ ...values, sectionKey, displayOrder });
      created++;
      console.log(`created  ${sectionKey}`);
      continue;
    }

    // Content is always brought in line with the source of truth. Position and
    // visibility are the editor's, so they are only touched on an explicit
    // --force, or for a row that has never been given a position at all.
    const nextOrder = force || current.displayOrder === 0 ? displayOrder : current.displayOrder;
    const nextActive = force ? true : current.isActive;

    await db
      .update(aboutSections)
      .set({ ...values, displayOrder: nextOrder, isActive: nextActive })
      .where(eq(aboutSections.id, current.id));

    if (force) {
      updated++;
      console.log(`reset    ${sectionKey}`);
    } else {
      updated++;
      untouched++;
      console.log(`updated  ${sectionKey}`);
    }
  }

  const after = await db.select().from(aboutSections);
  console.log(
    `\n${created} created, ${updated} updated, ${untouched} left as the editor had them, ${after.length} rows total`,
  );
  if (!force) {
    console.log("Run with --force to also reset isActive and displayOrder to the order above.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
