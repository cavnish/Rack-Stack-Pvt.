"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, BadgeCheck, Quote, Star } from "lucide-react";
import { SectionHeading } from "./ui";

/**
 * One published testimonial, in the shape the CMS hands over.
 *
 * Dates are `Date | string` because the two sources disagree: a live database
 * row carries real `Date` objects, while the static `testimonials.json` the
 * static-first layer prefers stores ISO strings. Typing the field as one or the
 * other is how a section ends up rendering `Invalid Date` in exactly one of the
 * two modes it is supposed to run in.
 */
export type PublicTestimonial = {
  id: number;
  clientName: string;
  company: string | null;
  designation: string | null;
  content: string;
  rating: number;
  image: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Formats a date without `toLocaleDateString`.
 *
 * The server and the browser are both asked for the same string here, and
 * `toLocaleDateString` is not guaranteed to agree between them: the build
 * machine and a visitor's machine can carry different ICU data and different
 * regional settings, so a card can render one month name on the server and
 * another in the DOM, which React reports as a hydration mismatch and the
 * browser silently patches. Spelling out the month from a fixed table removes
 * the dependency on the host entirely.
 */
function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** The first letter of the client's name, for the avatar fallback. */
function initialOf(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/** A rating is always five stars, filled to the score. Never out of range. */
function StarRow({ rating, size = 14, className = "" }: { rating: number; size?: number; className?: string }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((position) => (
        <Star
          key={position}
          size={size}
          aria-hidden="true"
          className={position <= filled ? "fill-[var(--red)] text-[var(--red)]" : "fill-transparent text-[var(--line)]"}
        />
      ))}
    </span>
  );
}

/**
 * The reviewer's face, or their initial.
 *
 * `SmartImage` is deliberately not used here. Its fallback is the warehouse
 * illustration the product pages use, which is a reasonable stand-in for a
 * missing product photograph and an absurd one for a person — a testimonial
 * card showing a racking diagram reads as a bug. A photo that fails to load
 * falls through to the initial instead, which is also what a testimonial with
 * no photo shows, so the card is uniform either way.
 */
