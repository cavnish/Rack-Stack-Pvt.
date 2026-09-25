"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Maximize2, X } from "lucide-react";
import { SmartImage } from "./smart-image";
import { optimizeImage } from "@/lib/image-utils";

type GalleryImage = { id: number | string; imageUrl: string; altText: string; caption: string | null };
type Specification = { id: number | string; specificationName: string; specificationValue: string };

export function ProductGallery({ images, productTitle }: { images: GalleryImage[]; productTitle?: string }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = images.length;
  const prev = useCallback(() => setActive((v) => (v - 1 + count) % count), [count]);
  const next = useCallback(() => setActive((v) => (v + 1) % count), [count]);
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, prev, next]);
  if (!count) return null;
  const activeIndex = Math.min(active, count - 1);
  const image = images[activeIndex];
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(count - 1); }
  };
  return (
    <div>
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Product image gallery"
        tabIndex={0}
        className="relative"
        onKeyDown={handleKeyDown}
        onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
        onTouchEnd={(e) => { if (touchX.current == null) return; const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current; if (dx > 40) prev(); if (dx < -40) next(); touchX.current = null; }}
      >
        <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-sm">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={image.id}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 cursor-pointer"
              onClick={() => setZoom(true)}
            >
              <SmartImage
                src={optimizeImage(image.imageUrl, 1600)}
                alt={image.altText || productTitle || "Product image"}
                fill
                priority={activeIndex === 0}
                className="object-cover object-center transition duration-700 group-hover:scale-[1.02]"
                sizes="(max-width: 1023px) 100vw, 52vw"
              />
            </motion.div>
          </AnimatePresence>

          {/* Floating Navigation Arrows (White circular buttons matching screenshot) */}
          {count > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous image"
                className="absolute left-3.5 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-zinc-800 shadow-md transition-all duration-200 hover:bg-white hover:scale-105 active:scale-95 sm:left-4"
              >
                <ChevronLeft size={20} strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next image"
                className="absolute right-3.5 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-zinc-800 shadow-md transition-all duration-200 hover:bg-white hover:scale-105 active:scale-95 sm:right-4"
              >
                <ChevronRight size={20} strokeWidth={2.4} />
              </button>
            </>
          ) : null}

          {/* Bottom-left Pill Badge (Product / Rack Title with Icon) */}
          <div className="pointer-events-none absolute bottom-3.5 left-3.5 z-20 flex max-w-[70%] items-center gap-2 rounded-lg bg-zinc-950/75 px-3 py-1.5 text-xs font-semibold text-white shadow backdrop-blur-md sm:bottom-4 sm:left-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-white/80"><rect width="20" height="20" x="2" y="2" rx="2"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M2 12h20"/><path d="M2 7h20"/><path d="M2 17h20"/></svg>
            <span className="truncate">{image.caption || productTitle || "Storage System"}</span>
          </div>

          {/* Bottom-right Counter Pill (e.g. 1 / 6) */}
          {count > 1 ? (
            <div className="pointer-events-none absolute bottom-3.5 right-3.5 z-20 rounded-lg bg-zinc-950/75 px-2.5 py-1.5 text-xs font-bold tracking-wider text-white shadow backdrop-blur-md sm:bottom-4 sm:right-4">
              {activeIndex + 1} / {count}
            </div>
          ) : null}

          {/* Top-right Zoom Trigger */}
          <button
            type="button"
            onClick={() => setZoom(true)}
            aria-label="View full size image"
            className="absolute right-3.5 top-3.5 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-zinc-800 shadow-sm backdrop-blur transition-all hover:bg-white hover:scale-105 sm:right-4 sm:top-4"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* 6-Column Thumbnail Grid directly below main image */}
      {count > 1 ? (
        <div className="mt-3 grid grid-cols-6 gap-2 sm:mt-4 sm:gap-3">
          {images.slice(0, 6).map((item, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setActive(index)}
                aria-label={`View image ${index + 1}`}
                aria-current={isActive}
                className={`group relative aspect-[4/3] w-full overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "border-[#d11f2f] ring-2 ring-[#d11f2f]/30 scale-[1.02] shadow-sm"
                    : "border-transparent opacity-75 hover:opacity-100 hover:border-zinc-300"
                }`}
              >
                <SmartImage
                  src={optimizeImage(item.imageUrl, 320)}
                  alt=""
                  fill
                  loading="lazy"
                  className="object-cover object-center"
                  sizes="(max-width: 767px) 16vw, (max-width: 1023px) 20vw, 10vw"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Fullscreen Lightbox Modal */}
      {zoom ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-zinc-950/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${image.altText} fullscreen`}
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            onClick={() => setZoom(false)}
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center text-white hover:text-red-400 transition-colors"
            aria-label="Close fullscreen image"
          >
            <X size={28} />
          </button>
          {count > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <ChevronLeft size={26} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next image"
                className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10"
              >
                <ChevronRight size={26} />
              </button>
            </>
          ) : null}
          <div className="relative h-[86vh] w-full max-w-7xl" onClick={(event) => event.stopPropagation()}>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={image.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <SmartImage
                  src={optimizeImage(image.imageUrl, 2000)}
                  alt={image.altText || productTitle || "Product fullscreen"}
                  fill
                  className="object-cover object-center"
                  sizes="100vw"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          {count > 1 ? (
            <span className="absolute bottom-4 text-xs font-bold uppercase tracking-[.2em] text-white/70">
              {activeIndex + 1} / {count}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SpecificationPanel({ specifications }: { specifications: Specification[] }) {
  return <>
    <div className="hidden border-t border-zinc-950 sm:block">{specifications.map((spec) => <div key={spec.id} className="grid grid-cols-2 gap-4 border-b border-zinc-200 py-4 text-sm"><span className="font-semibold">{spec.specificationName}</span><span className="text-zinc-600">{spec.specificationValue}</span></div>)}</div>
    <div className="divide-y divide-zinc-200 border-y border-zinc-300 sm:hidden">{specifications.map((spec) => <details key={spec.id} className="group py-4"><summary className="cursor-pointer list-none text-sm font-semibold after:float-right after:content-['+'] group-open:after:content-['−']">{spec.specificationName}</summary><p className="pt-3 text-sm leading-6 text-zinc-600">{spec.specificationValue}</p></details>)}</div>
  </>;
}

export function MobileProductActions({ slug }: { slug: string }) {
  return <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 p-2 pr-28 shadow-[0_-8px_30px_rgba(0,0,0,.1)] backdrop-blur md:hidden"><div className="flex gap-2"><Link href={`/request-a-quote?product=${slug}`} className="btn-primary min-h-11 grow px-3 text-[.7rem]">Request Quote</Link><Link href="/catalog" aria-label="Download catalog" className="grid h-11 w-11 shrink-0 place-items-center border border-zinc-300"><Download size={16} /></Link></div></div>;
}