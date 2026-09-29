"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The red rule that draws itself above the lead commitment in "Why Rack & Stack".
 *
 * A width animation rather than a `scaleX` one, because scaling a 1px line is
 * also a 1px line at every scale factor, so it reads as a clean wipe; scaling
 * would leave it hairline-thin and slightly blurred at the start of the motion.
 */
export function StrengthRule() {
  const reduced = useReducedMotion();
  const anim = !reduced;
  return (
    <motion.div
      aria-hidden
      className="h-px origin-left bg-red-600"
      initial={anim ? { width: "0%" } : false}
      whileInView={anim ? { width: "100%" } : undefined}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: EASE }}
    />
  );
}
