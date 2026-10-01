import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";
import { optimizeImage } from "@/lib/image-utils";
import { getProductHref } from "@/lib/catalogue-shared";

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
    <div className="group flex h-full flex-col overflow-hidden border border-zinc-200 bg-white transition-colors duration-300 hover:border-zinc-800">
      <Link href={productHref} className="relative block aspect-[4/3] shrink-0 overflow-hidden bg-zinc-200">
        <SmartImage src={optimizeImage(image, 760)} alt={product.alt || product.name} fill className="object-cover object-center transition duration-700 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center gap-2 py-5 text-xs font-bold uppercase tracking-[.16em] text-white opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          View Product <ArrowRight size={15} />
        </span>
      </Link>
      <div className="flex grow flex-col p-4 sm:p-5">
        <Link href={productHref} className="card-title line-clamp-2 transition-colors group-hover:text-red-600">
          {product.name}
        </Link>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">{product.shortDescription}</p>
        {(product.keySpec?.name || product.application) && (
          <div className="mt-4 grid gap-1.5 border-t border-zinc-200 pt-3 text-xs text-zinc-600">
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
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-200 pt-3">
          {showQuoteButton ? (
            <Link href={quoteHref} className="btn-primary shrink-0 px-3 py-2 text-[.65rem] sm:px-4 sm:text-[.68rem]">
              {product.ctaLabel || "Get a Quote"}
            </Link>
          ) : (
            <span aria-hidden className="hidden sm:block" />
          )}
          <Link href={productHref} className="flex shrink-0 items-center gap-1 text-[.65rem] font-bold uppercase tracking-[.12em] transition-colors hover:text-red-600 sm:text-xs sm:tracking-[.14em]">
            View <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}