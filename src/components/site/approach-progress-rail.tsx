"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";

/**
 * The rail that draws itself down the "Our Approach" steps as they scroll past.
 *
 * The seven steps are a sequence, and a sequence is easier to read when the
 * page shows where you are in it. This is tied to the step list's own scroll
 * progress rather than to a timer, so the line is always exactly as far through
 * the process as the reader is — scrubbing back up shortens it.
 *
 * `useScroll` is given explicit offsets instead of the default: the line should
 * start filling once the first step is comfortably on screen and finish as the
 * last one leaves, which is what the "start 65% / end 35%" pair describes.
 *
 * A spring smooths the raw scroll value, which is stepped rather than
 * continuous on a trackpad, so the line would otherwise jump between values.
 */
export function ApproachProgressRail() {
  const target = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target,
    offset: ["start 65%", "end 35%"],
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.4,
  });

  return (
    <div
      ref={target}
      aria-hidden
      // The line is centred on the step nodes, which are `w-8` and start at the
      // list's left edge, so `left-4` (half of 2rem) lands on their centre line.
      className="pointer-events-none absolute bottom-6 left-4 top-6 w-px bg-zinc-200"
    >
      <motion.div
        className="h-full w-full origin-top bg-red-600"
        style={reduced ? { scaleY: 1 } : { scaleY }}
      />
    </div>
  );
}
