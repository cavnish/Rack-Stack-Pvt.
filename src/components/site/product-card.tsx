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
  thumbnail?: string | null;
  heroImage?: string | null;
  keySpec?: { name: string; value: string };
  application?: string | null;
  applicationTitle?: string | null;
  href?: string;
};

export function ProductCard({ product, index = 0 }: { product: ProductCardProduct; index?: number }) {
  const image = product.thumbnail || product.heroImage || "";
  const productHref = product.href || getProductHref(product.slug);
  const quoteHref = `/request-a-quote?product=${encodeURIComponent(product.slug)}`;
  return (
    <div className="group flex min-h-[520px] flex-col overflow-hidden border border-zinc-200 bg-white transition-colors duration-300 hover:border-zinc-800">
      <Link href={productHref} className="relative block aspect-[4/3] overflow-hidden bg-zinc-200">
        <SmartImage src={optimizeImage(image, 760)} alt={product.name} fill className="object-cover object-center transition duration-700 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="absolute left-4 top-4 bg-red-600 px-2.5 py-1 text-[.6rem] font-bold uppercase tracking-[.14em] text-white">{product.category}</span>
        <span className="absolute right-4 top-4 bg-zinc-950/80 px-2 py-1 text-[.6rem] font-bold text-white/80 backdrop-blur">{String(index + 1).padStart(2, "0")}</span>
        <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center gap-2 py-5 text-xs font-bold uppercase tracking-[.16em] text-white opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          View Product <ArrowRight size={15} />
        </span>
      </Link>
      <div className="flex grow flex-col p-6">
        <Link href={productHref} className="card-title text-balance transition-colors group-hover:text-red-600">
          {product.name}
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">{product.shortDescription}</p>
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
        <div className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-5">
          <Link href={quoteHref} className="btn-primary px-4 py-2 text-[.68rem]">
            Get a Quote
          </Link>
          <Link href={productHref} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.14em] transition-colors hover:text-red-600">
            View Product <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}