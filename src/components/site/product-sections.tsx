import Link from "next/link";
import {
  ArrowRight,
  ArrowUpDown,
  Boxes,
  Car,
  CheckCircle2,
  Container,
  Factory,
  HardHat,
  Headphones,
  Layers,
  LayoutGrid,
  Lock,
  LucideIcon,
  Package,
  Ruler,
  Settings2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  Warehouse,
  Wrench,
  Zap,
} from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";
import { ProductGallery } from "@/components/site/product-experience";
import { ProductShowcase } from "@/components/site/product-showcase";
import { FAQ } from "@/components/site/faq";
import { ProductCard, type ProductCardProduct } from "@/components/site/product-card";
import { FitHeading } from "@/components/site/fit-heading";
import { InquiryForm } from "@/components/site/inquiry-form";
import { SectionHeading } from "@/components/site/ui";
import { MobileProductActions } from "@/components/site/product-experience";
import { getRelatedProductImages } from "@/lib/product-primary-images";
import { EventTracker } from "@/components/site/event-tracker";
import { Reveal } from "@/components/site/reveal";
import { WorkflowSteps } from "@/components/site/workflow-steps";
import { TrustedByStrip } from "@/components/site/trusted-by-strip";
import { ReelShowcase } from "@/components/media/reel-showcase";
import { optimizeImage } from "@/lib/image-utils";
import { localAssetFor } from "@/lib/local-assets";
import type { ClientLogo } from "@/lib/data";
import type { getServices } from "@/lib/data";
import type { ReelVideoItem } from "@/lib/reel-video";
import { getDatabaseProductHref } from "@/lib/product-page";
import type { ProductOption, ProductPageProduct } from "@/lib/product-page";

export type ProductDetail = ProductPageProduct;

const KEYWORD_ICONS: Array<[RegExp, LucideIcon]> = [
  [/load|weight|capacity/, ShoppingBag],
  [/adjust|level|height|pitch/, ArrowUpDown],
  [/versatil|flexib|solution|multi/, LayoutGrid],
  [/space|floor|footprint|height|optimiz/, Layers],
  [/bolt|quick|assembl|fast|erect/, Wrench],
  [/steel|durab|construct|rugged|tough|corros/, ShieldCheck],
  [/truck|transport|logistic|dispatch|distribution/, Truck],
  [/warehouse|store|stor|racket/, Warehouse],
  [/cabl|wire|roll|box|bin|carton/, Boxes],
  [/factory|manufactur|metal|fabricat/, Factory],
  [/secur|lock|theft/, Lock],
  [/spee|efficien|flow/, Zap],
  [/build|install/, HardHat],
  [/car|automotive|vehicle|auto/, Car],
  [/food|cold|frozen|chill/, Container],
  [/packag|retail|e-?commerce|pick/, Package],
  [/system|configur|specif|dimension|ruler/, Ruler],
  [/settings|option|accessor/, Settings2],
];

function iconFor(name?: string | null): LucideIcon {
  const n = (name ?? "").toLowerCase();
  for (const [re, icon] of KEYWORD_ICONS) if (re.test(n)) return icon;
  return ShieldCheck;
}

export function getProductCuratedImages(product: ProductDetail) {
  const defaultSlots = [
    { label: "Warehouse Installation", alt: `Warehouse installation of ${product.name}`, url: "https://images.pexels.com/photos/1797415/pexels-photo-1797415.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" },
    { label: "Close-Up View", alt: `Close-up view of ${product.name}`, url: "https://images.pexels.com/photos/36126305/pexels-photo-36126305.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" },
    { label: "Many Configurations", alt: `Multiple configurations of ${product.name}`, url: "https://images.pexels.com/photos/4170172/pexels-photo-4170172.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" },
    { label: "Heavy Load Storage", alt: `Heavy load storage using ${product.name}`, url: "https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" },
    { label: "Organized Storage", alt: `Organized warehouse storage with ${product.name}`, url: "https://images.pexels.com/photos/36126272/pexels-photo-36126272.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" },
    { label: "In Operation", alt: `${product.name} in operation inside warehouse`, url: "https://images.pexels.com/photos/4487363/pexels-photo-4487363.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" },
  ];

  return defaultSlots.map((slot, idx) => {
    if (product.images[idx]?.imageUrl.trim()) {
      return {
        id: product.images[idx].id,
        imageUrl: product.images[idx].imageUrl,
        altText: product.images[idx].altText || slot.alt,
        caption: slot.label,
        label: slot.label,
      };
    }
    if (idx === 0 && (product.heroImage || product.thumbnail)) {
      return {
        id: -1,
        imageUrl: product.heroImage || product.thumbnail || slot.url,
        altText: `${product.name} overview`,
        caption: slot.label,
        label: slot.label,
      };
    }
    return {
      id: 1000 + idx,
      imageUrl: localAssetFor(slot.url, "products") ?? slot.url,
      altText: slot.alt,
      caption: slot.label,
      label: slot.label,
    };
  });
}

