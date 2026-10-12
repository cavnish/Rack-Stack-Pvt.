"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";

import { SmartImage } from "@/components/site/smart-image";

/**
 * The About page hero.
 *
 * Separate from the rest of the About sections because this is the one block
 * that animates on load rather than on scroll: the photograph settles from a
 * slight scale-down over a long ease while the text arrives beneath it. That is
 * the same language the homepage hero uses, so the two pages feel related.
 *
 * The image is `priority` because it is the largest paint on the page and the
 * visitor is looking at nothing else while it loads.
 *
 * Every animation is skipped when the visitor has asked for reduced motion —
 * `useReducedMotion` drives the initial state rather than being checked inside
 * the variants, so a reduced-motion visitor gets the final state immediately
 * instead of a shortened version of the movement.
 */
export function AboutHero({
  image,
  title,
  description,
  primary,
  secondary,
}: {
  image: string;
  title: string;
  description: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}) {
  return (
    <section className="relative isolate flex min-h-[min(88svh,760px)] items-end overflow-hidden bg-zinc-950 text-white">
      <div aria-hidden className="about-hero-image absolute inset-0 -z-20">
        <SmartImage src={image} alt="" fill priority className="object-cover object-center" sizes="100vw" />
      </div>

      {/*
        Two scrims rather than one. The vertical wash keeps the bottom line of
        copy readable at every viewport height, and the horizontal one stops the
        left edge going muddy on wide screens where the gradient would otherwise
        stop short of the buttons.
      */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(9,9,11,.62)_0%,rgba(9,9,11,.30)_38%,rgba(9,9,11,.86)_100%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(9,9,11,.80)_0%,rgba(9,9,11,.42)_52%,rgba(9,9,11,.12)_100%)]" />

      <div className="container-shell w-full py-16 sm:py-20 lg:py-24">
        <div
          className="stagger is-visible max-w-4xl"
          style={{ "--stagger-delay": ".25s", "--stagger-step": ".11s" } as CSSProperties}
        >
          <p className="eyebrow text-red-400">About Rack &amp; Stack</p>

          <h1 className="hero-heading mt-6 text-balance">{title}</h1>

          <p className="hero-description mt-6 max-w-2xl text-zinc-300">{description}</p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={primary.href} className="btn-primary">
              {primary.label} <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link href={secondary.href} className="btn-light">
              {secondary.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
