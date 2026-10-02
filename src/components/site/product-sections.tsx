import { siteOrigin } from "@/lib/site-url";
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
import { ProductRecommendations } from "@/components/site/product-recommendations";
import { FitHeading } from "@/components/site/fit-heading";
import { InquiryForm } from "@/components/site/inquiry-form";
import { InquiryFormFallback } from "@/components/site/inquiry-form-fallback";
import { Suspense } from "react";
import { SectionHeading } from "@/components/site/ui";
import { MobileProductActions } from "@/components/site/product-experience";
import { EventTracker } from "@/components/site/event-tracker";
import { Reveal } from "@/components/site/reveal";
import { WorkflowSteps } from "@/components/site/workflow-steps";
import { TrustedByStrip } from "@/components/site/trusted-by-strip";
import { ReelShowcase } from "@/components/media/reel-showcase";
import { optimizeImage } from "@/lib/image-utils";
import { localAssetFor } from "@/lib/local-assets";
import { catalogueCategoryNames } from "@/lib/catalogue";
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

/**
 * The slides the product hero shows, in the order the editor arranged them.
 *
 * This used to return exactly six images: it walked a fixed list of six named
 * slots and pulled `product.images[idx]` into each one, so a seventh uploaded
 * image was stored, published and then silently dropped here, and every caption
 * was a hardcoded slot label rather than anything an editor had written. The
 * admin could add a photo and the page would not show it.
 *
 * The order of preference is now:
 *
 *  1. the admin-managed gallery, active rows only, in editor order — every row
 *     renders, there is no cap, and each keeps its own alt text and caption;
 *  2. `product.images`, which for a CMS product is its `product_images` rows
 *     followed by the assets in its product folder, and for a catalogue product
 *     is that folder plus the catalogue's own images;
 *  3. the hero image on its own, so a product with a hero but no gallery still
 *     has something to show;
 *  4. a stock placeholder, only when the product genuinely has no imagery at all.
 *
 * Only the last case invents an image, so a real photo is never overwritten by a
 * placeholder and a real caption is never replaced by a slot label.
 */
