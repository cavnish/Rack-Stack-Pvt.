"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";

import { SmartImage } from "./smart-image";

/* Centre column: the India coverage map is the single main visual, with a small label
   beneath it. The PNG is never edited, cropped, stretched or filtered — it is blended
   with `lighten` so its near-black baked backdrop resolves to the section's #071C27 while
   every map colour, highlight and glow above that backdrop is kept exactly as authored
   (screen would wash the mid-tones out). The wrapper stays transparent with no border,
   radius, panel or shadow, and deliberately carries no transform/opacity animation of its
   own so it cannot become a stacking context and isolate the blend from the section. */
export function IndiaNetworkVisual() {
  const host = useRef<HTMLDivElement>(null);
  const inView = useInView(host, { once: true, amount: 0.3 });

  return (
    <div
      ref={host}
      data-inview={inView ? "" : undefined}
      className="india-reveal-host relative flex h-full w-full flex-col items-center justify-center"
    >
      <SmartImage
        src="/INDIA.png"
        alt="Map of India showing pan-India supply and installation coverage"
        width={1536}
        height={1024}
        priority
        className="india-map relative z-10 h-auto w-[240px] max-w-full mix-blend-lighten min-[420px]:w-[260px] sm:w-[290px] lg:w-[330px] xl:w-[360px] 2xl:w-[375px]"
      />

      <p className="india-label relative z-10 mt-4 max-w-full rounded-full border border-[#FF6B1A]/25 bg-[#FF6B1A]/[0.07] px-3.5 py-1.5 text-center text-[0.55rem] font-bold uppercase leading-tight tracking-[0.15em] text-white/80 backdrop-blur-md sm:text-[0.6rem] sm:tracking-[0.16em]">
        Pan-India Supply &amp; Installation
      </p>
    </div>
  );
}
