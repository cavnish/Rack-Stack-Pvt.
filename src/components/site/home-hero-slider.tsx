"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowDown, ChevronLeft, ChevronRight, MoveUpRight } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";

export type HeroSlide = {
  id: number;
  eyebrow: string | null;
  title: string | null;
  highlightedText: string | null;
  description: string | null;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  imageAlt: string | null;
  videoUrl: string | null;
  primaryButtonText: string | null;
  primaryButtonUrl: string | null;
  secondaryButtonText: string | null;
  secondaryButtonUrl: string | null;
  tertiaryButtonText: string | null;
  tertiaryButtonUrl: string | null;
  trustPoints: string[] | null;
  overlayOpacity: number;
  textAlignment: "left" | "center" | "right";
  autoplay: boolean;
  duration: number;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const alignClass: Record<"left" | "center" | "right", { section: string; block: string; buttons: string }> = {
  left: { section: "items-start text-left", block: "max-w-4xl", buttons: "justify-start" },
  center: { section: "items-center text-center", block: "mx-auto max-w-3xl", buttons: "justify-center" },
  right: { section: "items-end text-right", block: "ml-auto max-w-4xl", buttons: "justify-end" },
};

export function HomeHeroSlider({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const reduce = useReducedMotion();
  const isReduced = reduce === true;

  const setPause = (value: boolean) => {
    pausedRef.current = value;
    setPaused(value);
  };

  useEffect(() => {
    if (count < 2 || isReduced) return;
    const slide = slides[active];
    if (!slide?.autoplay) return;
    const duration = slide.duration > 0 ? slide.duration : 3500;
    let accumulated = 0;
    let last = performance.now();
    let raf: number;
    const frame = (now: number) => {
      const delta = now - last;
      last = now;
      if (!pausedRef.current) accumulated += delta;
      if (accumulated >= duration) {
        setActive((index) => (index + 1) % count);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, count, isReduced, slides]);

  if (count === 0) return null;

  const goPrev = () => setActive((active - 1 + count) % count);
  const goNext = () => setActive((active + 1) % count);
  const activeSlide = slides[active];

  const slideFade: Variants = {
    enter: { opacity: 0, transition: { duration: isReduced ? 0 : 0.9, ease: EASE } },
    center: { opacity: 1, transition: { duration: isReduced ? 0 : 0.9, ease: EASE } },
    exit: { opacity: 0, transition: { duration: isReduced ? 0 : 0.7, ease: EASE } },
  };

  const contentContainer: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: isReduced ? 0 : 0.13, delayChildren: isReduced ? 0 : 0.35 } },
  };

  const contentItem: Variants = {
    hidden: isReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 },
    show: { opacity: 1, y: 0, transition: { duration: isReduced ? 0 : 0.7, ease: EASE } },
  };

  return (
    <section
      className="relative isolate min-h-[max(560px,calc(100svh-72px))] overflow-hidden bg-zinc-950 text-white"
      aria-roledescription="carousel"
      aria-label="Featured storage systems"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
      onFocus={() => setPause(true)}
      onBlur={() => setPause(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={activeSlide.id}
          role="group"
          aria-roledescription="slide"
          aria-label={activeSlide.eyebrow ?? activeSlide.title ?? `Slide ${active + 1}`}
          variants={slideFade}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          {activeSlide.imageUrl ? (
            <motion.div
              initial={isReduced ? { scale: 1 } : { scale: 1.15 }}
              animate={{ scale: isReduced ? 1 : 1.02 }}
              transition={{ duration: isReduced ? 0 : 12, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 hidden md:block">
                <SmartImage
                  src={activeSlide.imageUrl}
                  alt={activeSlide.imageAlt ?? activeSlide.title ?? "Storage system showcase"}
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
              {activeSlide.mobileImageUrl ? (
                <div className="absolute inset-0 md:hidden">
                  <SmartImage
                    src={activeSlide.mobileImageUrl}
                    alt={activeSlide.imageAlt ?? activeSlide.title ?? "Storage system showcase"}
                    fill
                    priority
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              ) : null}
            </motion.div>
          ) : null}
          {activeSlide.videoUrl ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={activeSlide.videoUrl}
              poster={activeSlide.imageUrl ?? undefined}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
          ) : null}
          <div
            className="absolute inset-0 bg-[linear-gradient(90deg,#07090b_0%,rgba(7,9,11,.78)_38%,rgba(7,9,11,.28)_78%,rgba(7,9,11,.12)_100%)]"
            style={{ opacity: 0.55 + (Math.max(0, Math.min(100, activeSlide.overlayOpacity ?? 72)) / 100) * 0.45 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/30" />

          <div className={`container-shell relative z-10 flex h-full flex-col justify-center py-16 sm:py-20 ${alignClass[activeSlide.textAlignment ?? "left"].section}`}>
            <motion.div className={alignClass[activeSlide.textAlignment ?? "left"].block} variants={contentContainer} initial="hidden" animate="show">
              {activeSlide.eyebrow ? <motion.p variants={contentItem} className="eyebrow text-red-400">{activeSlide.eyebrow}</motion.p> : null}
              <motion.h1 variants={contentItem} className="hero-heading hero-heading-home mt-5 text-balance sm:mt-7">
                {activeSlide.title ? (
                  <>
                    {activeSlide.title}
                  </>
                ) : null}
                {activeSlide.highlightedText ? <span className="hero-accent text-red-500">{activeSlide.highlightedText}</span> : null}
              </motion.h1>
              {activeSlide.description ? (
                <motion.p variants={contentItem} className="hero-description hero-description-home mt-5 text-zinc-300">
                  {activeSlide.description}
                </motion.p>
              ) : null}
              <motion.div variants={contentItem} className={`mt-7 flex flex-wrap items-center gap-3 sm:mt-9 sm:items-center ${alignClass[activeSlide.textAlignment ?? "left"].buttons}`}>
                {activeSlide.primaryButtonText ? (
                  <Link href={activeSlide.primaryButtonUrl || "/products"} className="btn-primary group w-full sm:w-auto">
                    {activeSlide.primaryButtonText}
                    <MoveUpRight size={17} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                ) : null}
                {activeSlide.secondaryButtonText ? (
                  <Link href={activeSlide.secondaryButtonUrl || "/request-a-quote"} className="btn-light w-full sm:w-auto">
                    {activeSlide.secondaryButtonText}
                  </Link>
                ) : null}
                {activeSlide.tertiaryButtonText ? (
                  <Link
                    href={activeSlide.tertiaryButtonUrl || "/contact"}
                    className="group inline-flex items-center gap-2 border-b border-white/25 px-1 pb-1 text-xs font-bold uppercase tracking-[.14em] text-zinc-200 transition-colors hover:border-red-500 hover:text-white"
                  >
                    {activeSlide.tertiaryButtonText}
                    <MoveUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                ) : null}
              </motion.div>
              {activeSlide.trustPoints && activeSlide.trustPoints.length > 0 ? (
                <motion.ul variants={contentItem} className={`mt-6 flex flex-wrap gap-x-7 gap-y-2.5 sm:mt-8 ${alignClass[activeSlide.textAlignment ?? "left"].buttons}`}>
                  {activeSlide.trustPoints.map((point) => (
                    <li key={point} className="flex items-center gap-2.5 text-[.68rem] font-bold uppercase tracking-[.14em] text-zinc-300">
                      <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(209,31,47,.18)]" />
                      {point}
                    </li>
                  ))}
                </motion.ul>
              ) : null}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/5 text-white backdrop-blur transition hover:border-white/60 hover:bg-white/15 sm:grid"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/5 text-white backdrop-blur transition hover:border-white/60 hover:bg-white/15 sm:grid"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-8 left-6 z-20 w-44">
            {!isReduced && activeSlide.autoplay ? (
              <div
                className="mb-3 h-0.5 w-full overflow-hidden rounded-full bg-white/20"
                role="presentation"
                aria-hidden="true"
              >
                <div
                  key={`progress-${active}`}
                  className="h-full origin-left bg-red-500"
                  style={{
                    animation: `hero-progress ${Math.max(1, (activeSlide.duration > 0 ? activeSlide.duration : 3500) / 1000)}s linear forwards`,
                    animationPlayState: paused ? "paused" : "running",
                  }}
                />
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {slides.map((slide, index) => (
                  <button
                    type="button"
                    key={slide.id}
                    onClick={() => setActive(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={index === active}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === active ? "w-7 bg-red-500" : "w-1.5 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      <a href="#capabilities" aria-label="Scroll to capabilities" className="absolute bottom-8 right-6 z-20 hidden items-center gap-3 text-[.62rem] font-bold uppercase tracking-[.16em] text-zinc-400 md:flex">
        Discover{" "}
        <span className="grid h-10 w-10 place-items-center rounded-full border border-white/25 transition-colors hover:border-white/60">
          <ArrowDown size={15} />
        </span>
      </a>
    </section>
  );
}