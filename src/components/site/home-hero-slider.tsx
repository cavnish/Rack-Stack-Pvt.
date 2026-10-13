"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, MoveUpRight } from "lucide-react";
import { getImageProps } from "next/image";
import { preload } from "react-dom";
import { usePrefersReducedMotion } from "./use-reduced-motion";
import { internalHref } from "@/lib/site-url";

/**
 * Art-directed hero image.
 *
 * A hero often ships a different crop for phones and desktops. Rendering two
 * `next/image` elements for those two crops made *both* `priority`, so mobile
 * preloaded the desktop photo too (hundreds of KB that are never painted,
 * competing with the real LCP image), and desktop preloaded the phone crop. A
 * `<picture>` with one `<source media>` loads exactly one of them, and a single
 * `ReactDOM.preload` keeps that one discoverable in the server HTML without the
 * duplicate.
 *
 * The preload must not carry a `media` query that excludes the viewport being
 * measured: a phone is narrower than 768px, so a `(min-width: 768px)` preload is
 * never fetched there and the LCP image is left to late in-document discovery.
 * When desktop and mobile share one file the preload is unscoped, so every
 * viewport gets it; only genuinely different crops are media-scoped.
 * `priority` is passed only for the first, immediately visible slide; later
 * slides load eagerly but do not preload.
 */
function HeroArtImage({ desktopSrc, mobileSrc, alt, priority }: { desktopSrc: string; mobileSrc: string; alt: string; priority: boolean }) {
  const common = { alt, sizes: "100vw", fill: true } as const;
  const { props: desktop } = getImageProps({ ...common, src: desktopSrc, priority, loading: priority ? undefined : "eager" });
  const { props: mobile } = getImageProps({ ...common, src: mobileSrc, priority, loading: priority ? undefined : "eager" });
  const sameSource = desktopSrc === mobileSrc;

  if (priority) {
    if (sameSource) {
      preload(desktop.src, { as: "image", imageSrcSet: desktop.srcSet, imageSizes: desktop.sizes, fetchPriority: "high" });
    } else {
      preload(desktop.src, { as: "image", imageSrcSet: desktop.srcSet, imageSizes: desktop.sizes, media: "(min-width: 768px)", fetchPriority: "high" });
      preload(mobile.src, { as: "image", imageSrcSet: mobile.srcSet, imageSizes: mobile.sizes, media: "(max-width: 767px)", fetchPriority: "high" });
    }
  }

  return (
    <picture>
      {!sameSource ? <source media="(max-width: 767px)" srcSet={mobile.srcSet} sizes={mobile.sizes} /> : null}
      <img
        {...desktop}
        alt={alt}
        fetchPriority={priority ? "high" : undefined}
        className="object-cover"
        onError={(event) => {
          const img = event.currentTarget;
          if (img.dataset.fallback) return;
          img.dataset.fallback = "1";
          img.removeAttribute("srcset");
          img.src = "/illustrations/warehouse-storage.svg";
        }}
      />
    </picture>
  );
}

export type HeroHeadlineLine = { text: string; color: string | null };

export type HeroSlide = {
  id: number;
  eyebrow: string | null;
  title: string | null;
  highlightedText: string | null;
  headlineLines: HeroHeadlineLine[] | null;
  mobileHeadlineLines?: HeroHeadlineLine[] | null;
  description: string | null;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  imageAlt: string | null;
  videoUrl: string | null;
  primaryButtonText: string | null;
  primaryButtonUrl: string | null;
  secondaryButtonText: string | null;
  secondaryButtonUrl: string | null;
  tertiaryButtonText: string | null;
  tertiaryButtonUrl: string | null;
  trustPoints: string[] | null;
  overlayOpacity: number;
  textAlignment: "left" | "center" | "right";
  autoplay: boolean;
  duration: number;
  titleScale?: number | null;
};

/**
 * Column widths for the hero copy.
 *
 * Desktop is a two-column composition: the photograph stays full-bleed but a
 * left-to-right scrim darkens only the left, so the copy reads as a left column
 * and the industrial image as a right one. Capping the copy at just over half
 * the content width (`lg:max-w-[52%]`) is what keeps that balance and stops a
 * long headline from running the full width of the screen.
 */
