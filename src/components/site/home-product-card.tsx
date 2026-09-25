import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";
import { optimizeImage } from "@/lib/image-utils";

export type HomeProductCardProduct = {
  name: string;
  slug: string;
  href: string;
  category: string;
  shortDescription?: string;
  image: string;
};

export function HomeProductCard({ product }: { product: HomeProductCardProduct }) {
  return (
    <article className="group flex min-h-[430px] min-w-0 flex-col overflow-hidden border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-zinc-800 hover:shadow-xl hover:shadow-zinc-950/10">
      <Link href={product.href} className="relative block aspect-[4/3] overflow-hidden bg-zinc-100" tabIndex={-1} aria-hidden="true">
        <SmartImage
          src={optimizeImage(product.image, 900)}
          alt={product.name}
          fill
          loading="lazy"
           className="object-cover object-center transition duration-700 group-hover:scale-[1.03]"

          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
        />
         <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
         <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center gap-2 py-5 text-xs font-bold uppercase tracking-[.16em] text-white opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">

          View Product <ArrowRight size={15} />
        </span>
      </Link>
      <div className="flex grow flex-col p-5 sm:p-6">
        <h3 className="card-title min-h-[3.25rem] text-balance">
          <Link href={product.href} className="transition-colors group-hover:text-red-600">
            {product.name}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-2 min-h-[3rem] text-sm leading-6 text-zinc-600">
          {product.shortDescription || "Explore specifications, features and project-ready storage options."}
        </p>
         <div className="mt-auto flex items-center justify-end border-t border-zinc-200 pt-5">
           <Link href={product.href} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.12em] transition-colors hover:text-red-600">
             View details <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />

          </Link>
        </div>
      </div>
    </article>
  );
}
