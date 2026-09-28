"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Keeps a heading on one line by shrinking it, rather than by letting it wrap.
 *
 * Why not do this in CSS
 * ---------------------
 * `white-space: nowrap` alone cannot be made safe here. The headings that use
 * this are section headings, so their size is set by a fluid `clamp()` that was
 * chosen to look right at desktop width — which is far too large to fit
 * "Related Storage Systems" on a 320px screen. Switching `nowrap` on at that
 * size pushes the page wider than the viewport, and the requirement is
 * absolutely that it never does. Shrinking the text until it fits is the only
 * way to get both.
 *
 * CSS cannot do that either: deciding a font size from rendered text width needs
 * a measurement, and `calc()` has no way to ask how wide a string is. Shrinking
 * with `transform: scale()` would leave the layout box at the original size, so
 * the heading would reserve the wrong height and clip.
 *
 * What it does
 * -----------
 * Measures the rendered width, multiplies the font size by the overflow ratio,
 * and repeats until the text fits or the floor is reached. Shrinking is bounded
 * by `minPx`, and at the floor it gives up and lets the text wrap — a heading
 * that wraps is a much smaller problem than a page that scrolls sideways.
 *
 * The floor is expressed in pixels rather than rem on purpose: the point at
 * which a section heading stops being a heading is an absolute size, and it
 * should not move when the reader changes their browser's default font size.
 *
 * Measurement happens under `overflow-x: clip` so that an intermediate,
 * too-wide size can never widen the page while the loop is converging. Clip
 * rather than `hidden` because clip does not create a scroll container, and
 * remains on afterwards as a backstop.
 */
export function useFitHeading<T extends HTMLElement>(minPx: number) {
  const ref = useRef<T | null>(null);

  /**
   * Resets the element to its own stylesheet size, then shrinks from there.
   *
   * The reset matters: without it the second call would start from the already
   * shrunk size of the first, so a heading that briefly had a narrow container
   * would stay small when the container grew again.
   */
  const fit = useCallback(() => {
    // `minPx` of 0 is the "not requested" signal: a caller that does not want
    // the heading to fit to one line still gets a ref, so the hook can be passed
    // unconditionally rather than conditionally at every call site.
    if (minPx <= 0) return;

    const element = ref.current;
    if (!element) return;

    element.style.fontSize = "";
    element.style.whiteSpace = "nowrap";
    element.style.textWrap = "nowrap";
    element.style.overflowWrap = "normal";

    const computed = window.getComputedStyle(element);
    const basePx = Number.parseFloat(computed.fontSize);
    if (!Number.isFinite(basePx) || basePx <= 0) return;

    // `nowrap` plus no available width would divide by zero.
    const available = element.clientWidth;
    if (!available) return;

    let size = basePx;

    /*
     * Each pass reads the true unwrapped width, so the ratio converges on the
     * second pass at the latest. The cap is a guard against a pathological
     * reflow rather than a normal part of the algorithm.
     */
    for (let pass = 0; pass < 6; pass += 1) {
      const rendered = element.scrollWidth;
      if (rendered <= available) break;
      const next = (size * available) / rendered;
      if (!Number.isFinite(next) || next >= size) break;
      size = next;
      element.style.fontSize = `${size}px`;
    }

    if (size < minPx) {
      // Too small to stay on one line without becoming unreadable. Let it wrap.
      element.style.fontSize = "";
      element.style.whiteSpace = "";
      element.style.textWrap = "";
      element.style.overflowWrap = "";
    }
  }, [minPx]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    fit();

    /*
     * Re-fit on any width change, not just on the breakpoint the heading is
     * most likely to break at: the available width is the container's, and a
     * sidebar appearing, a font finishing loading or a scrollbar appearing all
     * change it without changing the viewport.
     */
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", fit);
      return () => window.removeEventListener("resize", fit);
    }

    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fit]);

  return ref;
}
