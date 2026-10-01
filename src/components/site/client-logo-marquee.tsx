"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { SmartImage } from "@/components/site/smart-image";
import type { PublicClientLogo } from "@/lib/client-assets";

export type ClientLogo = PublicClientLogo;

/**
 * One track must be wider than the widest container the site uses (1280px) or the
 * two tracks stop covering the visible window and the far end of the strip goes
 * blank. Rather than stretch the cards to fill it — which is how a three-logo
 * roster ends up with the logos marooned 400px apart — a short roster is
 * repeated. Anything at or above the threshold is rendered once, so the common
 * case is untouched.
 */
const MIN_TRACK_ITEMS = 16;

/** Drift speed in px/s. Calm enough to read a wordmark, quick enough to read as moving. */
const PIXELS_PER_SECOND = 45;

/** The same roster, repeated only when it is too short to fill the window. */
function fillTrack(items: ClientLogo[]): ClientLogo[] {
  if (items.length === 0 || items.length >= MIN_TRACK_ITEMS) return items;
  const filled: ClientLogo[] = [];
  while (filled.length < MIN_TRACK_ITEMS) filled.push(...items);
  return filled.slice(0, MIN_TRACK_ITEMS);
}

/**
 * Tells the stylesheet how far to travel and how long to take.
 *
 * Both come from the measured width of one track, which is what makes the loop
 * seamless: the row is translated by exactly one track and then snaps back to
 * where it started, so the last logo to leave is followed by the first logo to
 * arrive with no gap and no jump.
 *
 * The duration is derived from that same width rather than fixed. A hard-coded
 * `320s` means the drift speeds up every time an editor removes a logo and
 * crawls every time one is added; dividing by a constant keeps the movement
 * identical whatever the roster holds.
 *
 * A `ResizeObserver` keeps both correct when the cards change size, which they do
 * on every breakpoint. Nothing here writes layout — only two custom properties on
 * an element that is already being GPU-transformed — so there is no reflow and no
 * shift when the numbers change.
 */
function useMarqueeMetrics(row: RefObject<HTMLDivElement | null>, track: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const rowElement = row.current;
    const trackElement = track.current;
    if (!rowElement || !trackElement) return;

    const apply = () => {
      // `offsetWidth` is the untransformed layout width, so measuring mid-animation
      // returns the same number every time.
      const width = trackElement.offsetWidth;
      if (width < 1) return;
      rowElement.style.setProperty("--marquee-shift", `-${width}px`);
      rowElement.style.setProperty("--marquee-duration", `${Math.max(20, Math.round(width / PIXELS_PER_SECOND))}s`);
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(trackElement);
    return () => observer.disconnect();
  }, [row, track]);
}

/**
 * The clipping window, the animated row and the duplicate that makes it loop.
 *
 * The window is what the reader sees and what clips the overflow; the row is
 * wider than the screen by design and is moved by a transform alone. The fade is
 * a mask on the window rather than a white overlay painted over the edges, so it
 * softens the logos themselves and cannot leave a white band if the section is
 * ever given a background.
 */
function Marquee({
  trackRef,
  children,
  label,
  variant,
}: {
  trackRef: RefObject<HTMLUListElement | null>;
  children: ReactNode;
  label: string;
  variant: "card" | "plate";
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  useMarqueeMetrics(rowRef, trackRef);

  return (
    <div className="logo-marquee" data-variant={variant}>
      <div className="logo-marquee-row" ref={rowRef}>
        <ul className="logo-marquee-track" ref={trackRef} aria-label={label}>
          {children}
        </ul>
        {/* Identical to the first track, which is what makes the wrap seamless. */}
        <ul className="logo-marquee-track" aria-hidden="true">
          {children}
        </ul>
      </div>
    </div>
  );
}

function CardLogo({ logo, decorative = false }: { logo: ClientLogo; decorative?: boolean }) {
  return (
    <li className="logo-marquee-card" title={logo.name} aria-hidden={decorative || undefined}>
      {/*
        `fallbackSrc=""` opts out of the shared warehouse illustration. A client
        mark that cannot load should read as a fault, not as a photograph of a
        warehouse sitting in the middle of someone else's logo.
      */}
      <SmartImage
        src={logo.imageUrl}
        alt={decorative ? "" : logo.altText || `${logo.name} logo`}
        width={180}
        height={80}
        sizes="180px"
        loading="lazy"
        fallbackSrc=""
        aria-hidden={decorative || undefined}
        className="logo-marquee-card-img"
      />
    </li>
  );
}

function PlateLogo({
  logo,
  decorative = false,
  showName = false,
}: {
  logo: ClientLogo;
  decorative?: boolean;
  showName?: boolean;
}) {
  return (
    <li className="logo-marquee-plate" title={logo.name} aria-hidden={decorative || undefined}>
      <SmartImage
        src={logo.imageUrl}
        alt={decorative ? "" : logo.altText || `${logo.name} logo`}
        width={140}
        height={70}
        sizes="140px"
        loading="lazy"
        fallbackSrc=""
        aria-hidden={decorative || undefined}
        className="logo-marquee-plate-img"
      />
      {showName ? <span className="logo-marquee-plate-name">{logo.name}</span> : null}
    </li>
  );
}

export function ClientLogoMarquee({
  logos,
  showNames = false,
  cards = false,
}: {
  logos: ClientLogo[];
  showNames?: boolean;
  /**
   * One evenly sized card per logo, the treatment the homepage and product-page
   * "trusted by" strips use.
   *
   * The name-plate below it is the `/clients` roster, where the client name is
   * spelled out next to the mark. Both scroll continuously at every viewport;
   * only the presentation differs.
   */
  cards?: boolean;
}) {
  const items = fillTrack(logos.filter((logo) => logo.imageUrl));
  const trackRef = useRef<HTMLUListElement>(null);

  if (logos.filter((logo) => logo.imageUrl).length === 0) {
    return (
      <p className="logo-marquee-empty" role="status">
        Client logos are being updated. Please check back shortly.
      </p>
    );
  }

  if (cards) {
    return (
      <Marquee trackRef={trackRef} label="Client logos" variant="card">
        {items.map((logo, index) => (
          <CardLogo key={`${logo.id}-${index}`} logo={logo} />
        ))}
      </Marquee>
    );
  }

  return (
    <Marquee trackRef={trackRef} label="Client logos" variant="plate">
      {items.map((logo, index) => (
        <PlateLogo key={`${logo.id}-${index}`} logo={logo} showName={showNames} />
      ))}
    </Marquee>
  );
}
