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
    <Link
      href={product.href}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_20px_40px_-28px_rgba(17,20,22,.45)] focus-visible:-translate-y-1"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
        <SmartImage
          src={optimizeImage(product.image, 900)}
          alt=""
          fill
          loading="lazy"
          className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
          sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 25vw"
        />
      </div>
      <div className="flex grow flex-col p-6">
        <h3 className="card-title min-h-[3.25rem] text-balance text-zinc-900 transition-colors duration-200 group-hover:text-red-700">
          {product.name}
        </h3>
        <p className="mt-3 line-clamp-2 min-h-[3rem] text-sm leading-6 text-zinc-600">
          {product.shortDescription || "Explore specifications, features and project-ready storage options."}
        </p>
        <span aria-hidden className="mt-auto flex items-center justify-end border-t border-zinc-100 pt-5 text-[.68rem] font-bold uppercase tracking-[.16em] text-zinc-900 transition-colors duration-200 group-hover:text-red-700">
          View Details
          <ArrowRight
            size={14}
            className="ml-1.5 transition-transform duration-200 group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}
