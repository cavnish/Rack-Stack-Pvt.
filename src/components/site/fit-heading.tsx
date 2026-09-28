"use client";

import type { ComponentPropsWithoutRef, ElementType } from "react";

import { useFitHeading } from "@/components/site/use-fit-heading";

/**
 * A heading that holds one line, for the section headings written as a bare
 * `<h2 className="section-heading">` rather than through `SectionHeading`.
 *
 * `SectionHeading` is the right component for most section headings and covers
 * them in one place. This exists for the ones that are not: a heading beside an
 * image, a CTA band's heading, a heading inside a card row. Without it those
 * would either be left wrapping while their neighbours hold one line, or each
 * would need its own copy of the fitting logic.
 *
 * Client-side on purpose, like the hook behind it: deciding a font size from
 * rendered text needs a measurement, and the text of most of these headings
 * comes from the CMS, so the size cannot be known at build time. It is still
 * rendered on the server, so the heading is in the HTML before hydration — the
 * fit is a refinement, not something the page waits for.
 */
export function FitHeading({
  as: Tag = "h2",
  className = "",
  minPx = 20,
  children,
  ...rest
}: {
  /** The element to render. Defaults to `h2`; `h1`/`h3` are valid too. */
  as?: ElementType;
  /** Extra classes, merged with `fit-heading`. */
  className?: string;
  /** Smallest size the heading will shrink to before it wraps instead. */
  minPx?: number;
  children: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<"h2">, "className" | "children">) {
  const ref = useFitHeading<HTMLHeadingElement>(minPx);
  return (
    <Tag ref={ref} className={`fit-heading ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
