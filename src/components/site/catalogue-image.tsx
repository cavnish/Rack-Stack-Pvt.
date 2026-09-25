import { ImageOff } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";
import type { CatalogueImage as CatalogueImageData } from "@/lib/catalogue";

type CatalogueImageProps = {
  productName: string;
  image?: CatalogueImageData;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function CatalogueImage({
  productName,
  image,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: CatalogueImageProps) {
  if (image?.url) {
    return (
      <div className={`relative overflow-hidden bg-zinc-100 ${className}`}>
        <SmartImage
          src={image.url}
          alt={image.alt || productName}
          fill
          priority={priority}
          sizes={sizes}
           className="object-cover object-center"

        />
      </div>
    );
  }

  return (
    <div
       className={`relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-zinc-100 p-7 text-center ${className}`}

      role="img"
      aria-label={`${productName}. Brochure image to be added`}
    >
      <div className="relative z-10 flex max-w-sm flex-col items-center">
        <span className="grid h-14 w-14 place-items-center bg-zinc-950 text-white" aria-hidden="true">
          <ImageOff size={24} strokeWidth={1.8} />
        </span>
        <p className="mt-5 text-base font-semibold leading-6 text-zinc-900">{productName}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-red-600">
          Brochure image to be added
        </p>
      </div>
      <div className="absolute inset-0 surface-grid opacity-70" aria-hidden="true" />
    </div>
  );
}
