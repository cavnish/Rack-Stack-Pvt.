"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  CircleCheck,
  Factory,
  HardHat,
  Headset,
  Ruler,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { SmartImage } from "./smart-image";
import { HOME_ABOUT_FEATURE_ICONS, type HomeAboutContent, type HomeAboutImage } from "@/lib/home-about";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Icon names come from the CMS so an editor can restyle a feature without a
 * deploy. Only the names in `HOME_ABOUT_FEATURE_ICONS` — the same list the admin
 * picker offers — are mapped, which keeps the client bundle from pulling the
 * whole lucide set; anything else falls back to a neutral line check.
 */
const FEATURE_ICON_SET: Record<string, LucideIcon> = {
  Factory,
  Warehouse,
  Boxes,
  Truck,
  HardHat,
  Wrench,
  SlidersHorizontal,
  Ruler,
  ShieldCheck,
  Headset,
};

const FEATURE_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  HOME_ABOUT_FEATURE_ICONS.map(({ value }) => [value, FEATURE_ICON_SET[value] ?? CircleCheck]),
);

/** Variants, shared by every animated group so timing stays consistent. */
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};
const slideIn = {
  hidden: { opacity: 0, x: -22 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
};
const group = (stagger: number, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

const IMAGE_SIZES =
  "(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) calc(100vw - 4rem), (max-width: 1439px) 46vw, 640px";
const THUMB_SIZES =
  "(max-width: 639px) calc(50vw - 1.5rem), (max-width: 1023px) calc(50vw - 2.5rem), (max-width: 1439px) 22vw, 288px";

/**
 * Splits the headline after its first full stop so the two sentences lock up as
 * separate lines. A title without a full stop renders as a single block, and
 * `text-wrap: balance` on each line keeps the wrap even at every breakpoint
 * instead of letting a long word push the layout wide.
 */
function headlineLines(title: string): [string, string?] {
  const breakAt = title.indexOf(". ");
  if (breakAt === -1) return [title];
  return [title.slice(0, breakAt + 1), title.slice(breakAt + 2)];
}

function AboutImage({ image, sizes }: { image: HomeAboutImage; sizes: string }) {
  return <SmartImage src={image.image} alt={image.alt} fill sizes={sizes} className="object-cover" />;
}

export function HomeAbout({ content }: { content: HomeAboutContent }) {
  const reduced = useReducedMotion();
  const anim = !reduced;
  const state = anim ? "hidden" : false;
  const inView = anim ? "show" : undefined;
  const viewport = { once: true, margin: "-80px" };

  const [main, ...supporting] = content.images;
  const [lead, second] = headlineLines(content.title);

  return (
    <section id="home-about" aria-labelledby="home-about-heading" className="overflow-hidden bg-white py-12 sm:py-14 lg:py-16">
      <div className="container-shell">
        {/*
          The gallery and the copy sit side by side only once there is room for
          both to reach a similar height. Measured at 1024px the copy runs ~33%
          taller than the gallery, so the split waits for xl, where the two
          columns land within ~8% of each other. Below that they stack with the
          gallery first, which is the order this section reads in on a phone:
          pictures, then the words that explain them.

          Only standard breakpoints are used here. Tailwind emits arbitrary
          `min-[Npx]:` media blocks ahead of `md:`, so mixing them with `md:`
          lets the smaller step win at large widths.
        */}
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.06fr)] xl:items-center xl:gap-x-12">
          <motion.div
            className="min-w-0"
            initial={state}
            whileInView={inView}
            viewport={viewport}
            variants={group(0.09)}
          >
            {main ? (
              <motion.div
                variants={anim ? slideIn : undefined}
                className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-zinc-50 shadow-[0_18px_40px_-30px_rgba(7,28,39,0.45)]"
              >
                <div className="relative aspect-[16/9]">
                  <AboutImage image={main} sizes={IMAGE_SIZES} />
                </div>
              </motion.div>
            ) : null}

            {supporting.length ? (
              <ul className="mt-2.5 grid grid-cols-2 gap-2.5 sm:mt-3 sm:gap-3">
                {supporting.map((image, index) => (
                  <motion.li
                    key={`${image.image}-${index}`}
                    variants={anim ? fadeUp : undefined}
                    className="overflow-hidden rounded-xl border border-zinc-200/90 bg-zinc-50 shadow-[0_12px_28px_-24px_rgba(7,28,39,0.45)]"
                  >
                    <div className="relative aspect-[16/9]">
                      <AboutImage image={image} sizes={THUMB_SIZES} />
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : null}
          </motion.div>

          <motion.div
            className="min-w-0"
            initial={state}
            whileInView={inView}
            viewport={viewport}
            variants={group(0.05)}
          >
            {/*
              The eyebrow is the CMS `label`, resolved upstream: a label that
              merely restates the heading is blanked so the two do not print the
              same words twice, and anything an editor actually writes shows here.
              It used to be omitted entirely, which left the admin's "Eyebrow
              label" field saving to the database and rendering nowhere.
            */}
            {content.eyebrow ? (
              <motion.p
                variants={anim ? fadeUp : undefined}
                className="mb-3 text-[.6875rem] font-bold uppercase tracking-[.16em] text-[var(--red)] sm:mb-4"
              >
                {content.eyebrow}
              </motion.p>
            ) : null}
            <motion.h2
              id="home-about-heading"
              variants={anim ? fadeUp : undefined}
              className="text-balance text-[1.875rem] font-bold leading-[1.14] tracking-[-0.02em] text-[var(--navy)] md:text-[2.125rem] lg:text-[2.5rem] xl:text-[2.625rem]"
            >
              <span className="block text-balance">{lead}</span>
              {second ? <span className="block text-balance">{second}</span> : null}
            </motion.h2>

            <div className="mt-4 max-w-[34rem] space-y-2.5 sm:mt-5">
              {content.paragraphs.map((paragraph, index) => (
                <motion.p
                  key={index}
                  variants={anim ? fadeUp : undefined}
                  className="text-pretty text-[0.9375rem] leading-[1.6] text-zinc-600 lg:text-base"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>

            <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3.5 sm:mt-7 sm:grid-cols-2 sm:gap-y-4">
              {content.features.map((feature) => {
                const Icon = FEATURE_ICONS[feature.icon] ?? CircleCheck;
                return (
                  <motion.li key={feature.title} variants={anim ? fadeUp : undefined} className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                    <span className="mt-px grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--red)]/[0.07] text-[var(--red)] sm:h-9 sm:w-9">
                      <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.875rem] font-semibold leading-snug tracking-[-0.01em] text-[var(--navy)] sm:text-[0.9375rem]">
                        {feature.title}
                      </span>
                      {feature.description ? (
                        <span className="mt-0.5 block text-[0.8125rem] leading-[1.5] text-zinc-500">{feature.description}</span>
                      ) : null}
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            <motion.div variants={anim ? fadeUp : undefined} className="mt-7 sm:mt-8">
              <Link
                href={content.ctaHref}
                className="btn-primary w-full justify-center rounded-lg sm:w-auto sm:justify-start sm:px-6"
              >
                {content.ctaLabel}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
