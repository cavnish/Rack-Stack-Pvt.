import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { CatalogueImage } from "@/components/site/catalogue-image";
import { QuoteButton } from "@/components/site/quote-button";
import {
  catalogueCategoryNames,
  getCatalogueProductHref,
  getCatalogueProductType,
  type CatalogueProduct,
} from "@/lib/catalogue";

type CatalogueProductCardProps = {
  product: CatalogueProduct;
};

export function CatalogueProductCard({ product }: CatalogueProductCardProps) {
  const href = getCatalogueProductHref(product);
  const categoryName = catalogueCategoryNames[product.category];
  const productType = getCatalogueProductType(product);

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden border border-zinc-200 bg-white transition-colors duration-300 hover:border-zinc-800">
      <Link href={href} className="relative block overflow-hidden bg-zinc-100" tabIndex={-1} aria-hidden="true">
        <CatalogueImage
          productName={product.name}
          image={product.images[0]}
          className="aspect-[4/3] transition duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <span className="absolute left-4 top-4 bg-red-600 px-2.5 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white">
          {categoryName}
        </span>
        {product.featured ? (
          <span className="absolute right-4 top-4 flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white">
            <Star size={11} fill="currentColor" aria-hidden="true" /> Featured
          </span>
        ) : null}
      </Link>
      <div className="flex grow flex-col p-6">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-red-600">{productType}</p>
        <h2 className="card-title mt-3 text-balance">
          <Link href={href} className="transition-colors hover:text-red-600">
            {product.name}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">{product.shortDescription}</p>
        <div className="mt-auto flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <QuoteButton product={product} label="Request Quote" className="btn-primary w-full sm:w-auto" />
          <Link
            href={href}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:text-red-600"
          >
            View details <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
