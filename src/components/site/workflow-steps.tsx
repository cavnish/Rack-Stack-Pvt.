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

export function WorkflowSteps() {
  return (
    <motion.ol
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="relative mt-16 grid gap-8 md:grid-cols-6"
    >
      <div className="absolute left-[10%] right-[10%] top-6 hidden border-t border-dashed border-white/20 md:block" aria-hidden />
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <motion.li key={step.title} variants={item} className="relative">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-zinc-900 text-white md:m-0">
              <Icon size={20} />
            </span>
            <span className="md:mt-3 text-xs font-bold text-zinc-500">0{i + 1}</span>
            <h3 className="mt-2 text-base font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{step.description}</p>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}