const alignClass: Record<"left" | "center" | "right", { section: string; block: string; buttons: string }> = {
  left: { section: "items-start text-left", block: "w-full lg:max-w-[52%]", buttons: "justify-start" },
  center: { section: "items-center text-center", block: "mx-auto w-full max-w-2xl", buttons: "justify-center" },
  right: { section: "items-end text-right", block: "ml-auto w-full lg:max-w-[52%]", buttons: "justify-end" },
};

/**
 * Resolves a slide's headline into an ordered list of coloured lines.
 *
 * New slides store `headlineLines` directly. Slides saved before that column
 * existed only carry `title` + `highlightedText`, so those are turned into a
 * white line and a brand-red line, preserving the original look. Either way the
 * result is a flat list so the renderer treats every line identically — same
 * font family and weight, only the colour varies.
 */
function resolveHeadlineLines(slide: HeroSlide): HeroHeadlineLine[] {
  if (Array.isArray(slide.headlineLines) && slide.headlineLines.length > 0) {
    return slide.headlineLines.filter(
      (line): line is HeroHeadlineLine => Boolean(line) && typeof line.text === "string" && line.text.trim().length > 0,
    );
  }
  const derived: HeroHeadlineLine[] = [];
  if (slide.title) derived.push({ text: slide.title, color: null });
  if (slide.highlightedText) derived.push({ text: slide.highlightedText, color: "#E31E24" });
  return derived;
}

/**
 * Resolves the headline to render on phones (<768px).
 *
 * Slides store an optional `mobileHeadlineLines` split, authored separately in
 * the CMS so admins can control where the copy breaks per device. When a slide
 * has no mobile split — or it is blank — the desktop lines are used unchanged,
 * so the feature is purely additive and existing slides never change look.
 */
function resolveMobileHeadlineLines(slide: HeroSlide, desktopLines: HeroHeadlineLine[]): HeroHeadlineLine[] {
  if (Array.isArray(slide.mobileHeadlineLines) && slide.mobileHeadlineLines.length > 0) {
    const filtered = slide.mobileHeadlineLines.filter(
      (line): line is HeroHeadlineLine => Boolean(line) && typeof line.text === "string" && line.text.trim().length > 0,
    );
    if (filtered.length > 0) return filtered;
  }
  return desktopLines;
}

