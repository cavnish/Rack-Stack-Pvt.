import { SmartImage } from "@/components/site/smart-image";

export type ClientLogo = {
  id: number;
  name: string;
  imageUrl: string;
  altText: string;
  width: number | null;
  height: number | null;
};

function monogram(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function LogoEntry({ logo, decorative }: { logo: ClientLogo; decorative: boolean }) {
  if (logo.imageUrl) {
    return (
      <SmartImage
        src={logo.imageUrl}
        alt={decorative ? "" : logo.altText || `${logo.name} logo`}
        width={logo.width ?? 480}
        height={logo.height ?? 192}
        sizes="(max-width: 768px) 140px, 220px"
        loading="lazy"
      />
    );
  }
  return (
    <span className="marquee-monogram">
      <span className="marquee-monogram-badge" aria-hidden="true">{monogram(logo.name)}</span>
      <span className="marquee-monogram-name">{logo.name}</span>
    </span>
  );
}

export function ClientLogoMarquee({ logos }: { logos: ClientLogo[] }) {
  if (logos.length === 0) {
    return (
      <p className="marquee-empty" role="status">
        Client logos are being updated. Please check back shortly.
      </p>
    );
  }
  return (
    <div className="marquee" role="region" aria-label="Client logos">
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <div className="marquee-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
            {logos.map((logo) => (
              <div className="marquee-item" key={`${copy}-${logo.id}`} title={logo.name}>
                <LogoEntry logo={logo} decorative={copy === 1} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
