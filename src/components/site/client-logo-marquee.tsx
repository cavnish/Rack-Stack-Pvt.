"use client";

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

  const duplicated = [...items, ...items];

  return (
    <div className="marquee" role="list" aria-label="Client logos">
      <div className="marquee-track">
        {duplicated.map((logo, index) => (
          <div
            key={`${logo.id}-${index}`}
            role="listitem"
            className="marquee-item border border-zinc-200 bg-white"
            title={logo.name}
          >
            <SmartImage
              src={logo.imageUrl}
              alt={logo.altText || `${logo.name} logo`}
              width={140}
              height={70}
              loading="lazy"
              className="h-full w-auto object-contain"
            />
            {showNames && (
              <span className="ml-3 whitespace-nowrap text-[.65rem] font-bold uppercase tracking-[.12em] text-zinc-500">
                {logo.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
