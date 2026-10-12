"use client";

import { useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * The rail that draws itself down the "Our Approach" steps as they scroll past.
 *
 * The seven steps are a sequence, and a sequence is easier to read when the
 * page shows where you are in it. This is tied to the step list's own scroll
 * progress rather than to a timer, so the line is always exactly as far through
 * the process as the reader is — scrubbing back up shortens it.
 *
 * A passive scroll listener feeds a `requestAnimationFrame` that maps the rail's
 * viewport position onto `--rail-progress`, which the fill div turns into
 * `scaleY`. The threshold window matches the old framer `useScroll` offsets
 * ("start 65% / end 35%"): the line starts filling once the first step is
 * comfortably on screen and finishes as the last one leaves. Reduced-motion
 * readers get the line fully drawn with no animation.
 */
export function ApproachProgressRail() {
  const target = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const frame = target.current;
    const line = fill.current;
    if (!frame || !line) return;

    if (reduced) {
      line.style.transform = "scaleY(1)";
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = frame.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const start = viewportHeight * 0.65;
      const end = viewportHeight * 0.35;
      const total = rect.height + (start - end);
      const progress = Math.min(1, Math.max(0, (start - rect.top) / total));
      line.style.transform = `scaleY(${progress})`;
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
    };
  }, [reduced]);

  return (
    <div
      ref={target}
      aria-hidden
      // The line is centred on the step nodes, which are `w-8` and start at the
      // list's left edge, so `left-4` (half of 2rem) lands on their centre line.
      className="pointer-events-none absolute bottom-6 left-4 top-6 w-px bg-zinc-200"
    >
      <div ref={fill} className="h-full w-full origin-top bg-red-600" />
    </div>
  );
}