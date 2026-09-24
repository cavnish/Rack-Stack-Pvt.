"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronRight, Download } from "lucide-react";
import { SmartImage } from "./smart-image";
import type { products, services } from "@/db/schema";

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};
const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.06 } },
};

export function SectionHeading({ eyebrow, title, description, light = false, align = "left", compact = false }: { eyebrow?: string; title: string; description?: string | null; light?: boolean; align?: "left" | "center"; compact?: boolean }) {
  const reduced = useReducedMotion();
  const anim = !reduced;
  return (
    <motion.div
      className={`${align === "center" ? "mx-auto text-center" : ""}`}
      initial={anim ? "hidden" : false}
      whileInView={anim ? "show" : undefined}
      viewport={{ once: true, margin: "-60px" }}
      variants={staggerParent}
    >
      {eyebrow ? (
        <motion.p variants={anim ? fadeUp : undefined} className={`eyebrow ${align === "center" ? "justify-center before:hidden" : ""}`}>
          {eyebrow}
        </motion.p>
      ) : null}
      <motion.h2
        variants={anim ? fadeUp : undefined}
        className={`mt-5 text-balance ${compact ? "heading-md" : "section-heading"} ${
          light ? "text-white" : compact ? "text-zinc-900" : "text-zinc-950"
        }`}
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          variants={anim ? fadeUp : undefined}
          className={`section-description mt-5 ${align === "center" ? "mx-auto text-center" : ""} ${light ? "text-zinc-400" : "text-zinc-600"}`}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}

export function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[.7rem] font-bold uppercase tracking-[.1em] text-zinc-500">
      <Link href="/">Home</Link>
      {items.map((item, i) => (
        <span className="flex items-center gap-2" key={`${item.label}-${i}`}>
          <ChevronRight size={12} />
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span className="text-zinc-300">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function PageHero({ eyebrow, title, description, image, breadcrumb }: { eyebrow: string; title: string; description?: string | null; image?: string | null; breadcrumb?: Array<{ label: string; href?: string }> }) {
  const reduced = useReducedMotion();
  const anim = !reduced;
  return (
    <section className="relative isolate min-h-[460px] overflow-hidden bg-zinc-950 text-white">
      <div className="absolute inset-0 -z-20">{image && <SmartImage src={image} alt="" fill priority className="object-cover opacity-40" sizes="100vw" />}</div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/25" />
      <div className="container-shell flex min-h-[460px] flex-col justify-end py-16">
        <motion.div
          className="max-w-4xl"
          initial={anim ? { opacity: 0 } : false}
          animate={anim ? { opacity: 1 } : undefined}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {breadcrumb && (
            <motion.div
              initial={anim ? { opacity: 0, y: 16 } : false}
              animate={anim ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
            >
              <Breadcrumb items={breadcrumb} />
            </motion.div>
          )}
          <motion.p
            initial={anim ? { opacity: 0, y: 16 } : false}
            animate={anim ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
            className="eyebrow mt-8 text-red-400"
          >
            {eyebrow}
          </motion.p>
          <motion.h1
            initial={anim ? { opacity: 0, y: 20 } : false}
            animate={anim ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
            className="hero-heading mt-5 text-balance"
          >
            {title}
          </motion.h1>
          {description && (
            <motion.p
              initial={anim ? { opacity: 0, y: 20 } : false}
              animate={anim ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.6, delay: 0.42, ease: EASE }}
              className="hero-description mt-5 text-zinc-300"
            >
              {description}
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

type Service = typeof services.$inferSelect;
export { ProductCard } from "./product-card";

export function ServiceCard({ service, index = 0 }: { service: Service; index?: number }) {
  return (
    <Link href={`/services/${service.slug}`} className="group border-t border-zinc-300 py-7 transition-colors hover:bg-zinc-950 hover:px-6 hover:text-white">
      <div className="flex items-start gap-5">
        <span className="mt-1 text-xs font-bold text-red-600">{String(index + 1).padStart(2, "0")}</span>
        <div className="grow">
          <h3 className="card-title">{service.name}</h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-600 group-hover:text-zinc-400">{service.shortDescription}</p>
        </div>
        <ArrowRight className="mt-1 shrink-0 transition-transform group-hover:translate-x-1" size={19} />
      </div>
    </Link>
  );
}

export function CTASection({ title, description = "Tell us about your space and storage needs. We'll help you decide the next step.", product }: { title: string; description?: string; product?: string }) {
  const reduced = useReducedMotion();
  const anim = !reduced;
  const viewport = { once: true, margin: "-60px" };
  return (
    <section className="dark-grid bg-zinc-950 py-20 text-white">
      <div className="container-shell flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
        <motion.div
          className="max-w-3xl"
          initial={anim ? { opacity: 0, y: 24 } : false}
          whileInView={anim ? { opacity: 1, y: 0 } : undefined}
          viewport={viewport}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <motion.p
            initial={anim ? { opacity: 0 } : false}
            whileInView={anim ? { opacity: 1, y: 0 } : undefined}
            viewport={viewport}
            transition={{ delay: 0.1 }}
            className="eyebrow text-red-400"
          >
            Start a Conversation
          </motion.p>
          <motion.h2
            initial={anim ? { opacity: 0, y: 18 } : false}
            whileInView={anim ? { opacity: 1, y: 0 } : undefined}
            viewport={viewport}
            transition={{ delay: 0.18, duration: 0.6, ease: EASE }}
            className="section-heading mt-5 text-balance"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={anim ? { opacity: 0, y: 18 } : false}
            whileInView={anim ? { opacity: 1, y: 0 } : undefined}
            viewport={viewport}
            transition={{ delay: 0.28, duration: 0.6, ease: EASE }}
            className="section-description mt-5 text-zinc-400"
          >
            {description}
          </motion.p>
        </motion.div>
        <motion.div
          className="flex shrink-0 flex-wrap gap-3"
          initial={anim ? { opacity: 0, y: 18 } : false}
          whileInView={anim ? { opacity: 1, y: 0 } : undefined}
          viewport={viewport}
          transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
        >
          <Link href={product ? `/request-a-quote?product=${encodeURIComponent(product)}` : "/request-a-quote"} className="btn-primary">
            Request a Quote <ArrowRight size={17} />
          </Link>
          <Link href="/catalog" className="btn-light">
            <Download size={16} />
            Catalog
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export function BenefitsList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 border border-zinc-200 p-4 text-sm">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center bg-red-600 text-white">
            <Check size={12} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">{description}</p>
    </div>
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}