"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { SmartImage } from "@/components/site/smart-image";

const EASE = [0.22, 1, 0.36, 1] as const;

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
  const reduced = useReducedMotion();
  const anim = !reduced;
  const initial = anim ? "hidden" : false;
  const show = anim ? "show" : undefined;

  return (
    <section className="relative isolate flex min-h-[min(88svh,760px)] items-end overflow-hidden bg-zinc-950 text-white">
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-20"
        initial={anim ? { scale: 1.08 } : false}
        animate={anim ? { scale: 1 } : undefined}
        transition={{ duration: 2.4, ease: EASE }}
      >
        <SmartImage src={image} alt="" fill priority className="object-cover object-center" sizes="100vw" />
      </motion.div>

      {/*
        Two scrims rather than one. The vertical wash keeps the bottom line of
        copy readable at every viewport height, and the horizontal one stops the
        left edge going muddy on wide screens where the gradient would otherwise
        stop short of the buttons.
      */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(9,9,11,.62)_0%,rgba(9,9,11,.30)_38%,rgba(9,9,11,.86)_100%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(9,9,11,.80)_0%,rgba(9,9,11,.42)_52%,rgba(9,9,11,.12)_100%)]" />

      <motion.div
        className="container-shell w-full py-16 sm:py-20 lg:py-24"
        initial={initial}
        animate={show}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.11, delayChildren: 0.25 } },
        }}
      >
        <div className="max-w-4xl">
          <motion.p
            variants={anim ? item : undefined}
            className="eyebrow text-red-400"
          >
            About Rack &amp; Stack
          </motion.p>

          <motion.h1
            variants={anim ? item : undefined}
            className="hero-heading mt-6 text-balance"
          >
            {title}
          </motion.h1>

          <motion.p
            variants={anim ? item : undefined}
            className="hero-description mt-6 max-w-2xl text-zinc-300"
          >
            {description}
          </motion.p>

          <motion.div variants={anim ? item : undefined} className="mt-9 flex flex-wrap gap-3">
            <Link href={primary.href} className="btn-primary">
              {primary.label} <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link href={secondary.href} className="btn-light">
              {secondary.label}
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

const item = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
};