export function getProductKeyFeatures(product: ProductDetail) {
  const defaultFeatures = [
    {
      title: "Holds Heavy Loads",
      description: "Each shelf holds 300–1000 kg — great for heavy cartons, tools, spare parts and bulk goods.",
      icon: ShoppingBag,
    },
    {
      title: "Adjustable Shelves",
      description: "Move shelves in small steps to fit products of different sizes.",
      icon: ArrowUpDown,
    },
    {
      title: "Works Anywhere",
      description: "Suits warehouses, retail stores, workshops and distribution centers. Stores cartons, archives, tools and bulk goods.",
      icon: LayoutGrid,
    },
    {
      title: "Saves Space",
      description: "Uses vertical space well while keeping everything easy to reach by hand.",
      icon: Layers,
    },
    {
      title: "Quick Assembly",
      description: "No bolts needed — fast to install, easy to expand and simple to rearrange.",
      icon: Wrench,
    },
    {
      title: "Strong Steel Build",
      description: "Quality steel with a tough powder-coated finish for long life and low maintenance.",
      icon: ShieldCheck,
    },
  ];

  if (product.features && product.features.length >= 6) {
    return product.features.slice(0, 6).map((f) => ({
      title: f.title,
      description: f.description || "",
      icon: iconFor(f.title),
    }));
  }

  const existing = (product.features || []).map((f) => ({
    title: f.title,
    description: f.description || "",
    icon: iconFor(f.title),
  }));

  const existingTitles = new Set(existing.map((e) => e.title.toLowerCase()));
  const fillers = defaultFeatures.filter((d) => !existingTitles.has(d.title.toLowerCase()));

  return [...existing, ...fillers].slice(0, 6);
}

