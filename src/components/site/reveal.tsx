"use client";
import type { CSSProperties, ReactNode } from "react";
import { useInView } from "./use-in-view";

/**
 * Scroll-reveal wrappers.
 *
 * These used to be framer-motion components, which pulled the whole motion
 * library (and its dependencies) into every page that used them. They are now
 * plain elements driven by CSS keyframes (see the "SCROLL REVEAL" block in
 * `globals.css`) and a tiny IntersectionObserver hook, so the markup and
 * behaviour stay recognisable while the client bundle drops the library.
 *
 * The API is unchanged: same props, same DOM shape (`<div>` with the caller's
 * class name), same one-shot fade-up, and the same `prefers-reduced-motion`
 * behaviour — reduced-motion readers simply get the visible end state.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal${inView ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? ({ "--reveal-delay": `${delay}s` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

export function Stagger({ children, className, delay = 0, gap = 0.07 }: { children: ReactNode; className?: string; delay?: number; gap?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "0px 0px -70px 0px" });
  return (
    <div
      ref={ref}
      className={`stagger${inView ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--stagger-delay": `${delay}s`, "--stagger-step": `${gap}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