export function getProductCuratedImages(product: ProductDetail) {
  const managed = product.gallery ?? [];
  if (managed.length > 0) {
    return managed.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText || `${product.name} product image`,
      caption: image.caption,
      label: image.caption ?? "",
    }));
  }

  const images = (product.images ?? []).filter((image) => image.imageUrl?.trim());
  if (images.length > 0) {
    return images.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText || `${product.name} product image`,
      caption: image.caption,
      label: image.caption ?? "",
    }));
  }

  const hero = (product.heroImage || product.thumbnail || "").trim();
  if (hero) {
    return [
      {
        id: -1,
        imageUrl: hero,
        altText: `${product.name} overview`,
        caption: null,
        label: "",
      },
    ];
  }

  // No imagery anywhere: one stock frame, so the gallery component still renders
  // its chrome and the page keeps its layout instead of collapsing.
  const placeholder = "https://images.pexels.com/photos/1797415/pexels-photo-1797415.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600";
  return [
    {
      id: -1,
      imageUrl: localAssetFor(placeholder, "products") ?? placeholder,
      altText: `${product.name} storage system`,
      caption: null,
      label: "",
    },
  ];
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
        <div className="min-w-0">
          <ProductGallery images={curatedImages} productTitle={product.name} />
        </div>

        {/* Right Column: Product Information & Action Panel */}
        <div className="flex min-w-0 flex-col justify-center">
          {product.status !== "PUBLISHED" ? (
            <span className="w-fit bg-amber-300 px-3 py-1 text-xs font-bold text-black rounded">Draft preview</span>
          ) : null}

          {/* Product Title */}
          <FitHeading as="h1" minPx={14} className="section-heading text-balance text-zinc-900">
            {heroTitle}
          </FitHeading>

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
        <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-500">
                        {item.description}
                      </p>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* A fixed six-up strip below the feature cards. */}
        {showcasePhotos.length > 0 ? (
          <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {showcasePhotos.slice(0, 6).map((photo, i) => (
              <div
                key={`${photo.id}-${i}`}
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
                {photo.label ? (
                  <span className="absolute bottom-2.5 left-2.5 right-2.5 text-xs font-semibold text-white drop-shadow">
                    {photo.label}
                  </span>
                ) : null}
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
    <section className="py-16">
      <div className="container-shell">
        <SectionHeading eyebrow="Product photos" title="See the System Up Close" description="See the system installed, loaded and in detail." align="center" />
        <div className="mt-8">
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
    <section className="py-16">
      <div className="container-shell grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <FitHeading className="section-heading text-balance">Built for Efficient Storage</FitHeading>
          <p className="section-description mt-3 text-zinc-700">{body}</p>
          <p className="mt-4 flex items-start gap-3 text-sm leading-7 text-zinc-500"><Ruler size={17} className="mt-0.5 shrink-0 text-red-600" />Final sizes, loads and engineering are confirmed against your layout and project proposal.</p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-200">
          {overviewImage ? <SmartImage src={optimizeImage(overviewImage, 1300)} alt={product.name} fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 50vw" /> : <div className="absolute inset-0 grid place-items-center bg-zinc-900 text-zinc-600"><Layers size={50} /></div>}
        </div>
      </div>
    </section>
  );
}

/**
 * The editor's reusable content sections.
 *
 * A section is a heading, some copy, optionally a photograph and optionally a
 * small note above the heading. That is the shape of every block on a product
 * page that is not the hero, the gallery or a list, which is why the admin needs
 * one list of them rather than a tab per block.
 *
 * Layout is chosen per section so an editor can alternate image-left and
 * image-right down the page instead of getting the same arrangement every time.
 * A section with no image renders as a full-width band of text, so text-only
 * content never leaves an empty column.
 */
export function ContentSectionsBlock({ sections }: { sections: ProductDetail["sections"] }) {
  const active = sections.filter((section) => section.isActive !== false && section.title);
  if (active.length === 0) return null;
  return (
    <>
      {active.map((section, index) => {
        const image = section.imageUrl;
        const text = (
          <div>
            {section.eyebrow ? (
              <p className="mb-2 text-[.6rem] font-bold uppercase tracking-[.2em] text-red-600">{section.eyebrow}</p>
            ) : null}
            <FitHeading className="section-heading text-balance">{section.title}</FitHeading>
            {section.body ? <p className="section-description mt-3 text-zinc-700">{section.body}</p> : null}
            {section.ctaLabel && section.ctaHref ? (
              <Link
                href={section.ctaHref}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800"
              >
                {section.ctaLabel}
                <ArrowRight size={14} />
              </Link>
            ) : null}
          </div>
        );
        const picture = image ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-200">
            <SmartImage
              src={optimizeImage(image, 1300)}
              alt={section.altText || section.title}
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        ) : null;

        return (
          <section key={section.key || `${section.title}-${index}`} id={section.key || undefined} className="py-14">
            {picture ? (
              <div
                className={`container-shell grid items-center gap-10 lg:grid-cols-2 lg:gap-14 ${
                  section.layout === "image-left" ? "[&>*:first-child]:order-2" : ""
                }`}
              >
                {text}
                {picture}
              </div>
            ) : (
              <div className="container-shell">{text}</div>
            )}
          </section>
        );
      })}
    </>
  );
}

export function TechnicalSpecificationsSection({ product }: { product: ProductDetail }) {
  if (!product.specifications.length) return null;
  const productImage = product.heroImage || product.thumbnail || product.images[0]?.imageUrl || "";
  return (
    <section id="specifications" className="border-y border-zinc-200 bg-white py-14 lg:py-20">
      <div className="container-shell">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
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
                  {/* The stored category is a slug, because it is what the URL
                      and the mega menu are built from. Visitors see the name. */}
                  {catalogueCategoryNames[product.category] ?? product.category}
                </span>
              )}
            </div>
          </div>

          {/* Right: specifications table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
            {/*
              One row per specification, name and value side by side, at every
              width.

              This used to be two separate lists: an inline table from `sm` up and
              a `<details>` accordion below it, so on a phone every value was
              hidden behind a tap. Comparing load ratings meant opening each row
              in turn. The accordion is gone and both lists are now the same
              inline rows, so a specification is readable in one glance on any
              screen. The name column keeps its own width so values line up down
              the table rather than each row splitting the space differently.
            */}
            <div className="divide-y divide-zinc-100">
              {product.specifications.map((spec, i) => (
                <div
                  key={spec.id}
                  className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-baseline gap-x-4 gap-y-1 px-5 py-3.5 text-sm sm:px-6 sm:py-4 ${
                    i % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"
                  }`}
                >
                  <span className="font-semibold text-zinc-800">{spec.specificationName}</span>
                  <span className="text-zinc-600 sm:text-[.95rem]">{spec.specificationValue}</span>
                </div>
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
          <p className="section-description mt-3 mx-auto text-zinc-500">
            Common places where this storage system is installed and used every day.
          </p>
        </div>
        {items.length ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    <div className="p-4">
                      <p className="text-sm leading-6 text-zinc-600">{desc}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : null}
        {product?.industries.length ? (
          <div className="mt-8 border-t border-zinc-300 pt-6">
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
        <div className="mt-8 grid gap-px bg-zinc-300 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = iconFor(item.title);
            return (
<article key={item.id} className="bg-white p-5">
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center bg-red-600 text-white"><Icon size={18} /></span>
                    <span className="text-xs font-bold text-zinc-300">0{i + 1}</span>
                  </div>
                  <h3 className="card-title mt-2">{item.title}</h3>
                  {item.description && <p className="mt-2 text-sm leading-6 text-zinc-500">{item.description}</p>}
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
                <div className="p-4">
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
    <div>
      <SectionHeading compact eyebrow="FAQs" title="Questions We Hear Often" />
      <p className="mt-4 text-sm leading-7 text-zinc-500">Anything not covered here will be answered in your proposal — or by our team.</p>
      <Link href="/contact" className="btn-secondary mt-6">Talk to Our Team <ArrowRight size={16} /></Link>
      <div className="mt-8">
        <FAQ items={items} />
      </div>
    </div>
  );
}

/**
 * "Recommended systems" on a product page.
 *
 * A thin wrapper, and that is the point. The section's markup, its four-across
 * grid and its card all live in {@link ProductRecommendations}, which the
 * industry pages render too, so a product page and an industry page cannot end
 * up presenting recommended products differently. This function's only job is to
 * hand that component the right copy for *this* product: the three columns an
 * editor may have written, and otherwise the defaults derived from the product's
 * own category.
 *
 * Which products appear is the existing `productRelatedProducts` relationship,
 * in editor order, with disabled rows left out. Nothing here is hardcoded, and
 * the images are the recommended products' own primary images, resolved by
 * `ProductRecommendations` the same way the product page resolves its own.
 */
export async function RelatedSection({ product }: { product: ProductPageProduct }) {
  if (!product.showRelated || !product.related.length) return null;
  return (
    <Reveal>
      <ProductRecommendations
        products={product.related}
        copy={{
          heading: product.relatedHeading,
          subheading: product.relatedSubheading,
          description: product.relatedDescription,
        }}
        category={product.category}
      />
    </Reveal>
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
          Always one row, including the narrowest phones.

          These used to be `flex-col ... w-full` below `sm`, so on any screen under
          768px the two buttons stacked and pushed the band taller than the screen.
          They now share the row at every width: `flex-1` on mobile so both stay
          comfortable tap targets side by side, then intrinsic widths from `sm` up
          where there is room for them. `whitespace-nowrap` keeps each label on a
          single line rather than letting it wrap to two and unbalance the row.
        */}
        <div className="mt-8 flex w-full items-stretch gap-2.5 sm:mt-9 sm:w-auto sm:justify-center sm:gap-3">
          <Link
            href={`/request-a-quote?product=${encodeURIComponent(product.slug)}`}
            className="btn-primary flex-1 justify-center whitespace-nowrap px-4 sm:flex-none sm:px-6"
          >
            Get a Quote <ArrowRight size={17} className="shrink-0" />
          </Link>
          <Link href="/contact" className="btn-light flex-1 justify-center whitespace-nowrap px-4 sm:flex-none sm:px-6">
            Talk to Our Team
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * The closing "ask a question" band: FAQs on the left, quote form on the right.
 *
 * These were two full-width bands stacked on top of each other, so a visitor had
 * to scroll past the whole FAQ list before reaching the form, and the form itself
 * started far enough down the page that on a phone it opened below the fold. They
 * are one band now: from `lg` up the FAQ column sits beside the form, and below
 * that they stack with the form first, because on a small screen the form is what
 * the visitor came for and the FAQ is the fallback for someone who is not ready
 * to enquire yet.
 *
 * `order` does the stacking: on mobile the heading and form come first and the
 * FAQ list follows; from `lg` up both columns return to source order, which is
 * FAQ on the left.
 */
export function FaqAndEnquirySection({
  product,
  items,
  allProducts,
  allServices,
}: {
  product: ProductDetail;
  items: ProductDetail["faqs"];
  allProducts: ProductOption[];
  allServices: Awaited<ReturnType<typeof getServices>>;
}) {
  const hasFaqs = items.length > 0;
  return (
    <section className="surface-grid bg-[#f4f4f1] py-12 sm:py-14 lg:py-20">
      <div className="container-shell">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-14">
          {/* Mobile-first order: form before FAQs, restored on desktop. */}
          <div className="order-2 lg:order-1">
            {hasFaqs ? <FaqSection items={items} /> : null}
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="heading-md text-balance">Tell Us What You Need to Store</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Share your space, item sizes, maximum loads and handling method if you know them — we&apos;ll come back with setup options.
            </p>
            <div className="mt-6">
              <Suspense fallback={<InquiryFormFallback />}>
                <InquiryForm products={allProducts} services={allServices} defaultProduct={product.id} />
              </Suspense>
            </div>
          </div>
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
          <Suspense fallback={<InquiryFormFallback compact />}>
            <InquiryForm products={allProducts} services={allServices} defaultProduct={product.id} compact />
          </Suspense>
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
  const productUrl = `${siteOrigin()}/products/${product.slug}`;
  return (
    <>
      <EventTracker eventName="product_view" entityType={entityType} entityId={product.id} />
      <MobileProductActions slug={product.slug} />
      <ProductHero product={product} />
      {product.showSpecifications && product.specifications.length > 0 ? <Reveal><TechnicalSpecificationsSection product={product} /></Reveal> : null}
      {product.showFeatures ? <Reveal><FeaturesSection items={product.features} product={product} /></Reveal> : null}
      {product.showGallery && !product.showFeatures ? <Reveal><ProductShowcaseSection product={product} /></Reveal> : null}
      <Reveal><OverviewSection product={product} /></Reveal>
      {/*
        Editor-built sections sit between the gallery and "Where it's used",
        which is where the long-form explanation of the system belongs. The
        block renders nothing when a product has no sections, so every product
        page that has not opted in is byte-for-byte what it was before.
      */}
      <ContentSectionsBlock sections={product.sections} />
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
      {product.showRelated ? <RelatedSection product={product} /> : null}
      <Reveal><FinalCtaSection product={product} /></Reveal>
      {/*
        FAQs and the quote form are one band: FAQ left, form right on desktop,
        stacked with the form first on mobile. See `FaqAndEnquirySection`.
      */}
      <FaqAndEnquirySection
        product={product}
        items={product.showFaq ? product.faqs : []}
        allProducts={allProducts}
        allServices={allServices}
      />
    </>
  );
}
