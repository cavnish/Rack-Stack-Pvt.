"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/**
 * Whether the reader has asked for reduced motion.
 *
 * A drop-in replacement for framer-motion's `useReducedMotion`, built on
 * `useSyncExternalStore` so it stays correct through hydration and re-renders on
 * the media query changing. Server-rendered markup assumes motion is allowed
 * (the CSS reveal holds the element hidden only under
 * `prefers-reduced-motion: no-preference`), and a reduced-motion reader gets the
 * settled state on the first client render.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
