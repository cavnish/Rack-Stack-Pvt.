import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SmartImage } from "@/components/site/smart-image";
import { ImageReveal } from "@/components/site/image-reveal";
import { ApproachProgressRail } from "@/components/site/approach-progress-rail";
import { StrengthRule } from "@/components/site/strength-rule";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/ui";
import { FitHeading } from "@/components/site/fit-heading";
import {
  ABOUT_APPROACH,
  ABOUT_EQUIPMENT,
  ABOUT_IMAGES,
  ABOUT_MANUFACTURING,
  ABOUT_PILLARS,
  ABOUT_STRENGTHS,
  resolveAboutCapabilityHref,
  type AboutCapability,
} from "@/lib/about-page";

/**
 * The About page.
 *
 * Structure follows one rule the whole way down: a fact is stated once and then
 * left alone. The company description lives in the introduction, the process
 * lives in the approach, the strengths live in their own band, and the closing
 * CTA asks for a conversation without re-summarising any of it. That is what
 * keeps a long page from reading like the same paragraph five times.
 *
 * Every image is a real file from `public/assets` and every product link is
 * resolved from the catalogue, so nothing on this page can drift away from what
 * the rest of the site shows.
 */

/* ------------------------------------------------------------------ shared */

/**
 * One line of a capability list.
 *
 * Rendered as a link only when the line actually has a product page behind it —
 * see `resolveAboutCapabilityHref`. A line with no page is still shown, because
 * it is part of what the company makes, but it is set as plain text with a rule
 * rather than a hairline link that goes nowhere.
 */
function CapabilityRow({ item, index }: { item: AboutCapability; index: number }) {
  const href = resolveAboutCapabilityHref(item.slug);
  const body = (
    <>
      <span className="shrink-0 text-[.62rem] font-bold tracking-[.16em] text-zinc-400">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="min-w-0 flex-1 text-[.95rem] font-semibold leading-snug tracking-[-.01em]">
        {item.label}
      </span>
      {href ? (
        <ArrowRight
          size={15}
          aria-hidden="true"
          className="shrink-0 text-red-600 transition-transform duration-300 group-hover:translate-x-1"
        />
      ) : null}
    </>
  );

  return (
    <li className="border-t border-zinc-300">
      {href ? (
        <Link
          href={href}
          className="group flex items-center gap-3 py-4 transition-colors hover:text-red-600"
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3 py-4 text-zinc-700">{body}</div>
      )}
    </li>
  );
}

/* -------------------------------------------------------------- 2. about */

