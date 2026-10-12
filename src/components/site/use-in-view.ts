"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  /** Disconnect after the first intersection. Defaults to true (one-shot). */
  once?: boolean;
  /** IntersectionObserver rootMargin. Defaults to triggering 80px into view. */
  rootMargin?: string;
  threshold?: number;
};

/**
 * Reports when an element first scrolls into view.
 *
 * This is the whole runtime of the site's scroll reveals. The element is visible
 * in the server HTML and only hidden by CSS under
 * `@media (prefers-reduced-motion: no-preference)`, so the hook never has to
 * render a hidden state for reduced-motion or no-JS readers — it just flips the
 * `is-visible` class that lets the CSS animation run.
 *
 * If IntersectionObserver is unavailable the element is marked visible
 * immediately, so content can never be stranded hidden.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>({ once = true, rootMargin = "0px 0px -80px 0px", threshold = 0 }: Options = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      // No observer: reveal on the next frame rather than synchronously in the
      // effect body, which keeps this a normal async state update.
      const frame = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return { ref, inView };
}
