"use client";
import { motion } from "framer-motion";
import { ClipboardCheck, FileBarChart2, DraftingCompass, Cog, Wrench, PartyPopper } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STEPS: Array<{ icon: LucideIcon; title: string; description: string }> = [
  { icon: ClipboardCheck, title: "Requirement Assessment", description: "We discuss your space, item sizes, loads and handling method to understand exactly what you need." },
  { icon: FileBarChart2, title: "Storage Planning", description: "We prepare a bay-by-bay plan that fits your building, stock flow and budget." },
  { icon: DraftingCompass, title: "Engineering & Design", description: "Load calculations and drawings confirm sizes, bracing and fixings before we start building." },
  { icon: Cog, title: "Manufacturing", description: "Parts are made from the approved design with careful bending, welding and finishing." },
  { icon: Wrench, title: "Installation", description: "Our team sets up, aligns and levels the system on site to match the agreed layout." },
  { icon: PartyPopper, title: "Final Handover", description: "We check every bay, walk you through the finished installation and hand over the documents." },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16 } },
};
const item = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

/**
 * The six-step delivery process.
 *
 * One row of six on desktop, three on a laptop, two on a small tablet and a
 * single-column vertical timeline on a phone. The connector follows: a dashed
 * rule across the six-up row, a vertical rule down the timeline, nothing in
 * between, because a line that has to bend through a two- or three-column grid
 * reads as a mistake rather than a connection.
 *
 * Every step keeps its icon, number, title and description — only the box model
 * changed, so the row is roughly a third shorter than it was.
 */
export function WorkflowSteps() {
  return (
    <motion.ol
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="relative mt-8 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 sm:gap-y-6 lg:grid-cols-3 lg:gap-x-5 xl:grid-cols-6 xl:gap-x-3"
    >
      {/* Desktop: dashed rule through the icon centres, 8% in from each end. */}
      <div className="absolute left-[8%] right-[8%] top-[18px] hidden border-t border-dashed border-white/20 xl:block" aria-hidden />
      {/* Mobile: the same connector, turned vertical and pinned to the icon column. */}
      <div className="absolute bottom-6 left-[18px] top-6 w-px bg-white/15 sm:hidden" aria-hidden />

      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <motion.li key={step.title} variants={item} className="relative flex gap-3.5 xl:block xl:text-center">
            {/* Opaque background so the connectors pass behind the icons cleanly. */}
            <span className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-zinc-900 text-white xl:mx-auto">
              <Icon size={17} />
            </span>

            <div className="min-w-0 xl:mt-2.5">
              <span className="block font-mono text-[.65rem] font-bold tracking-wider text-zinc-500">0{i + 1}</span>
<h3 className="mt-0.5 text-sm font-semibold leading-snug text-white xl:mt-1">{step.title}</h3>
<p className="mt-0.5 text-[.78rem] leading-5 text-zinc-400 xl:mt-1 xl:text-balance">{step.description}</p>
            </div>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
