"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
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
 *
 * The cards live on a horizontally snapping shelf rather than in a wrapping
 * grid: a 9:16 card is far too tall for a grid row, so a grid turns the section
 * into a wall of whitespace. The shelf is a real scroll container — native
 * touch swipe on mobile, a trackpad swipe on desktop — and the arrow controls
 * simply drive its `scrollBy`, so there is no carousel library to ship and the
 * keyboard and pointer paths are the ones the browser already implements.
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
  const shelfWrapRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Only Reels with a permalink Instagram itself will resolve are worth a card;
  // everything else would render as a dead frame.
  const items = (maxItems ? videos.slice(0, maxItems) : videos).filter((reel) =>
    Boolean(parseInstagramUrl(reel.instagramUrl).ok),
  );
  const itemCount = items.length;

  const shelf = useCallback(
    () => shelfWrapRef.current?.querySelector<HTMLElement>(".reel-shelf") ?? null,
    [],
  );

  // Track whether the shelf has anything to scroll so the arrows can enable and
  // disable themselves instead of pretending to work at either end.
  useEffect(() => {
    const element = shelf();
    if (!element) return;
    const sync = () => {
      const max = element.scrollWidth - element.clientWidth;
      setCanScrollLeft(element.scrollLeft > 4);
      setCanScrollRight(element.scrollLeft < max - 4);
    };
    sync();
    element.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    const observer = new ResizeObserver(sync);
    observer.observe(element);
    // The shelf's own width does not change when Instagram's iframes resize
    // inside it, so watch the cards too and re-sync once they have mounted.
    Array.from(element.children).forEach((child) => observer.observe(child));
    return () => {
      element.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      observer.disconnect();
    };
  }, [shelf, itemCount]);

  const scrollByCard = useCallback(
    (direction: -1 | 1) => {
      const element = shelf();
      if (!element) return;
      const first = element.firstElementChild as HTMLElement | null;
      const step = first ? first.getBoundingClientRect().width + 16 : element.clientWidth * 0.8;
      element.scrollBy({ left: direction * step, behavior: "smooth" });
    },
    [shelf],
  );

  if (items.length === 0) return null;

  const light = surface === "light";

  const arrowClass = `grid h-10 w-10 shrink-0 place-items-center rounded-full border transition disabled:cursor-default ${
    light
      ? "border-zinc-300 text-zinc-600 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white disabled:opacity-35 disabled:hover:border-zinc-300 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
      : "border-white/20 text-white hover:border-white hover:bg-white hover:text-zinc-950 disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:bg-transparent disabled:hover:text-white"
  }`;

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

          <div className="flex shrink-0 items-center gap-3">
            {cta ? (
              // Outlined on the light surface, solid-white on the dark one: the
              // same weight of emphasis without a heavy block on a bright page.
              <Link href={cta.href} className={`w-fit ${light ? "btn-secondary" : "btn-light"}`}>
                {cta.label}
              </Link>
            ) : null}

            {/*
              Arrow controls. They are pure enhancement: the shelf is a native
              scroll container, so it is fully usable by touch and trackpad
              without them, and they are hidden on phones where the gesture is
              the natural interaction.
            */}
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                className={arrowClass}
                onClick={() => scrollByCard(-1)}
                disabled={!canScrollLeft}
                aria-label="Show previous reels"
              >
                <ChevronLeft size={18} aria-hidden />
              </button>
              <button
                type="button"
                className={arrowClass}
                onClick={() => scrollByCard(1)}
                disabled={!canScrollRight}
                aria-label="Show more reels"
              >
                <ChevronRight size={18} aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {/*
          The shelf. Its card widths are owned by `.reel-shelf` in globals.css,
          which derives them from the container so a full row lands exactly on
          the container edge. It deliberately has no negative margins: those
          pulled it wider than the viewport, which the page's `overflow-x:clip`
          then silently cut — the "last card sliced in half" on tablet.
        */}
        <div ref={shelfWrapRef} role="group" aria-label="Reels carousel">
          <Stagger
            className="reel-shelf no-scrollbar flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto overscroll-x-contain pb-3 pt-1"
          >
            {items.map((reel) => (
              <div key={reel.id} className="shrink-0 snap-start">
                <ReelCard reel={reel} light={light} />
              </div>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

/**
 * One Reel.
 *
 * The video fills the card: a 9:16 frame, a hairline border and a shadow deep
 * enough to separate it from its section without a glow. Instagram renders its
 * own caption, audio label and action bar inside the frame, so the Reel name
 * sits underneath in a slim footer instead of being laid over the picture.
 *
 * The 9:16 frame is the card's own aspect ratio, so the embed is never stretched
 * and every card in the row is the same size whatever Instagram renders inside.
 */
function ReelCard({ reel, light = false }: { reel: ReelVideoItem; light?: boolean }) {
  const parsed = parseInstagramUrl(reel.instagramUrl);
  const permalink = parsed.ok ? parsed.ref.permalink : null;

  return (
    <article
      className={
        light
          ? "group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_14px_34px_-26px_rgba(0,0,0,0.55)] transition duration-300 ease-out hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_24px_48px_-26px_rgba(0,0,0,0.6)] motion-reduce:transform-none motion-reduce:transition-none"
          : "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)] transition duration-300 ease-out hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_34px_70px_-32px_rgba(0,0,0,1)] motion-reduce:transform-none motion-reduce:transition-none"
      }
    >
      {/*
        Keyed on the permalink, not just the record: Instagram replaces the
        blockquote with its own iframe, so a corrected URL has to rebuild the
        card from scratch rather than update an attribute on markup that no
        longer exists.
      */}
      <InstagramEmbed key={permalink ?? reel.id} permalink={reel.instagramUrl} title={reel.title} />

      <div
        className={`flex items-center justify-between gap-3 border-t px-3.5 py-3 ${
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
