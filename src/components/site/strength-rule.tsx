"use client";

import { useInView } from "./use-in-view";

/**
 * The red rule that draws itself above the lead commitment in "Why Rack & Stack".
 *
 * A width animation rather than a `scaleX` one, because scaling a 1px line is
 * also a 1px line at every scale factor, so it reads as a clean wipe; scaling
 * would leave it hairline-thin and slightly blurred at the start of the motion.
 * The growth is a CSS keyframe (`.strength-rule`), triggered by the same
 * IntersectionObserver hook the other reveals use — reduced-motion readers get
 * the finished rule with no animation.
 */
export function StrengthRule() {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "0px 0px -80px 0px" });
  return <div ref={ref} aria-hidden className={`strength-rule h-px origin-left bg-red-600 ${inView ? "is-visible" : ""}`} />;
}
