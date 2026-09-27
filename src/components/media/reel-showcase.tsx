"use client";

import Link from "next/link";
import { useId } from "react";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Stagger } from "@/components/site/reveal";
import { JsonLd } from "@/components/site/ui";
import { parseInstagramUrl } from "@/lib/instagram";
import type { ReelVideoItem } from "@/lib/reel-video";
import { InstagramEmbed } from "./instagram-reel";

export type ReelShowcaseProps = {
  videos: readonly ReelVideoItem[];
  eyebrow?: string;
  title?: string;
  subtitle?: string | null;
  cta?: { label: string; href: string } | null;
  /** Hard cap so a large CMS set cannot stall the page on mobile. */
  maxItems?: number;
  /** Canonical URL of the page, so each Reel can be described as a VideoObject. */
  pageUrl?: string;
  /**
   * `dark` is the industrial band used on the product and service pages.
   * `light` is the white Gallery treatment: dark type, a hairline shelf and an
   * outlined CTA, so the embeds read as part of a bright page rather than as a
   * dark block dropped into it.
   */
  surface?: "dark" | "light";
  className?: string;
};

/**
 * "Watch it in action" — the site's Reel section.
 *
 * One component, two surfaces. The CMS decides which Reels appear and on which
 * page; the page decides how the band is coloured. Renders nothing at all when
 * there are no Reels, so a page that was never given one does not get an empty
 * heading.
 */
export function ReelShowcase({
  videos,
  eyebrow = "WATCH IT IN ACTION",
  title = "Systems Built to Perform.",
  subtitle = "Real installations, real aisles, real working systems. See our storage solutions performing on live warehouse floors.",
  cta,
  maxItems,
  pageUrl,
  surface = "dark",
  className,
}: ReelShowcaseProps) {
  // Unique per instance, so adding the section to a second place on a page
  // cannot produce two elements with the same id and a dangling label.
  const headingId = `reel-showcase-${useId()}`;

  // Only Reels with a permalink Instagram itself will resolve are worth a card;
  // everything else would render as a dead frame.
  const items = (maxItems ? videos.slice(0, maxItems) : videos).filter((reel) =>
    Boolean(parseInstagramUrl(reel.instagramUrl).ok),
  );
  if (items.length === 0) return null;

  const light = surface === "light";

  return (
    <section
      aria-labelledby={headingId}
      className={
        light
          ? // White, with the site's hairline top/bottom rules instead of the
            // dark grid texture, so it reads as a bright editorial band.
            `border-y border-zinc-200 bg-white py-14 text-zinc-900 lg:py-16 ${className ?? ""}`
          : `dark-grid relative isolate overflow-hidden bg-zinc-950 py-20 text-white lg:py-24 ${className ?? ""}`
      }
    >
      {/*
        A VideoObject per Reel. Instagram's own permalink is the only public
        location for the content, so that is what is described here.
      */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: title,
          itemListElement: items.map((reel, index) => {
            const parsed = parseInstagramUrl(reel.instagramUrl);
            return {
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "VideoObject",
                name: reel.title,
                description: reel.title,
                embedUrl: parsed.ok ? parsed.ref.permalink : undefined,
                contentUrl: parsed.ok ? parsed.ref.permalink : undefined,
                ...(pageUrl ? { associatedMedia: pageUrl } : {}),
              },
            };
          }),
        }}
      />

      <div className="container-shell">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="max-w-2xl">
            <p className={`eyebrow ${light ? "text-red-600" : "text-red-400"}`}>{eyebrow}</p>
            <h2
              id={headingId}
              className={`section-heading mt-4 ${light ? "text-zinc-950" : "text-white"}`}
            >
              {title}
            </h2>
            {subtitle ? (
              <p className={`section-description mt-4 ${light ? "text-zinc-600" : "text-zinc-400"}`}>
                {subtitle}
              </p>
            ) : null}
          </div>
          {cta ? (
            // Outlined on the light surface, solid-white on the dark one: the
            // same weight of emphasis without a heavy block on a bright page.
            <Link
              href={cta.href}
              className={`w-fit shrink-0 ${light ? "btn-secondary" : "btn-light"}`}
            >
              {cta.label}
            </Link>
          ) : null}
        </div>

        {/*
          A shelf rather than a wrapping grid, because a 9:16 card is far too
          tall to sit in a wrapping grid without the section becoming a wall of
          whitespace. The track scrolls inside `container-shell`, so the page
          itself never scrolls sideways. `.reel-shelf` in globals.css owns the
          card widths, which are derived from the container so a full row lands
          exactly on the container edge.
        */}
        <Stagger
          className={`reel-shelf no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto overscroll-x-contain px-4 pb-1 [justify-content:safe_center] sm:-mx-8 sm:gap-4 sm:px-8 lg:mx-0 lg:px-0 ${light ? "reel-shelf-light" : ""}`}
        >
          {items.map((reel) => (
            <ReelEntrance key={reel.id} className="shrink-0 snap-center">
              <ReelCard reel={reel} light={light} />
            </ReelEntrance>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/**
 * Scroll entrance for one card.
 *
 * No `initial`/`animate` here: the parent `Stagger` owns the variant state and
 * propagates it, and it skips the whole animation when the visitor prefers
 * reduced motion.
 */
function ReelEntrance({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 26 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * One Reel.
 *
 * The video fills the card: a 9:16 frame, a hairline border and a shadow deep
 * enough to separate it from its section without a glow. Instagram renders its
 * own caption, audio label and action bar inside the frame, so the Reel name sits
 * underneath in a slim footer instead of being laid over the picture.
 *
 * The 9:16 frame is the card's own aspect ratio, so the embed is never stretched
 * and every card in the row is the same size whatever Instagram renders inside.
 */
function ReelCard({ reel, light = false }: { reel: ReelVideoItem; light?: boolean }) {
  const parsed = parseInstagramUrl(reel.instagramUrl);
  const permalink = parsed.ok ? parsed.ref.permalink : reel.instagramUrl;

  return (
    <article
      className={
        light
          ? "group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_12px_30px_-22px_rgba(0,0,0,0.5)] transition duration-300 ease-out hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.55)] motion-reduce:transform-none motion-reduce:transition-none"
          : "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)] transition duration-300 ease-out hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_34px_70px_-32px_rgba(0,0,0,1)] motion-reduce:transform-none motion-reduce:transition-none"
      }
    >
      {/*
        Keyed on the permalink, not just the record: Instagram replaces the
        blockquote with its own iframe, so a corrected URL has to rebuild the
        card from scratch rather than update an attribute on markup that no
        longer exists.
      */}
      <InstagramEmbed key={permalink} permalink={reel.instagramUrl} title={reel.title} />

      <div
        className={`flex items-center justify-between gap-3 border-t px-3 py-2.5 ${
          light ? "border-zinc-200" : "border-white/10"
        }`}
      >
        <h3
          className={`min-w-0 truncate text-[.78rem] font-semibold leading-snug ${
            light ? "text-zinc-900" : "text-white"
          }`}
        >
          {reel.title}
        </h3>
        <a
          href={permalink ?? "https://www.instagram.com/"}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${reel.title} on Instagram`}
          title="View more on Instagram"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            light
              ? "border-zinc-300 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 focus-visible:outline-zinc-900"
              : "border-white/15 text-zinc-400 hover:border-white/50 hover:text-white focus-visible:outline-white"
          }`}
        >
          <ExternalLink size={13} aria-hidden />
        </a>
      </div>
    </article>
  );
}