function Avatar({ name, image, size = 56 }: { name: string; image: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (image && !failed) {
    return (
      <span
        className="relative block shrink-0 overflow-hidden rounded-full bg-[var(--paper)] ring-1 ring-[var(--line)]"
        style={{ width: size, height: size }}
      >
        <Image src={image} alt={name} fill sizes={`${size}px`} className="object-cover" onError={() => setFailed(true)} />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-[var(--ink)] font-bold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initialOf(name)}
    </span>
  );
}

function TestimonialCard({ item }: { item: PublicTestimonial }) {
  const date = formatDate(item.createdAt ?? item.updatedAt);
  return (
    <figure className="flex h-full flex-col border border-[var(--line)] bg-white p-6 shadow-[0_1px_2px_rgba(10,10,10,.04)] transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(10,10,10,.08)] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <StarRow rating={item.rating} />
        <Quote aria-hidden="true" size={34} className="-mt-1 shrink-0 fill-[var(--red)]/10 text-[var(--red)]/35" />
      </div>

      <blockquote className="mt-5 grow">
        <p className="text-[.98rem] leading-7 text-[var(--ink)] sm:text-[1.05rem] sm:leading-8">{item.content}</p>
      </blockquote>

      <figcaption className="mt-7 flex items-center gap-3.5 border-t border-[var(--line)] pt-5">
        <Avatar name={item.clientName} image={item.image} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-bold text-[var(--ink)]">
            {item.clientName}
            <BadgeCheck aria-label="Verified client" size={15} className="shrink-0 text-[var(--red)]" />
          </p>
          {item.designation || item.company ? (
            <p className="mt-0.5 truncate text-xs text-[#6B6B6B]">
              {[item.designation, item.company].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
        {date ? <span className="ml-auto shrink-0 text-[.68rem] font-semibold uppercase tracking-wider text-[#6B6B6B]">{date}</span> : null}
      </figcaption>
    </figure>
  );
}

/**
 * "What Our Clients Say" — the homepage testimonial band.
 *
 * Layout is CSS, not JavaScript. The track is a snap-scrolling row whose card
 * width is set by breakpoints, so the first paint is already correct at every
 * width: three cards on desktop, two on tablet, one on a phone. Measuring the
 * track is needed only to work out how many cards fit and where the page
 * boundaries are, and that runs after hydration, so it cannot change the
 * layout it is measuring.
 *
 * The scroll position is the single source of truth for the current page. The
 * arrows and the dots both write to it and listen back to it, which means a
 * swipe, a keyboard arrow key, a click on a dot and a click on an arrow can
 * never disagree about which page is showing.
 *
 * Everything on screen — the quotes, the stars, the average, the count, the
 * order — comes from the rows passed in, which are the published CMS records in
 * the order an editor arranged them. Nothing here is authored content: an empty
 * list renders nothing at all.
 */
export function TestimonialsSection({ items }: { items: PublicTestimonial[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [perView, setPerView] = useState(1);
  const [page, setPage] = useState(0);
  const [step, setStep] = useState(0);

  const count = items.length;
  const pages = Math.max(1, Math.ceil(count / perView));
  const average = count ? Math.round((items.reduce((total, item) => total + (item.rating || 0), 0) / count) * 10) / 10 : 0;

  const prefersReducedMotion = useCallback(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const goTo = useCallback(
    (target: number, perPage: number, cardStep: number) => {
      const track = trackRef.current;
      if (!track || cardStep <= 0) return;
      const last = Math.max(0, Math.ceil(count / perPage) - 1);
      const next = Math.max(0, Math.min(last, target));
      // Scrolling past the end is clamped by the browser, which is what lines a
      // short final page up with the right-hand edge instead of leaving it short.
      track.scrollTo({ left: next * perPage * cardStep, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      setPage(next);
    },
    [count, prefersReducedMotion],
  );

  /**
   * Re-measures how many cards fit.
   *
   * The card width is read from a rendered card rather than recomputed from a
   * breakpoint, so the number stays correct if the grid, the gutter or the
   * breakpoint ever change. Re-clamping the page matters on resize: a phone
   * showing page four of four becomes a desktop showing the same last page as
   * page one of two, and without this the arrows would sit dead while the
   * section showed a page the dots had lost track of.
   */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const card = track.firstElementChild as HTMLElement | null;
      if (!card) return;
      const styles = window.getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
      const cardWidth = card.getBoundingClientRect().width;
      if (cardWidth <= 0) return;
      const cardStep = cardWidth + gap;
      const fits = Math.max(1, Math.floor((track.clientWidth + gap) / cardStep));
      setStep(cardStep);
      setPerView((current) => (current === fits ? current : fits));
      const lastPage = Math.max(0, Math.ceil(count / fits) - 1);
      setPage((current) => (current > lastPage ? lastPage : current));
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [count]);

  /** Keeps the dots honest when the reader swipes instead of using the arrows. */
  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || step <= 0 || perView <= 0) return;
    const current = Math.round(track.scrollLeft / (step * perView));
    setPage((previous) => (previous === current ? previous : Math.max(0, current)));
  }, [step, perView]);

  if (count === 0) return null;

  const single = pages <= 1;

  return (
    <section id="client-feedback" aria-label="Client testimonials" className="bg-[#F5F5F3] py-14 sm:py-20">
      <div className="container-shell">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <SectionHeading eyebrow="Client feedback" title="What Our Clients Say" />
          </div>

          <div className="flex flex-wrap items-center gap-5 lg:justify-end">
            <div className="flex items-center gap-3 border border-[var(--line)] bg-white px-4 py-3">
              <span className="text-3xl font-bold leading-none tracking-tight text-[#0A0A0A]">{average.toFixed(1)}</span>
              <span className="flex flex-col gap-1">
                <StarRow rating={average} />
                <span className="text-[.68rem] font-semibold uppercase tracking-wider text-[#6B6B6B]">
                  {count} review{count === 1 ? "" : "s"}
                </span>
              </span>
            </div>

            {!single ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goTo(page - 1, perView, step)}
                  disabled={page === 0}
                  aria-label="Previous testimonials"
                  aria-controls="client-feedback-track"
                  className="grid h-11 w-11 place-items-center border border-[var(--ink)] bg-transparent text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-white disabled:cursor-not-allowed disabled:border-[var(--line)] disabled:text-[#6B6B6B] disabled:hover:bg-transparent"
                >
                  <ArrowLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(page + 1, perView, step)}
                  disabled={page >= pages - 1}
                  aria-label="Next testimonials"
                  aria-controls="client-feedback-track"
                  className="grid h-11 w-11 place-items-center border border-[var(--ink)] bg-[var(--ink)] text-white transition-colors hover:bg-[var(--red)] hover:border-[var(--red)] disabled:cursor-not-allowed disabled:border-[var(--line)] disabled:bg-transparent disabled:text-[#6B6B6B] disabled:hover:bg-transparent"
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div
          id="client-feedback-track"
          ref={trackRef}
          onScroll={handleScroll}
          onKeyDown={(event) => {
            if (single) return;
            if (event.key === "ArrowRight") {
              event.preventDefault();
              goTo(page + 1, perView, step);
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              goTo(page - 1, perView, step);
            }
          }}
          tabIndex={single ? -1 : 0}
          role="group"
          aria-roledescription="carousel"
          aria-label="What our clients say"
          className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`Testimonial ${index + 1} of ${count}`}
              className="w-full shrink-0 snap-start sm:w-[calc((100%-0.5rem)/2)] lg:w-[calc((100%-2rem)/3)]"
            >
              <TestimonialCard item={item} />
            </div>
          ))}
        </div>

        {!single ? (
          <div className="mt-7 flex items-center justify-center gap-2" role="tablist" aria-label="Testimonial pages">
            {Array.from({ length: pages }, (_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === page}
                aria-label={`Show testimonials ${index * perView + 1} to ${Math.min(count, (index + 1) * perView)}`}
                onClick={() => goTo(index, perView, step)}
                className={`h-2.5 transition-all ${index === page ? "w-8 bg-[var(--red)]" : "w-2.5 bg-[var(--ink)]/25 hover:bg-[var(--ink)]/45"}`}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-12 flex flex-col items-start gap-4 border-t border-[var(--line)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <StarRow rating={average} size={16} />
            <p className="text-sm text-[#6B6B6B]">
              <span className="font-bold text-[#0A0A0A]">{average.toFixed(1)} out of 5</span> from {count} published client review
              {count === 1 ? "" : "s"}
            </p>
          </div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
            <BadgeCheck size={15} className="text-[var(--red)]" aria-hidden="true" />
            Every review below is a verified Rack &amp; Stack client
          </p>
        </div>
      </div>
    </section>
  );
}
