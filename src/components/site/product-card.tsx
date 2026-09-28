import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";
import { optimizeImage } from "@/lib/image-utils";
import { getProductHref } from "@/lib/product-page";

export type ProductCardProduct = {
  id: number | string;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  /**
   * The product's primary image, already resolved by the caller.
   *
   * This wins over `thumbnail`/`heroImage` because those are the raw table
   * columns, not the product's first image — see `src/lib/product-primary-images.ts`.
   * Callers that know the product should resolve it with `getRelatedProductImages`
   * (related lists), `getPrimaryProductImages` (CMS products) or
   * `getPrimaryCatalogueImages` (catalogue products) and pass the result here,
   * so the card, the product page and the homepage all show the same photograph.
   */
  image?: string | null;
  thumbnail?: string | null;
  heroImage?: string | null;
  keySpec?: { name: string; value: string };
  application?: string | null;
  applicationTitle?: string | null;
  href?: string;
  /** Overrides the image alt text, which defaults to the product name. */
  alt?: string;
  /**
   * Whether to offer the red "Get a Quote" button.
   *
   * Home-page cards are CMS-controlled per product, so this is off-able there;
   * product pages always leave it on. Defaults to on.
   */
  showQuoteButton?: boolean;
  /** Overrides the quote button label. */
  ctaLabel?: string;
};

/**
 * The product card used by "Related Storage Systems" on every product page and
 * by the homepage "What We Offer" section.
 *
 * One component for both, on purpose: the homepage inherits the product page's
 * proportions, borders, typography and hover behaviour, so the two can never
 * drift into looking like different products. The `index` prop is what the
 * `01 / 02 / 03` corner marker counts from, and callers pass their own position
 * in the grid.
 *
 * Equal heights in a row come from three things working together, because any
 * one of them alone leaves a mismatch: the grid stretches its items, `h-full`
 * lets the card fill that stretched row, and `mt-auto` on the footer row pins
 * the CTAs to the same baseline. The title and description are line-clamped for
 * the same reason — an unbounded title is what actually makes one card taller
 * than its neighbours.
 */
export function ProductCard({ product, index = 0 }: { product: ProductCardProduct; index?: number }) {
  const image = product.image || product.thumbnail || product.heroImage || "";
  const productHref = product.href || getProductHref(product.slug);
  const quoteHref = `/request-a-quote?product=${encodeURIComponent(product.slug)}`;
  const showQuoteButton = product.showQuoteButton !== false;
  return (
    <div className="group flex h-full min-h-[520px] flex-col overflow-hidden border border-zinc-200 bg-white transition-colors duration-300 hover:border-zinc-800">
      <Link href={productHref} className="relative block aspect-[4/3] shrink-0 overflow-hidden bg-zinc-200">
        <SmartImage src={optimizeImage(image, 760)} alt={product.alt || product.name} fill className="object-cover object-center transition duration-700 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {product.category ? (
          <span className="absolute left-4 top-4 max-w-[70%] truncate bg-red-600 px-2.5 py-1 text-[.6rem] font-bold uppercase tracking-[.14em] text-white">{product.category}</span>
        ) : null}
        <span className="absolute right-4 top-4 bg-zinc-950/80 px-2 py-1 text-[.6rem] font-bold text-white/80 backdrop-blur">{String(index + 1).padStart(2, "0")}</span>
        <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center gap-2 py-5 text-xs font-bold uppercase tracking-[.16em] text-white opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          View Product <ArrowRight size={15} />
        </span>
      </Link>
      <div className="flex grow flex-col p-6">
        {/*
          `min-h` reserves two lines of title whether or not the name needs them.
          Without it a one-line name sits in half the space of a two-line one and
          the descriptions below start at different heights.
        */}
        <Link href={productHref} className="card-title line-clamp-2 min-h-[2.6em] transition-colors group-hover:text-red-600">
          {product.name}
        </Link>
        <p className="mt-3 line-clamp-3 min-h-[4.5em] text-sm leading-6 text-zinc-600">{product.shortDescription}</p>
        {(product.keySpec?.name || product.application) && (
          <div className="mt-5 grid gap-2 border-t border-zinc-200 pt-5 text-xs text-zinc-600">
            {product.keySpec?.name && (
              <p className="flex gap-2">
                <span className="font-bold uppercase tracking-[.12em] text-zinc-400">{product.keySpec.name}</span>
                <span className="min-w-0 flex-1 text-zinc-700">{product.keySpec.value}</span>
              </p>
            )}
            {product.application && (
              <p className="flex gap-2">
                <span className="shrink-0 font-bold uppercase tracking-[.12em] text-zinc-400">Applications</span>
                <span className="line-clamp-1 text-zinc-700">{product.application}</span>
              </p>
            )}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-200 pt-5">
          {showQuoteButton ? (
            <Link href={quoteHref} className="btn-primary shrink-0 px-4 py-2 text-[.68rem]">
              {product.ctaLabel || "Get a Quote"}
            </Link>
          ) : (
            <span aria-hidden className="hidden sm:block" />
          )}
          <Link href={productHref} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-bold uppercase tracking-[.14em] transition-colors hover:text-red-600">
            View Product <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}