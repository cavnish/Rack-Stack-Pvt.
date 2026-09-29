"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

import { SmartImage } from "@/components/site/smart-image";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * An image that reveals itself as it scrolls into view.
 *
 * A plain fade-and-rise makes every photograph on a long page arrive the same
 * way, which is what makes a page read as a template. This opens a `clip-path`
 * over the frame instead — the picture is revealed from the bottom edge upward
 * while the image inside settles back from a slight over-scale — so the
 * movement reads as a shutter or a curtain rather than as a fade.
 *
 * Why the observer is not on the clipped element
 * ----------------------------------------------
 * The obvious version puts `whileInView` on the same `motion.div` that gets the
 * `clip-path`, and it silently never plays. `whileInView` watches that element
 * with an IntersectionObserver, and IntersectionObserver measures the visible
 * rectangle — which a fully clipped element does not have. Clipped to zero it
 * reports "not intersecting", so the animation that would un-clip it is never
 * triggered, and the image stays invisible for the whole visit. The failure is
 * completely silent: the markup, the alt text and the network request are all
 * correct, and the frame is simply blank.
 *
 * So the ref goes on the outer frame, which is never clipped, and the clip is
 * animated on a descendant by `useInView` instead of by `whileInView`.
 *
 * The reveal and the over-scale are separate elements so the clip edge stays
 * still while the picture moves behind it; clipping the element that is also
 * scaling would make the edge travel, which reads as a rendering fault.
 *
 * The caller sets the aspect ratio on `className` (e.g. `aspect-[4/5]`); this
 * only fills whatever box it is given.
 */
export function ImageReveal({
  src,
  alt,
  sizes,
  className = "",
  imgClassName = "object-cover",
  priority = false,
  position = "center",
}: {
  src: string;
  alt: string;
  /** Required for `fill`: tells the browser how wide the image will render. */
  sizes: string;
  /** Classes for the frame, including its aspect ratio. */
  className?: string;
  /** Classes for the image itself, e.g. the object-position. */
  imgClassName?: string;
  priority?: boolean;
  position?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const inView = useInView(frame, { once: true, margin: "-90px" });
  const reduced = useReducedMotion();
  const anim = !reduced;

  return (
    <div ref={frame} className={`relative overflow-hidden bg-zinc-200 ${className}`}>
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={!anim ? { clipPath: "inset(0% 0% 0% 0%)", scale: 1 } : inView ? { clipPath: "inset(0% 0% 0% 0%)", scale: 1 } : { clipPath: "inset(0% 0% 100% 0%)", scale: 1.14 }}
        transition={{ clipPath: { duration: 1.05, ease: EASE }, scale: { duration: 1.5, ease: EASE } }}
      >
        <SmartImage
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={imgClassName}
          style={{ objectPosition: position }}
        />
      </motion.div>
    </div>
  );
}