export function HomeHeroSlider({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const isReduced = usePrefersReducedMotion();
  const [pageReady, setPageReady] = useState(false);
  const [readyAt, setReadyAt] = useState<number | null>(null);
  const [rotationStarted, setRotationStarted] = useState(false);
  // Phones and small tablets render the CMS-authored mobile headline split
  // (`mobileHeadlineLines`); everything wider shows the desktop lines. SSR
  // renders the desktop lines so HTML and hydration agree, then the effect
  // corrects to the real viewport after mount — same pattern as the art-
  // directed `<picture>` crop, which switches at the same 768px boundary.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /**
   * Hold the first visible slide longer than the autoplay interval.
   *
   * The carousel swaps its full-bleed image every few seconds, and the browser
   * re-reads the largest contentful paint each time it does. If the first slide
   * gives way a second or two after `load`, the LCP can jump to whatever slide
   * happens to swap in next — a late, un-preloaded image that pushes the real
   * LCP well past the first paint (observed around 5-10s on throttled mobile
   * even though the first photo lands near 2.5s). Keeping the first, preloaded
   * slide on screen for a minimum of `MIN_FIRST_HOLD_MS` after the page is ready
   * lets that paint settle as the LCP before rotation begins, and leaves
   * visitors enough time to read the headline. Rotation then continues at the
   * per-slide `duration`.
   */
  const MIN_FIRST_HOLD_MS = 12000;

  /**
   * Floor for how long any single slide stays on screen.
   *
   * A slide whose `duration` is set very low (the seeded slides ship 3.5s) does
   * not give a visitor time to read the headline and description before the
   * photo swaps, which reads as an intrusive, twitchy carousel. The floor keeps
   * auto-rotation calm without overriding a deliberately longer per-slide
   * duration, and it is skipped entirely for reduced-motion visitors.
   */
  const MIN_SLIDE_MS = 6000;

  const setPause = (value: boolean) => {
    pausedRef.current = value;
    setPaused(value);
  };

  /**
   * Hold the first auto-advance until the page has finished loading.
   *
   * The carousel swaps its full-bleed image every few seconds. When that lands
   * while the rest of the page is still being fetched, the just-painted hero —
   * the element the browser already chose as LCP — is replaced by the next
   * slide's image, so the metric jumps to that later paint (observed around 5s).
   * Waiting for `load` keeps the first, preloaded slide as the LCP while still
   * giving visitors the rotation once the page has settled.
   */
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.readyState === "complete") {
      const id = requestAnimationFrame(() => {
        setPageReady(true);
        setReadyAt(performance.now());
      });
      return () => cancelAnimationFrame(id);
    }
    const onLoad = () => {
      setPageReady(true);
      setReadyAt(performance.now());
    };
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (count < 2 || isReduced || !pageReady) return;
    const slide = slides[active];
    if (!slide?.autoplay) return;
    const duration = Math.max(slide.duration > 0 ? slide.duration : 3500, MIN_SLIDE_MS);
    let accumulated = 0;
    let last = performance.now();
    let raf: number;
    const frame = (now: number) => {
      // Hold the first slide before the rotation starts moving.
      if (active === 0 && !rotationStarted && readyAt !== null && now - readyAt < MIN_FIRST_HOLD_MS) {
        last = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      const delta = now - last;
      last = now;
      if (!pausedRef.current) accumulated += delta;
      if (accumulated >= duration) {
        setRotationStarted(true);
        setActive((index) => (index + 1) % count);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, count, isReduced, pageReady, readyAt, rotationStarted, slides]);

  if (count === 0) return null;

  const goPrev = () => setActive((active - 1 + count) % count);
  const goNext = () => setActive((active + 1) % count);
  const activeSlide = slides[active];
  const desktopHeadlineLines = resolveHeadlineLines(activeSlide);
  const headlineLines = isMobile ? resolveMobileHeadlineLines(activeSlide, desktopHeadlineLines) : desktopHeadlineLines;
  const heroImageUrl = activeSlide.imageUrl || activeSlide.mobileImageUrl;
  const slideDuration = Math.max(activeSlide.duration > 0 ? activeSlide.duration : 3500, MIN_SLIDE_MS);
  // While the first slide is held so the LCP can settle, let the progress bar
  // count down across the full hold instead of finishing early and sitting full.
  const progressSeconds = active === 0 && !rotationStarted && pageReady && readyAt !== null ? Math.max(slideDuration, MIN_FIRST_HOLD_MS) : slideDuration;
  const align = alignClass[activeSlide.textAlignment ?? "left"];

  return (
    <section
      className="hero-carousel relative isolate overflow-hidden bg-zinc-950 text-white"
      aria-roledescription="carousel"
      aria-label="Featured storage systems"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
      onFocus={() => setPause(true)}
      onBlur={() => setPause(false)}
    >
      <div
          key={activeSlide.id}
          role="group"
          aria-roledescription="slide"
          aria-label={activeSlide.eyebrow ?? activeSlide.title ?? `Slide ${active + 1}`}
          className="hero-slide absolute inset-0"
        >
          {/* Background image */}
          {heroImageUrl ? (
            <div className="absolute inset-0">
              <HeroArtImage
                desktopSrc={heroImageUrl}
                mobileSrc={activeSlide.mobileImageUrl || heroImageUrl}
                alt={activeSlide.imageAlt ?? activeSlide.title ?? "Storage system showcase"}
                priority={active === 0}
              />
            </div>
          ) : null}
          {/* Background video */}
          {activeSlide.videoUrl ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={activeSlide.videoUrl}
              poster={heroImageUrl ?? undefined}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
          ) : null}

          {/* Overlay gradients.
              Desktop: a left-to-right scrim that is solid behind the copy column
              and almost clear on the right, so the industrial photo stays bright.
              Mobile: a top-to-bottom scrim so the stacked copy stays readable.
              The per-slide `overlayOpacity` nudges the strength of each. */}
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              background: "linear-gradient(90deg, rgba(6,7,9,0.96) 0%, rgba(6,7,9,0.9) 34%, rgba(6,7,9,0.62) 52%, rgba(6,7,9,0.2) 74%, rgba(6,7,9,0) 100%)",
              opacity: 0.72 + (Math.max(0, Math.min(100, activeSlide.overlayOpacity ?? 72)) / 100) * 0.28,
            }}
          />
          <div
            className="absolute inset-0 md:hidden"
            style={{
              background: "linear-gradient(180deg, rgba(6,7,9,0.97) 0%, rgba(6,7,9,0.88) 46%, rgba(6,7,9,0.72) 100%)",
              opacity: 0.85 + (Math.max(0, Math.min(100, activeSlide.overlayOpacity ?? 72)) / 100) * 0.15,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20 pointer-events-none" />
        </div>

      {/* Content — a sibling of the absolutely-positioned slide rather than a
          child of it, so the section's height follows the copy. A tall stacked
          mobile slide then grows the hero instead of the centred copy sliding
          under the bottom dots. */}
      <div
          key={`content-${activeSlide.id}`}
          className={`container-shell hero-shell relative z-10 flex flex-col justify-center px-5 sm:px-6 md:px-8 ${align.section}`}
        >
            <div
              className={`stagger is-visible ${align.block}`}
              style={{ "--stagger-delay": ".35s", "--stagger-step": ".13s" } as CSSProperties}
            >
              {/* Eyebrow badge */}
              {activeSlide.eyebrow ? (
                <div className="inline-flex max-w-full items-center relative mb-4 sm:mb-4 md:mb-5 select-none">
                  <span className="relative z-10 bg-[#E31E24] text-white font-black uppercase text-[0.7rem] sm:text-[0.75rem] md:text-[0.8rem] tracking-[0.1em] sm:tracking-[0.14em] px-3 sm:px-4 py-1 sm:py-1.5 shadow-md hero-badge-angled pr-4 sm:pr-6">
                    {activeSlide.eyebrow}
                  </span>
                  <span
                    className="absolute -bottom-1 right-0.5 w-3 h-1.5 bg-[#8b0f14] [clip-path:polygon(0_0,100%_0,0_100%)] -z-0"
                    aria-hidden="true"
                  />
                </div>
              ) : null}

              {/* Headline — one coloured block per line. The font family and
                  weight are fixed by `.hero-industrial-title`; only the colour is
                  per-line. `whitespace-pre-line` turns an Enter pressed in the
                  admin textarea into a real line break inside a single entry. */}
              {headlineLines.length > 0 ? (
                <h1
                  className="hero-industrial-title text-balance"
                  style={{ "--headline-scale": activeSlide.titleScale ?? 1 } as CSSProperties}
                >
                  {headlineLines.map((line, index) => (
                    <span
                      key={`${index}-${line.text.slice(0, 24)}`}
                      className="block whitespace-pre-line"
                      style={line.color ? { color: line.color } : undefined}
                    >
                      {line.text}
                    </span>
                  ))}
                </h1>
              ) : null}

              {/* Accent line */}
              <div className="w-14 sm:w-16 md:w-20 h-1 bg-[#E31E24] mt-4 sm:mt-5 mb-4 sm:mb-4" aria-hidden="true" />

              {/* Subheading & Description */}
              {activeSlide.description ? (() => {
                const parts = activeSlide.description.split(/\n\n+/);
                const hasSubheading = parts.length > 1;
                const subheading = hasSubheading ? parts[0] : null;
                const bodyText = hasSubheading ? parts.slice(1).join("\n\n") : activeSlide.description;

                return (
                  <div className="space-y-2">
                    {subheading ? (
                      <h2 className="text-[0.8rem] sm:text-[0.85rem] md:text-[0.9rem] font-extrabold uppercase tracking-wider text-white/90">
                        {subheading}
                      </h2>
                    ) : null}
                    <p className="hero-description text-zinc-300 text-pretty font-normal">
                      {bodyText}
                    </p>
                  </div>
                );
              })() : null}

              {/* CTA Buttons — on a phone each action takes its own full-width
                  row so the two primary actions are never cramped side by side;
                  from `sm` up they spread into a horizontal row. */}
              <div className={`mt-6 grid grid-cols-1 gap-2.5 sm:mt-6 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 ${align.buttons}`}>
                {activeSlide.primaryButtonText ? (
                  <Link
                    href={internalHref(activeSlide.primaryButtonUrl, "/products")}
                    className="btn-primary group w-full justify-center whitespace-nowrap font-bold uppercase tracking-wider text-[0.72rem] sm:w-auto sm:px-6 sm:text-xs px-5 shadow-lg shadow-red-950/30"
                  >
                    {activeSlide.primaryButtonText}
                    <MoveUpRight size={15} className="shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                ) : null}
                {activeSlide.secondaryButtonText ? (
                  <Link
                    href={internalHref(activeSlide.secondaryButtonUrl, "/request-a-quote")}
                    className="btn-light group w-full justify-center whitespace-nowrap font-bold uppercase tracking-wider text-[0.72rem] sm:w-auto sm:px-6 sm:text-xs px-5 backdrop-blur-sm bg-white/5 hover:bg-white hover:text-zinc-950 transition-colors"
                  >
                    {activeSlide.secondaryButtonText}
                  </Link>
                ) : null}
                {activeSlide.tertiaryButtonText ? (
                  <Link
                    href={internalHref(activeSlide.tertiaryButtonUrl, "/contact")}
                    className="group inline-flex items-center justify-center self-center justify-self-center w-fit gap-1.5 border-b border-white/20 px-1 pb-1 pt-1 text-[0.62rem] sm:text-xs font-bold uppercase tracking-[.1em] sm:tracking-[.12em] text-zinc-300 transition-colors hover:border-[#E31E24] hover:text-white"
                  >
                    {activeSlide.tertiaryButtonText}
                    <MoveUpRight size={12} className="shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                ) : null}
              </div>

              {/* Trust Points */}
              {activeSlide.trustPoints && activeSlide.trustPoints.length > 0 ? (
                <ul className={`mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-6 sm:gap-x-5 sm:gap-y-2 ${align.buttons}`}>
                  {activeSlide.trustPoints.map((point) => (
                    <li key={point} className="flex min-w-0 items-center gap-2 text-[0.62rem] sm:text-[0.68rem] font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em] text-zinc-400">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E31E24] shadow-[0_0_6px_rgba(227,30,36,0.5)]" />
                      <span className="min-w-0">{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

      {/* Slider navigation — only for multi-slide */}
      {count > 1 ? (
        <>
          {/* Desktop arrows — hidden below sm */}
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute left-3 md:left-5 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-black/45 sm:grid"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
            className="absolute right-3 md:right-5 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-black/45 sm:grid"
          >
            <ChevronRight size={18} />
          </button>

          {/* Progress bar + dots — desktop: bottom-left; mobile: bottom-center */}
          <div className="absolute bottom-3 left-5 z-20 w-32 max-sm:left-1/2 max-sm:-translate-x-1/2 sm:bottom-6 sm:left-6 sm:w-36">
            {!isReduced && activeSlide.autoplay ? (
              <div
                className="mb-1.5 h-[2px] w-full overflow-hidden rounded-full bg-white/15"
                role="presentation"
                aria-hidden="true"
              >
                <div
                  key={`progress-${active}`}
                  className="h-full origin-left bg-red-500"
                  style={{
                    animation: `hero-progress ${Math.max(1, progressSeconds / 1000)}s linear ${paused ? "paused" : "running"} forwards`,
                  }}
                />
              </div>
            ) : null}
            <div className="flex items-center gap-1.5">
              {slides.map((slide, index) => (
                <button
                  type="button"
                  key={slide.id}
                  onClick={() => setActive(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === active}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-full transition-colors sm:h-7 sm:min-w-7 ${
                    index === active ? "text-red-500" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <span
                    className={`block h-1 rounded-full bg-current transition-all duration-300 ${
                      index === active ? "w-5" : "w-1"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* Discover scroll indicator — desktop only, lifted clear of the WhatsApp
          button that floats in the same bottom-right corner. */}
      <a href="#capabilities" aria-label="Scroll to capabilities" className="absolute bottom-24 right-6 z-20 hidden items-center gap-2.5 text-[.6rem] font-bold uppercase tracking-[.14em] text-zinc-400 transition-colors hover:text-white lg:flex">
        Discover{" "}
        <span className="grid h-9 w-9 place-items-center rounded-full border border-white/20 transition-colors hover:border-white/50">
          <ChevronDown size={14} />
        </span>
      </a>
    </section>
  );
}
