import type { Metadata } from "next";

import { AboutHero } from "@/components/site/about-hero";
import {
  AboutApproach,
  AboutClosingCta,
  AboutEquipment,
  AboutIntroduction,
  AboutPillars,
  AboutStrengths,
} from "@/components/site/about-sections";
import { ABOUT_IMAGES } from "@/lib/about-page";

/**
 * The About page.
 *
 * Written as a purpose-built page rather than an edit of the CMS `about` record.
 * The content it needed — the manufacturing and exporting scope, the seven-step
 * approach, the stated strengths, vision/mission/commitment — has no equivalent
 * editable field, and modelling it as one long CMS body would mean the only two
 * options were a wall of unstructured text or a pile of one-off fields. The copy
 * lives in `src/lib/about-page.ts` instead, where it is structured and reviewable.
 *
 * The page is now entirely static apart from the layout, so it is no longer an
 * async component — the featured-product showcase it used to build here is gone,
 * and nothing else on it needs to await anything.
 */

export const metadata: Metadata = {
  title: "About Rack & Stack | Storage Systems & Material Handling Equipment Manufacturer",
  description:
    "Rack and Stack Systems manufactures and exports compactor storage systems, heavy duty pallet racks, mezzanine floors, slotted angle and cantilever racks, and in-plant material handling equipment.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Rack & Stack | Storage Systems & Material Handling Equipment Manufacturer",
    description:
      "Rack and Stack Systems manufactures and exports compactor storage systems, heavy duty pallet racks, mezzanine floors, slotted angle and cantilever racks, and in-plant material handling equipment.",
    url: "/about",
    type: "website",
    images: [{ url: ABOUT_IMAGES.hero, alt: "Rack & Stack storage systems in an industrial warehouse" }],
  },
};

export default function AboutPage() {
  return (
    <main>
      <AboutHero
        image={ABOUT_IMAGES.hero}
        title="Future Leaders in Storage & Material Handling"
        description="We deliver engineered storage and material-handling solutions designed around your space, requirements and operational needs."
        primary={{ label: "Explore Our Solutions", href: "/products" }}
        secondary={{ label: "Get in Touch", href: "/contact" }}
      />

      <AboutIntroduction />
      <AboutEquipment />
      <AboutApproach />
      <AboutStrengths />
      <AboutPillars />
      <AboutClosingCta />
    </main>
  );
}