export function AboutIntroduction() {
  return (
    <section className="surface-grid bg-[#f4f4f1] py-20 lg:py-28">
      <div className="container-shell grid items-start gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        {/*
          `lg:sticky` holds the photograph in view while the copy beside it
          scrolls, so the two halves stay related on a long section instead of
          the image leaving a hole at the top of the right-hand column.
        */}
        <div className="min-w-0 lg:sticky lg:top-28">
          <ImageReveal
            src={ABOUT_IMAGES.about}
            alt="Organised storage aisle with pallet racking and shelving installed in an industrial warehouse"
            sizes="(max-width: 1023px) 100vw, 52vw"
            className="aspect-[4/5] w-full sm:aspect-[16/11] lg:aspect-[4/5]"
          />
          <div className="mt-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-zinc-300" aria-hidden="true" />
            <span className="text-[.62rem] font-bold uppercase tracking-[.18em] text-zinc-500">
              Storage, planned and supplied
            </span>
          </div>
        </div>

        <div className="min-w-0 lg:pt-4">
          <SectionHeading
            eyebrow="Who we are"
            title="About Rack & Stack"
            description="Rack and Stack Systems is engaged in the manufacturing and exporting of storage systems and in-plant material handling equipment."
          />

          <div className="mt-6 max-w-2xl space-y-4 text-[1.0625rem] leading-[1.65] text-zinc-700">
            <p>
              The work starts with a building, not a product list. What is being stored, how heavy it is,
              how often it is picked and what equipment already moves through the space decide which system
              belongs in it — and that decision is made before anything is specified.
            </p>
            <p>
              Manufacturing and exporting sit under the same roof as that planning, so a layout drawn for
              your site can be built against it and supplied as one system rather than assembled from
              unrelated parts.
            </p>
          </div>

          <div className="mt-12">
            <h3 className="text-[.7rem] font-bold uppercase tracking-[.18em] text-zinc-500">
              Manufacturing &amp; exporting
            </h3>
            <ul className="mt-5 grid gap-x-10 sm:grid-cols-2">
              {ABOUT_MANUFACTURING.map((item, index) => (
                <CapabilityRow key={item.label} item={item} index={index} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- 3. equipment */

export function AboutEquipment() {
  return (
    <section className="bg-zinc-950 py-20 text-white lg:py-28">
      <div className="container-shell grid items-center gap-12 lg:grid-cols-[.92fr_1.08fr] lg:gap-16">
        <div className="min-w-0 lg:order-2">
          <SectionHeading
            eyebrow="Material handling"
            title="Equipment That Moves Stock"
            description="Beyond fixed storage, the same planning applies to the equipment that works alongside it — moving, lifting and positioning load through the day."
            light
          />

          <ul className="mt-10 grid gap-x-10 sm:grid-cols-2">
            {ABOUT_EQUIPMENT.map((item, index) => (
              <CapabilityRow key={item.label} item={item} index={index} />
            ))}
          </ul>
        </div>

        {/*
          Deliberately offset rather than a matching pair: the image is pulled up
          and down against the copy so the two columns share a band without
          reading as a symmetrical layout.
        */}
        <div className="min-w-0 lg:order-1">
          <ImageReveal
            src="/assets/images/gallery/material-handling-e5c6a1bd1e.webp"
            alt="In-plant material handling equipment in an industrial storage area"
            sizes="(max-width: 1023px) 100vw, 46vw"
            className="aspect-[5/4] w-full lg:-my-10"
          />
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- 4. approach */

export function AboutApproach() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="container-shell grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-20">
        {/*
          The heading column sticks while the steps scroll past it, so the
          section reads as one continuous process rather than seven separate
          entries — and the reader keeps the framing in view.
        */}
        <div className="min-w-0 lg:sticky lg:top-32 lg:self-start">
          <SectionHeading
            eyebrow="How we work"
            title="Our Approach"
            description="Seven steps, in the order they happen. Each one is a decision that affects the next, which is why the first two are about your space and not about our products."
          />
          <Reveal className="mt-9">
            <ImageReveal
              src={ABOUT_IMAGES.approach}
              alt="Warehouse storage layout being planned on site before equipment is supplied"
              sizes="(max-width: 1023px) 100vw, 34vw"
              className="aspect-[16/10] w-full"
            />
          </Reveal>
        </div>

        <div className="relative min-w-0">
          <ApproachProgressRail />
          <Stagger>
            <ol className="min-w-0">
              {ABOUT_APPROACH.map((step, index) => (
                <StaggerItem key={step.title}>
                  <li className="group relative grid grid-cols-[auto_1fr] items-baseline gap-x-5 border-t border-zinc-200 py-7 first:border-t-0 first:pt-0 sm:gap-x-8">
                    {/*
                      The node sits on the rail, so the drawn line passes behind
                      it and the step it belongs to is unambiguous.
                    */}
                    <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-[.62rem] font-bold tracking-[.08em] text-zinc-500 transition-colors duration-300 group-hover:border-red-600 group-hover:text-red-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold tracking-[-.02em] text-zinc-900 sm:text-[1.375rem]">
                        {step.title}
                      </h3>
                      <p className="mt-2 max-w-xl text-[.95rem] leading-7 text-zinc-600">{step.detail}</p>
                    </div>
                  </li>
                </StaggerItem>
              ))}
            </ol>
          </Stagger>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- 5. strengths */

export function AboutStrengths() {
  return (
    <section className="dark-grid bg-zinc-950 py-20 text-white lg:py-28">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Why Rack & Stack"
          title="What We Stand On"
          description="The commitments the company works to. They are stated here once, and they are what the rest of this page is describing in practice."
          light
        />

        {/*
          Asymmetric on purpose. The first commitment is the lead and runs the
          full width of the left column; the other four stack against it. Five
          equal cards would flatten them into a feature grid and lose the sense
          that these are the grounds rather than five separate products.
        */}
        <div className="mt-14 grid gap-x-14 gap-y-10 lg:grid-cols-[1.15fr_.85fr]">
          <Reveal className="min-w-0">
            {/*
              The rule above the lead commitment draws itself in on scroll,
              which is what stops five text blocks from reading as a plain list.
            */}
            <StrengthRule />
            <h3 className="mt-8 text-[2rem] font-bold leading-[1.1] tracking-[-.03em] sm:text-[2.75rem]">
              {ABOUT_STRENGTHS[0].title}
            </h3>
            <p className="mt-4 max-w-lg text-base leading-8 text-zinc-400">
              {ABOUT_STRENGTHS[0].detail}
            </p>
          </Reveal>

          <Stagger className="min-w-0">
            {ABOUT_STRENGTHS.slice(1).map((strength) => (
              <StaggerItem key={strength.title}>
                <div className="group border-t border-white/20 py-7 transition-colors duration-300 hover:border-white/45 lg:first:pt-0">
                  <h3 className="text-lg font-semibold tracking-[-.02em]">{strength.title}</h3>
                  <p className="mt-2.5 max-w-md text-[.95rem] leading-7 text-zinc-400">
                    {strength.detail}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ 6. pillars */

/**
 * Vision, mission and commitment.
 *
 * Three full-width editorial rows rather than three cards. Each one is a single
 * statement, and a statement given a whole band reads as a statement; three
 * boxes side by side would have made them look like interchangeable values on a
 * template. The image side alternates so the section has a rhythm as it scrolls.
 */
export function AboutPillars() {
  const images = [ABOUT_IMAGES.vision, ABOUT_IMAGES.mission, ABOUT_IMAGES.commitment];
  const alts = [
    "Manufacturing floor with industrial racking being prepared for supply",
    "Warehouse storage layout showing organised racking and clear access aisles",
    "Storage system installation in progress with shelving and racking being fitted",
  ];

  return (
    <>
      {ABOUT_PILLARS.map((pillar, index) => {
        const flipped = index % 2 === 1;
        return (
          <section key={pillar.label} className="border-b border-zinc-200 bg-white">
            <div className="container-shell grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
              <div className={`min-w-0 ${flipped ? "lg:order-2" : ""}`}>
                <ImageReveal
                  src={images[index]}
                  alt={alts[index]}
                  sizes="(max-width: 1023px) 100vw, 48vw"
                  className="aspect-[16/10] w-full"
                />
              </div>

              <div className={`min-w-0 ${flipped ? "lg:order-1" : ""}`}>
                <p className="eyebrow">{pillar.label}</p>
                <FitHeading
                  className="heading-md mt-5 max-w-2xl text-balance text-zinc-900"
                  minPx={22}
                >
                  {pillar.statement}
                </FitHeading>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}

/* ----------------------------------------------------------------- CTA */

export function AboutClosingCta() {
  return (
    <section className="relative isolate overflow-hidden bg-zinc-950 py-24 text-white lg:py-32">
      <div aria-hidden className="absolute inset-0 -z-20">
        <SmartImage
          src={ABOUT_IMAGES.cta}
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(9,9,11,.93)_0%,rgba(9,9,11,.80)_48%,rgba(9,9,11,.52)_100%)]" />

      <div className="container-shell">
        <div className="max-w-3xl">
          <SectionHeading
            title="Have a Storage Requirement?"
            description="Let us understand your requirement and help you choose the right storage or material-handling solution."
            light
          />
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/products" className="btn-primary">
              Explore Products <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/contact" className="btn-light">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
