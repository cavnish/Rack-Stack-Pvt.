import { SmartImage } from "@/components/site/smart-image";
import type { PublicClientLogo } from "@/lib/client-assets";

export type ClientLogo = PublicClientLogo;

export function ClientLogoMarquee({ logos, showNames = false }: { logos: ClientLogo[]; showNames?: boolean }) {
  const items = logos.filter((logo) => logo.imageUrl);
  if (items.length === 0) {
    return (
      <p className="text-xs text-zinc-500" role="status">
        Client logos are being updated. Please check back shortly.
      </p>
    );
  }
  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${showNames ? "lg:grid-cols-5" : "lg:grid-cols-8"}`}
      role="list"
      aria-label="Client logos"
    >
      {items.map((logo) => (
        <div
          key={`${logo.id}-${logo.imageUrl}`}
          role="listitem"
          title={logo.name}
          className={`group flex flex-col items-center justify-center border border-zinc-200 bg-white text-center transition duration-300 hover:-translate-y-1 hover:border-zinc-400 hover:shadow-lg hover:shadow-zinc-950/5 ${showNames ? "p-4" : ""}`}
        >
          <div className="relative flex aspect-[2/1] w-full items-center justify-center">
            <SmartImage
              src={logo.imageUrl}
              alt={logo.altText || `${logo.name} logo`}
              fill
              sizes={showNames ? "(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 20vw" : "(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 18vw"}
              loading="lazy"
              className="object-contain p-2 transition duration-300 group-hover:scale-[1.04]"
            />
          </div>
          {showNames ? <p className="mt-3 line-clamp-1 text-[.65rem] font-bold uppercase tracking-[.12em] text-zinc-500">{logo.name}</p> : null}
        </div>
      ))}
    </div>
  );
}
