"use client";

import { useState } from "react";
import { SmartImage } from "@/components/site/smart-image";
import type { PublicClientLogo } from "@/lib/client-assets";

type Logo = PublicClientLogo;

function LogoCard({ logo }: { logo: Logo }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      role="listitem"
      title={logo.name}
      aria-label={logo.name}
      className="home-client-card"
    >
      <div
        className={`absolute inset-2 animate-pulse bg-zinc-50 transition-opacity ${loaded ? "opacity-0" : "opacity-100"}`}
        aria-hidden="true"
      />
      <SmartImage
        src={logo.imageUrl}
        alt={logo.altText || `${logo.name} logo`}
        width={140}
        height={70}
         sizes="(max-width: 639px) 50vw, (max-width: 1023px) 25vw, 14vw"

        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className="relative z-[1] h-full w-full object-contain p-2"
      />
    </div>
  );
}

export function HomeClientLogoSlider({ logos }: { logos: Logo[] }) {
  const items = logos.filter((logo) => logo.imageUrl);
  if (items.length === 0) {
    return (
      <p className="text-xs text-zinc-500" role="status">
        Client logos are being updated. Please check back shortly.
      </p>
    );
  }

  const logosPerRow = 7;
  const logoGroups = Array.from({ length: Math.ceil(items.length / logosPerRow) }, (_, index) =>
    items.slice(index * logosPerRow, (index + 1) * logosPerRow)
  );
  const marqueeGroups = [...logoGroups, ...logoGroups];

  return (
    <div className="marquee" role="list" aria-label="Client logos">
      <div className="marquee-track home-client-track">
        {marqueeGroups.map((group, groupIndex) => (
          <div
            className="marquee-group home-client-group"
            key={`group-${groupIndex}`}
            aria-hidden={groupIndex >= logoGroups.length ? "true" : undefined}
            role="group"
          >
            {group.map((logo) => (
              <LogoCard key={`${groupIndex}-${logo.id}-${logo.imageUrl}`} logo={logo} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
