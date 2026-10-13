"use client";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, Check, Download } from "lucide-react";
import { SmartImage } from "./smart-image";
import { useFitHeading } from "./use-fit-heading";
import { useInView } from "./use-in-view";
import type { products, services } from "@/db/schema";

/**
 * The shared section header.
 *
 * `size` selects the heading scale. It defaults to the site's main section
 * scale so existing call sites are unchanged; `sm` is for dense bands that sit
 * between taller neighbours and would otherwise out-shout them.
 *
 * `singleLine` asks for the heading to hold one line wherever the viewport has
 * room, by shrinking the type until it fits rather than wrapping it. It defaults
 * to on because this is the site's major section heading and the requirement is
 * site-wide, and because a single shared switch is what keeps thirty-one call
 * sites consistent instead of drifting apart one edit at a time. It is safe for
 * long editorial titles: the floor in `useFitHeading` stops the shrink, and a
 * title that would need to go below the floor falls back to wrapping at its
 * normal size. Pass `singleLine={false}` to opt a heading out deliberately.
 */
export function SectionHeading({ eyebrow, title, description, light = false, align = "left", compact = false, size, singleLine = true }: { eyebrow?: string; title: string; description?: string | null; light?: boolean; align?: "left" | "center"; compact?: boolean; size?: "sm"; singleLine?: boolean }) {
  const scale = size === "sm" ? "sm" : compact ? "md" : "lg";
  const headingClass = scale === "sm" ? "heading-sm" : scale === "md" ? "heading-md" : "section-heading";
  const descriptionClass = scale === "sm" ? "section-description-sm" : "section-description";
  const gap = scale === "sm" ? "mt-3.5" : "mt-5";
  const headingRef = useFitHeading<HTMLHeadingElement>(singleLine ? 20 : 0);
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "0px 0px -60px 0px" });
  return (
    <div
      ref={ref}
      className={`stagger min-w-0 ${align === "center" ? "mx-auto text-center" : ""} ${inView ? "is-visible" : ""}`}
      style={{ "--stagger-delay": ".06s", "--stagger-step": ".09s" } as CSSProperties}
    >
      {eyebrow ? <p className={`eyebrow ${align === "center" ? "text-center" : ""}`}>{eyebrow}</p> : null}
      <h2
        ref={headingRef}
        className={`${eyebrow ? gap : ""} text-balance ${headingClass} ${singleLine ? "fit-heading" : ""} ${
          light ? "text-white" : compact ? "text-zinc-900" : "text-zinc-950"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className={`${descriptionClass} ${gap} ${align === "center" ? "mx-auto text-center" : ""} ${light ? "text-zinc-400" : "text-zinc-600"}`}>
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * The site hero — compact band shared by the About, Contact, Projects, Services
 * and Products pages.
 *
 * A short vertical band rather than a full-screen banner: 240–340px depending on
 * the viewport, growing only when the copy itself is taller. One shared scale
 * (`.page-hero`) keeps all five pages at the same height, heading size, spacing
 * and scrim so the top of every section page reads identically, while the
 * homepage keeps its own full-screen carousel hero.
 *
 * It used to take a `breadcrumb` trail. That is gone: a visible trail above a
 * page title only restates the URL bar, and `BreadcrumbList` structured data is
 * emitted only on the product detail routes (see `product-page-view.tsx`),
 * which is where a genuine multi-level hierarchy exists.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageClassName,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string | null;
  image?: string | null;
  /** Extra classes for the image wrapper (e.g. the About page's load-in scale). */
  imageClassName?: string;
  /** Optional south row of CTA buttons, right-aligned with the copy. */
  actions?: ReactNode;
}) {
  return (
    <section className="page-hero relative isolate flex overflow-hidden bg-zinc-950 text-white">
      <div className={`absolute inset-0 -z-20 ${imageClassName ?? ""}`}>{image && <SmartImage src={image} alt="" fill priority className="object-cover object-center opacity-45" sizes="100vw" />}</div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(9,9,11,.88)_0%,rgba(9,9,11,.6)_52%,rgba(9,9,11,.22)_100%)]" />
      <div className="container-shell flex w-full flex-col justify-center py-12 sm:py-14">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="eyebrow hero-enter text-red-400">{eyebrow}</p>
          ) : null}
          <h1 className={`hero-heading hero-enter ${eyebrow ? "mt-4" : ""} text-balance`}>{title}</h1>
          {description && (
            <p className="hero-description hero-enter hero-enter-late mt-4 text-zinc-300">{description}</p>
          )}
          {actions ? (
            <div className="hero-enter hero-enter-later mt-7 flex flex-wrap items-center gap-3">{actions}</div>
          ) : null}
        </div>
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
  const { ref, inView } = useInView<HTMLElement>({ rootMargin: "0px 0px -60px 0px" });
  return (
    <section ref={ref} className="dark-grid bg-zinc-950 py-20 text-white">
      <div className="container-shell flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
        <div
          className={`stagger max-w-3xl ${inView ? "is-visible" : ""}`}
          style={{ "--stagger-delay": ".1s", "--stagger-step": ".08s" } as CSSProperties}
        >
          <p className="eyebrow text-red-400">Start a Conversation</p>
          <h2 className="section-heading mt-5 text-balance">{title}</h2>
          <p className="section-description mt-5 text-zinc-400">{description}</p>
        </div>
        <div
          className={`reveal flex shrink-0 flex-wrap gap-3 ${inView ? "is-visible" : ""}`}
          style={{ "--reveal-delay": ".35s" } as CSSProperties}
        >
          <Link href={product ? `/request-a-quote?product=${encodeURIComponent(product)}` : "/request-a-quote"} className="btn-primary">
            Request a Quote <ArrowRight size={17} />
          </Link>
          <Link href="/rack-and-stack-brochure.pdf" download className="btn-light">
            <Download size={16} />
            Catalog
          </Link>
        </div>
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