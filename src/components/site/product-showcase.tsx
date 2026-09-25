"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { SmartImage } from "./smart-image";
import { optimizeImage } from "@/lib/image-utils";

type ShowcaseImage = { id: number | string; imageUrl: string; altText: string; caption: string | null };

export function ProductShowcase({ images }: { images: ShowcaseImage[] }) {
  const [active, setActive] = useState<number | null>(null);
  const count = images.length;
  const prev = useCallback(() => setActive((v) => (v === null ? v : (v - 1 + count) % count)), [count]);
  const next = useCallback(() => setActive((v) => (v === null ? v : (v + 1) % count)), [count]);
  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, prev, next]);
  if (!count) return null;
  const current = active === null ? null : images[active];
  return (
    <div>
      <div className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:auto-rows-[220px] ${count >= 2 ? "md:grid-rows-2" : ""}`}>
        {images.map((image, i) => (
          <button
            type="button"
            key={image.id}
            onClick={() => setActive(i)}
            aria-label={`View ${image.altText} enlarged`}
            className={`group relative overflow-hidden rounded-xl bg-zinc-200 text-left ${
              count === 1 ? "col-span-2 aspect-[16/9] md:col-span-4 md:aspect-auto md:row-span-2" : i === 0 ? "col-span-2 aspect-[16/9] md:col-span-2 md:aspect-auto md:row-span-2" : "aspect-[4/3] md:aspect-auto"
            }`}
          >
            <SmartImage src={optimizeImage(image.imageUrl, 900)} alt={image.altText} fill className="object-cover object-center transition duration-700 group-hover:scale-[1.02]" sizes={count === 1 ? "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 100vw" : i === 0 ? "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 50vw" : "(max-width: 767px) 50vw, 25vw"} />
            <div className="absolute inset-0 bg-zinc-950/0 transition-colors duration-500 group-hover:bg-zinc-950/30" />
            <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-zinc-900 opacity-0 transition-opacity duration-500 group-hover:opacity-100"><Maximize2 size={15} /></span>
            {image.caption ? <span className="absolute inset-x-0 bottom-0 bg-black/60 p-3 text-xs text-white">{image.caption}</span> : null}
          </button>
        ))}
      </div>
      {active !== null && current ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/95 p-4" role="dialog" aria-modal="true" aria-label={`${current.altText} fullscreen`} onClick={() => setActive(null)}>
          <button type="button" onClick={() => setActive(null)} className="absolute right-5 top-5 grid h-11 w-11 place-items-center text-white" aria-label="Close fullscreen image"><X size={28} /></button>
          {count > 1 ? (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous image" className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/25 text-white hover:bg-white/10"><ChevronLeft size={22} /></button>
              <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next image" className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/25 text-white hover:bg-white/10"><ChevronRight size={22} /></button>
            </>
          ) : null}
          <div className="relative h-[86vh] w-full max-w-7xl" onClick={(event) => event.stopPropagation()}>
            <SmartImage src={optimizeImage(current.imageUrl, 2000)} alt={current.altText} fill className="object-cover object-center" sizes="100vw" />
          </div>
          <span className="absolute bottom-4 text-xs font-bold uppercase tracking-[.2em] text-white/60">{active + 1} / {count}</span>
        </div>
      ) : null}
    </div>
  );
}