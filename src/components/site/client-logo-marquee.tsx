"use client";

import { SmartImage } from "@/components/site/smart-image";
import type { PublicClientLogo } from "@/lib/client-assets";

export type ClientLogo = PublicClientLogo;

function LogoCard({ logo, decorative = false }: { logo: ClientLogo; decorative?: boolean }) {
  return (
    <li className="logo-card" title={logo.name} aria-hidden={decorative || undefined}>
      <SmartImage
        src={logo.imageUrl}
        alt={decorative ? "" : logo.altText || `${logo.name} logo`}
        width={180}
        height={80}
        loading="lazy"
        className="logo-card-img"
      />
    </li>
  );
}

export function ClientLogoMarquee({
  logos,
  showNames = false,
  cards = false,
}: {
  logos: ClientLogo[];
  showNames?: boolean;
  /**
   * One wide, evenly sized card per logo with a real `gap` between cards.
   *
   * Below `lg` the row is a touch carousel; from `lg` up it becomes the
   * continuous single-row scroll the homepage has always used, since the full
   * roster is far wider than any viewport. Opt-in so the `/clients` roster and
   * the product-page roster keep their existing name-plate treatment.
   */
  cards?: boolean;
}) {
  const items = logos.filter((logo) => logo.imageUrl);
  if (items.length === 0) {
    return (
      <p className="text-xs text-zinc-500" role="status">
        Client logos are being updated. Please check back shortly.
      </p>
    );
  }

  if (cards) {
    return (
      <div className="logo-row">
        <ul className="logo-row-track" aria-label="Client logos">
          {items.map((logo) => (
            <LogoCard key={logo.id} logo={logo} />
          ))}
        </ul>
        <ul className="logo-row-track logo-row-track--clone" aria-hidden="true">
          {items.map((logo) => (
            <LogoCard key={`clone-${logo.id}`} logo={logo} decorative />
          ))}
        </ul>
      </div>
    );
  }

  const duplicated = [...items, ...items];

  return (
    <div className="marquee" data-cards={cards || undefined} role="list" aria-label="Client logos">
      <div className="marquee-track">
        {duplicated.map((logo, index) => (
          <div
            key={`${logo.id}-${index}`}
            role="listitem"
            className={`marquee-item border border-zinc-200 bg-white${cards ? " marquee-item--card" : ""}`}
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