export function ProductHero({ product }: { product: ProductDetail }) {
  const heroTitle = product.heroTitle || product.name;
  const heroDescription = product.heroDescription || product.shortDescription;
  const longDescription = product.longDescription || product.description;
  const curatedImages = getProductCuratedImages(product);

  const defaultParagraph = `Rack & Stack Storage Systems is a trusted manufacturer and supplier of ${product.name} in India. These heavy-duty racks store bins, cartons, loose items and bulk materials safely and efficiently. Built for strength, durability and easy use, they suit warehouses, workshops and distribution centers of all sizes. We deliver quality storage that helps businesses stay organized and run smoothly.`;

  const isMezzanine = /mezz/i.test(product.slug) || /mezz/i.test(product.name);
  const isPallet = /pallet/i.test(product.slug) || /pallet/i.test(product.name);

  let upsellTitle = "Need Denser Hand-Picked Storage?";
  let upsellText = "Our";
  let upsellLinkText = "mezzanine floor";
  let upsellHref = getDatabaseProductHref("mezzanine-floor");
  let upsellSuffix = "can add a second storage level above your shelving.";

  if (isMezzanine) {
    upsellTitle = "Need Pallet Storage Too?";
    upsellLinkText = "heavy duty pallet racking";
    upsellHref = getDatabaseProductHref("heavy-duty-pallet-racking");
    upsellSuffix = "connects directly to your mezzanine platform.";
  } else if (isPallet) {
    upsellTitle = "Need More Storage Levels?";
    upsellLinkText = "mezzanine floor";
    upsellHref = getDatabaseProductHref("mezzanine-floor");
    upsellSuffix = "turns empty warehouse height into extra picking levels.";
  } else if (product.related.length > 0) {
    const rec = product.related[0];
    upsellTitle = "Need More Storage Space?";
    upsellLinkText = rec.name.toLowerCase();
    upsellHref = rec.href;
    upsellSuffix = "can work alongside this system to improve your full floor layout.";
  }

  return (
    <section className="border-b border-zinc-200 bg-white">
      <div className="container-shell grid gap-10 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-14 items-start">
        {/* Left Column: Interactive 6-Image Product Gallery */}
        <div>
          <ProductGallery images={curatedImages} productTitle={product.name} />
        </div>

        {/* Right Column: Product Information & Action Panel */}
        <div className="flex flex-col justify-center">
          {product.status !== "PUBLISHED" ? (
            <span className="w-fit bg-amber-300 px-3 py-1 text-xs font-bold text-black rounded">Draft preview</span>
          ) : null}

          {/* Product Title */}
          <h1 className="section-heading text-balance text-zinc-900">
            {heroTitle}
          </h1>

          {/* Highlight Subtitle */}
          {heroDescription ? (
            <p className="hero-description mt-5 text-zinc-700">
              {heroDescription}
            </p>
          ) : null}

          {/* Detailed Description Paragraph */}
          <p className="mt-4 text-sm sm:text-[0.95rem] leading-relaxed text-zinc-600">
            {longDescription || defaultParagraph}
          </p>

          {/* Upsell / Recommendation Box */}
          <div className="mt-6 flex items-start gap-4 rounded-xl border border-zinc-200 bg-[#f8fafc] p-4 sm:p-4.5">
            <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-red-100 bg-red-50 text-[#d11f2f]">
              <Layers size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-bold text-zinc-900">{upsellTitle}</p>
              <p className="mt-1 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {upsellText}{" "}
                <Link
                  href={upsellHref}
                  className="font-semibold text-[#d11f2f] hover:underline underline-offset-2 transition-colors"
                >
                  {upsellLinkText}
                </Link>{" "}
                {upsellSuffix}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-7 flex flex-wrap items-center gap-3.5">
            <Link
              href={`/request-a-quote?product=${encodeURIComponent(product.slug)}`}
              className="btn-primary !rounded-xl !px-6 !py-3.5 font-bold shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              Get a Quote <ArrowRight size={17} />
            </Link>
            <Link
              href="/contact"
              className="btn-secondary !rounded-xl !px-5 !py-3.5 font-bold !border-zinc-300 hover:!border-zinc-900 bg-white flex items-center gap-2 text-zinc-800 transition-all"
            >
              <Headphones size={17} className="text-[#d11f2f]" />
              Talk to Our Team
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection({
  items,
  product,
}: {
  items: ProductDetail["features"];
  product?: ProductDetail;
}) {
  const featureList = product ? getProductKeyFeatures(product) : (items.length ? items.slice(0, 6).map(item => ({
    title: item.title,
    description: item.description || "",
    icon: iconFor(item.title)
  })) : []);

  const showcasePhotos = product ? getProductCuratedImages(product) : [];

  if (!featureList.length) return null;

  return (
    <section className="border-y border-zinc-200 bg-[#f8fafc] py-16 lg:py-20">
      <div className="container-shell">
        {/* Header */}
        <div className="text-center">
          <FitHeading className="section-heading text-balance">
            Built to Make Storage Easier
          </FitHeading>
        </div>

        {/* 6 Key Feature Cards Grid */}
        <div className="mt-10 sm:mt-12 grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureList.map((item, index) => {
            const Icon = item.icon || iconFor(item.title);
            return (
              <Reveal key={`${item.title}-${index}`} delay={Math.min(index * 0.05, 0.25)}>
                <article className="flex h-full items-start gap-4 rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-zinc-300 hover:shadow-lg">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-red-100 bg-red-50 text-[#d11f2f]">
                    <Icon size={22} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900">{item.title}</h3>
                    {item.description && (
                      <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-zinc-500">
                        {item.description}
                      </p>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* 6 Visual Showcase Photo Cards directly below feature cards */}
        {showcasePhotos.length > 0 ? (
          <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {showcasePhotos.map((photo, i) => (
              <div
                key={`${photo.label}-${i}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm"
              >
                <SmartImage
                  src={optimizeImage(photo.imageUrl, 600)}
                  alt={photo.altText || photo.label}
                  fill
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                   sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 16vw"

                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <span className="absolute bottom-2.5 left-2.5 right-2.5 text-xs font-semibold text-white drop-shadow">
                  {photo.label}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ProductShowcaseSection({ product }: { product: ProductDetail }) {
  const showcaseImages = product.images.filter((image) => image.imageUrl.trim().length > 0);
  if (!showcaseImages.length) return null;
  return (
    <section className="py-24">
      <div className="container-shell">
        <SectionHeading eyebrow="Product photos" title="See the System Up Close" description="See the system installed, loaded and in detail." align="center" />
        <div className="mt-12">
          <ProductShowcase images={showcaseImages} />
        </div>
      </div>
    </section>
  );
}

export function OverviewSection({ product }: { product: ProductDetail }) {
  const body = product.longDescription || product.description;
  if (!body) return null;
  const overviewImage = product.thumbnail || product.images[0]?.imageUrl;
  return (
    <section className="py-24">
      <div className="container-shell grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <FitHeading className="section-heading text-balance">Built for Efficient Storage</FitHeading>
          <p className="section-description mt-5 text-zinc-700">{body}</p>
          <p className="mt-6 flex items-start gap-3 text-sm leading-7 text-zinc-500"><Ruler size={17} className="mt-0.5 shrink-0 text-red-600" />Final sizes, loads and engineering are confirmed against your layout and project proposal.</p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-200">
          {overviewImage ? <SmartImage src={optimizeImage(overviewImage, 1300)} alt={product.name} fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 50vw" /> : <div className="absolute inset-0 grid place-items-center bg-zinc-900 text-zinc-600"><Layers size={50} /></div>}
        </div>
      </div>
    </section>
  );
}

export function TechnicalSpecificationsSection({ product }: { product: ProductDetail }) {
  if (!product.specifications.length) return null;
  const productImage = product.heroImage || product.thumbnail || product.images[0]?.imageUrl || "";
  return (
    <section id="specifications" className="border-y border-zinc-200 bg-white py-14 lg:py-20">
      <div className="container-shell">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <FitHeading className="section-heading">
              Specifications at a Glance
            </FitHeading>
          </div>
          <p className="max-w-xs text-sm leading-6 text-zinc-500 sm:text-right">
            Guide values. Final numbers are confirmed in your project proposal.
          </p>
        </div>

        {/* Two-column body: image left, specs right */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-10 items-stretch">
          {/* Left: product image */}
          <div className="relative min-h-[260px] overflow-hidden rounded-2xl bg-zinc-100 sm:min-h-[360px] lg:min-h-0">
            {productImage ? (
              <SmartImage
                src={optimizeImage(productImage, 900)}
                alt={product.name}
                fill
                className="object-cover object-center"
                 sizes="(max-width: 1023px) 100vw, 42vw"

              />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-zinc-100 text-zinc-300">
                <Ruler size={56} />
              </div>
            )}
            {/* Overlay badge */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/30 to-transparent p-5">
              <p className="text-[.6rem] font-bold uppercase tracking-[.18em] text-red-400">Rack &amp; Stack</p>
              <p className="mt-0.5 text-base font-bold text-white">{product.name}</p>
              {product.category && (
                <span className="mt-2 inline-block rounded bg-[#d11f2f] px-2 py-0.5 text-[.6rem] font-bold uppercase tracking-[.12em] text-white">
                  {product.category}
                </span>
              )}
            </div>
          </div>

          {/* Right: specifications table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
            {/* Desktop striped rows */}
            <div className="hidden sm:block">
              {product.specifications.map((spec, i) => (
                <div
                  key={spec.id}
                  className={`grid grid-cols-[1fr_1.2fr] gap-4 px-6 py-4 text-sm ${
                    i % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"
                  } ${i < product.specifications.length - 1 ? "border-b border-zinc-100" : ""}`}
                >
                  <span className="font-semibold text-zinc-800">{spec.specificationName}</span>
                  <span className="text-zinc-600">{spec.specificationValue}</span>
                </div>
              ))}
            </div>
            {/* Mobile accordion */}
            <div className="divide-y divide-zinc-100 sm:hidden">
              {product.specifications.map((spec) => (
                <details key={spec.id} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-800 after:float-right after:content-['+'] group-open:after:content-['−']">
                    {spec.specificationName}
                  </summary>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{spec.specificationValue}</p>
                </details>
              ))}
            </div>
            {/* Footer note */}
            <div className="border-t border-zinc-100 bg-[#f8fafc] px-6 py-3">
              <p className="text-[.7rem] text-zinc-400">
                Guide values only. Final specification is confirmed in your project proposal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Application image fallbacks by keyword, resolved to local copies when the
// asset sync has cached them (see scripts/sync-assets.ts).
const APPLICATION_IMAGES: Array<[RegExp, string]> = [
  [/warehouse|storage|distribution|logistic/, "https://images.pexels.com/photos/1797415/pexels-photo-1797415.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900"],
  [/manufactur|factory|industrial|plant|production/, "https://images.pexels.com/photos/236705/pexels-photo-236705.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900"],
  [/retail|shop|store|supermarket|showroom/, "https://images.pexels.com/photos/1005638/pexels-photo-1005638.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900"],
  [/pharma|hospital|medical|lab|health/, "https://images.pexels.com/photos/35285858/pexels-photo-35285858.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900"],
  [/cold|chill|frozen|food|beverage/, "https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900"],
  [/ecommerce|e-commerce|fulfilment|fulfillment|pick/, "https://images.pexels.com/photos/4393426/pexels-photo-4393426.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900"],
  [/auto|car|vehicle|automotive|garage/, "https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900"],
  [/office|archive|record|document|file/, "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900"],
  [/garment|cloth|textile|apparel|fashion/, "https://images.pexels.com/photos/5632376/pexels-photo-5632376.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900"],
  [/education|school|library|college|univers/, "https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900"],
  [/tool|hardware|spare|part|machine|workshop/, "https://images.pexels.com/photos/4489749/pexels-photo-4489749.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900"],
];

const APPLICATION_IMAGE_FALLBACK =
  "https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900";

function appImageFor(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  for (const [re, url] of APPLICATION_IMAGES) {
    if (!re.test(text)) continue;
    return localAssetFor(url, "applications") ?? url;
  }
  return localAssetFor(APPLICATION_IMAGE_FALLBACK, "applications") ?? APPLICATION_IMAGE_FALLBACK;
}

export function ApplicationsSection({ items, product }: { items: ProductDetail["applications"]; product?: ProductDetail }) {
  if (!items.length && !product?.industries.length) return null;
  return (
    <section className="bg-[#f4f4f1] border-y border-zinc-200 py-16 lg:py-20">
      <div className="container-shell">
        <div className="text-center">
          <FitHeading className="section-heading text-balance">
            Where It&apos;s Used
          </FitHeading>
          <p className="section-description mt-5 mx-auto text-zinc-500">
            Common places where this storage system is installed and used every day.
          </p>
        </div>
        {items.length ? (
          <div className="mt-10 sm:mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((app) => {
              const title = app.title || app.application;
              const desc = app.description || "";
              const imgSrc = app.image ? optimizeImage(app.image, 600) : appImageFor(title, desc);
              return (
                <article key={app.id} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-zinc-300">
                  <div className="relative h-44 overflow-hidden bg-zinc-200">
                    <SmartImage
                      src={imgSrc}
                      alt={app.altText || title}
                      fill
                      className="object-cover object-center transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-zinc-950/20 to-transparent" />
                    <span className="absolute bottom-3 left-4 text-sm font-bold text-white drop-shadow-sm">{title}</span>
                  </div>
                  {desc && (
                    <div className="p-5">
                      <p className="text-sm leading-6 text-zinc-600">{desc}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : null}
        {product?.industries.length ? (
          <div className="mt-12 border-t border-zinc-300 pt-8">
            <h3 className="text-lg font-bold text-zinc-900">Industries Served</h3>
            <div className="mt-5 flex flex-wrap gap-2">
              {product.industries.map((industry) => (
                <span key={industry} className="border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">{industry}</span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function BenefitsSection({ items }: { items: ProductDetail["benefits"] }) {
  if (!items.length) return null;
  return (
    <section className="py-24">
      <div className="container-shell">
        <SectionHeading eyebrow="Benefits" title="Practical Benefits for Your Team" description="Real advantages for operators, supervisors and managers." />
        <div className="mt-12 grid gap-px bg-zinc-300 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = iconFor(item.title);
            return (
              <article key={item.id} className="min-h-60 bg-white p-7">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center bg-red-600 text-white"><Icon size={20} /></span>
                  <span className="text-xs font-bold text-zinc-300">0{i + 1}</span>
                </div>
                <h3 className="card-title mt-6">{item.title}</h3>
                {item.description && <p className="mt-3 text-sm leading-6 text-zinc-500">{item.description}</p>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function WorkflowSection() {
  return (
    // Padding and heading scale both dropped so this band sits between its
    // neighbours without dominating them. Background and content are unchanged.
    <section className="dark-grid bg-zinc-950 py-14 text-white lg:py-16">
      <div className="container-shell">
        <SectionHeading title="From Plan to Installation" description="We take your storage system from the first conversation to a finished, handed-over installation." light align="center" size="sm" />
        <WorkflowSteps />
        <p className="mt-6 text-xs text-zinc-500">Timelines are a guide and confirmed in your project proposal.</p>
      </div>
    </section>
  );
}

export function RealWorldSection({ projects, images }: { projects: ProductDetail["projects"]; images: ProductDetail["images"] }) {
  if (!projects.length && !images.length) return null;
  return (
    <section className="border-y border-zinc-200 py-24">
      <div className="container-shell">
        <SectionHeading eyebrow="See it in action" title="Storage in Real Workplaces" description="The system working in real storage environments." align="center" />
        {projects.length ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.slug}`} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-200">
                   <SmartImage src={optimizeImage(project.coverImage || "", 900)} alt={project.title} fill className="object-cover object-center transition duration-700 group-hover:scale-105" sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw" />

                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/45 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 bg-red-600 px-2.5 py-1 text-[.6rem] font-bold uppercase tracking-[.14em] text-white">{project.industry || "Project"}</span>
                </div>
                <div className="p-6">
                  <h3 className="card-title transition-colors group-hover:text-red-600">{project.title}</h3>
                  {project.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{project.description}</p>}
                  <p className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] transition-colors group-hover:text-red-600">View Project <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-12 grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[200px] md:grid-cols-4">
            {images.slice(0, 8).map((image) => (
              <div key={image.id} className={`relative overflow-hidden rounded-lg bg-zinc-200 ${image === images[0] ? "col-span-2 row-span-2" : ""}`}>
                <SmartImage src={optimizeImage(image.imageUrl, 700)} alt={image.altText} fill className="object-cover object-center" sizes={image === images[0] ? "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 50vw" : "(max-width: 767px) 50vw, 25vw"} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function FaqSection({ items }: { items: ProductDetail["faqs"] }) {
  if (!items.length) return null;
  return (
    <section className="py-24">
      <div className="container-shell grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <SectionHeading compact eyebrow="FAQs" title="Questions We Hear Often" />
          <p className="mt-6 text-sm leading-7 text-zinc-500">Anything not covered here will be answered in your proposal — or by our team.</p>
          <Link href="/contact" className="btn-secondary mt-8">Talk to Our Team <ArrowRight size={16} /></Link>
        </div>
        <FAQ items={items} />
      </div>
    </section>
  );
}

/**
 * "Related Storage Systems".
 *
 * The grid is one-per-row on phones, two on tablets and three on desktop, which
 * is the same `1 / 2 / 3` progression the homepage "What We Offer" grid uses, so
 * the two sections stay visually identical.
 *
 * Async because each card's image is resolved here rather than trusted from the
 * `related` row. `adaptDatabaseRelated` only has the product's legacy
 * `thumbnail`/`heroImage` columns to work with, but a product page leads with the
 * first of `[...folderImages, ...product_images]`. Reading the column here would
 * mean the card shows a different photograph from the page it links to and stops
 * following the admin the moment the gallery is reordered. `getRelatedProductImages`
 * answers the same question the product page answers, for every row in one batch.
 */
export async function RelatedSection({ items }: { items: ProductDetail["related"] }) {
  if (!items.length) return null;
  const images = await getRelatedProductImages(items);
  return (
    <section className="border-t border-zinc-200 bg-[#f4f4f1] py-24">
      <div className="container-shell">
        <SectionHeading compact singleLine title="Related Storage Systems" description="Other systems that work well alongside this one." />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <ProductCard
              key={item.id}
              product={{ ...item, image: images.get(String(item.id)) ?? null } as ProductCardProduct}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Closing call to action on every product page.
 *
 * The single source for this band: both product routes render
 * `ProductSectionsLayout`, so editing this component updates all of them at
 * once. Nothing product-specific is hard-coded here beyond the quote link, so
 * the section stays correct when the catalogue grows.
 */
export function FinalCtaSection({ product }: { product: ProductDetail }) {
  return (
    <section className="relative isolate overflow-hidden bg-zinc-950 py-20 text-white sm:py-24 lg:py-28">
      {/*
        The same warehouse image the homepage closing band uses, so the two
        read as one brand asset. `bg-zinc-950` on the section is the fallback
        colour: if the image is ever missing, the white text still has full
        contrast instead of dropping onto a white page.
      */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <SmartImage
          src="/Footer%20imagesbg.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      {/*
        A flat scrim plus a light vertical wash. Flat so centred text sits on an
        even value at every viewport, vertical to keep the racking detail toward
        the middle of the band where the copy actually sits.
      */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(9,9,11,.62)_0%,rgba(9,9,11,.78)_55%,rgba(9,9,11,.7)_100%)]" />

      <div className="container-shell flex flex-col items-center text-center">
        <FitHeading className="section-heading max-w-3xl text-balance">Planning Your Storage?</FitHeading>
        <p className="section-description mt-5 max-w-2xl text-zinc-300">
          Talk to Rack &amp; Stack about your storage needs and project.
        </p>
        {/*
          Full-width buttons on the smallest screens so the tap targets are
          comfortable, then a centred row from `sm` up. `flex-col` on a
          `w-full` parent cannot overflow: the children are stretched, not
          sized to their own content.
        */}
        <div className="mt-9 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
          <Link
            href={`/request-a-quote?product=${encodeURIComponent(product.slug)}`}
            className="btn-primary w-full sm:w-auto"
          >
            Get a Quote <ArrowRight size={17} />
          </Link>
          <Link href="/contact" className="btn-light w-full sm:w-auto">
            Talk to Our Team
          </Link>
        </div>
      </div>
    </section>
  );
}

export function FinalEnquirySection({ product, allProducts, allServices }: { product: ProductDetail; allProducts: ProductOption[]; allServices: Awaited<ReturnType<typeof getServices>> }) {
  return (
    <section className="surface-grid bg-[#f4f4f1] py-20">
      <div className="container-shell">
        {/* Capped and centred for the same reason as the standalone quote page:
            the form is a working area, not a full-bleed panel. */}
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-12">
          <div>
            <h2 className="heading-md text-balance">Tell Us What You Need to Store</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-500">Share your space, item sizes, maximum loads and handling method if you know them — we&apos;ll come back with setup options.</p>
          </div>
          <InquiryForm products={allProducts} services={allServices} defaultProduct={product.id} />
        </div>
      </div>
    </section>
  );
}

/**
 * Product-page client roster.
 *
 * A thin wrapper over `TrustedByStrip` so product pages read exactly like the
 * homepage, with hairline rules above and below because this section sits
 * between two others rather than under the hero.
 */
export function ClientRosterSection({ logos }: { logos: ClientLogo[] }) {
  return <TrustedByStrip logos={logos} className="border-y border-zinc-200" />;
}

export function CompactContactSection({ product, allProducts, allServices }: { product: ProductDetail; allProducts: ProductDetail["related"]; allServices: Awaited<ReturnType<typeof getServices>> }) {
  return (
    <section className="border-y border-zinc-100 bg-zinc-950 py-14 text-white">
      <div className="container-shell grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16 items-center">
        {/* Left: copy */}
        <div>
          <p className="eyebrow text-red-400">Quick Enquiry</p>
          <FitHeading className="section-heading mt-4 text-white text-balance">
            Need Storage?
          </FitHeading>
          <p className="section-description mt-5 text-zinc-400">
            Leave your details and we&apos;ll get back with setup options — usually within one business day.
          </p>
          <ul className="mt-6 space-y-2">
            {[
              "Free site survey available",
              "Custom sizes and load ratings",
              "Installation across India",
            ].map((pt) => (
              <li key={pt} className="flex items-center gap-2.5 text-sm text-zinc-300">
                <CheckCircle2 size={15} className="shrink-0 text-red-400" />
                {pt}
              </li>
            ))}
          </ul>
        </div>
        {/* Right: compact form */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur">
          <InquiryForm products={allProducts} services={allServices} defaultProduct={product.id} compact />
        </div>
      </div>
    </section>
  );
}

export function ProductSectionsLayout({
  product,
  logos,
  allProducts,
  allServices,
  entityType = "product",
  reels = [],
}: {
  product: ProductDetail;
  logos: ClientLogo[];
  allProducts: ProductOption[];
  allServices: Awaited<ReturnType<typeof getServices>>;
  entityType?: string;
  /** Reels linked to this product in the CMS. The section hides itself when empty. */
  reels?: ReelVideoItem[];
}) {
  // Only used to describe the reels as VideoObjects; the product's own metadata
  // already owns the canonical URL.
  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? ""}/products/${product.slug}`;
  return (
    <>
      <EventTracker eventName="product_view" entityType={entityType} entityId={product.id} />
      <MobileProductActions slug={product.slug} />
      <ProductHero product={product} />
      {product.showSpecifications && product.specifications.length > 0 ? <Reveal><TechnicalSpecificationsSection product={product} /></Reveal> : null}
      {product.showFeatures ? <Reveal><FeaturesSection items={product.features} product={product} /></Reveal> : null}
      {product.showGallery && !product.showFeatures ? <Reveal><ProductShowcaseSection product={product} /></Reveal> : null}
      <Reveal><OverviewSection product={product} /></Reveal>
      {product.showApplications ? <Reveal><ApplicationsSection items={product.applications} product={product} /></Reveal> : null}
      {/*
        The Reel section hides itself when this product has no Reels of its own,
        so a product without video never shows an empty heading.
      */}
      {reels.length > 0 ? (
        <ReelShowcase
          videos={reels}
          eyebrow="WATCH IT IN ACTION"
          title={`${product.name}, Working.`}
          subtitle="Short clips of this system installed, loaded and in daily use."
          cta={{ label: "Request a quote", href: `/request-a-quote?product=${product.slug}` }}
          pageUrl={productUrl}
        />
      ) : null}
      <Reveal><ClientRosterSection logos={logos} /></Reveal>
      {product.showBenefits ? <Reveal><BenefitsSection items={product.benefits} /></Reveal> : null}
      <Reveal><WorkflowSection /></Reveal>
      {product.projects.length > 0 ? <Reveal><RealWorldSection projects={product.projects} images={product.images} /></Reveal> : null}
      {product.showFaq ? <Reveal><FaqSection items={product.faqs} /></Reveal> : null}
      {product.showRelated ? <Reveal><RelatedSection items={product.related} /></Reveal> : null}
      <Reveal><FinalCtaSection product={product} /></Reveal>
      <FinalEnquirySection product={product} allProducts={allProducts} allServices={allServices} />
    </>
  );
}