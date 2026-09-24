import { SmartImage } from "@/components/site/smart-image";

export type ClientLogo = {
  id: number;
  name: string;
  imageUrl: string;
  altText: string;
  width: number | null;
  height: number | null;
};

export function ClientLogoMarquee({ logos }: { logos: ClientLogo[] }) {
  const items = logos.filter((logo) => logo.imageUrl).slice(0, 5);
  if (items.length === 0) {
    return (
      <p className="text-xs text-zinc-500" role="status">
        Client logos are being updated. Please check back shortly.
      </p>
    );
  }
  return (
    <div
      className="grid grid-cols-2 items-center gap-x-6 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      role="list"
      aria-label="Client logos"
    >
      {items.map((logo) => (
        <div
          key={logo.id}
          role="listitem"
          title={logo.name}
          className="flex items-center justify-center opacity-80 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
        >
          <SmartImage
            src={logo.imageUrl}
            alt={logo.altText || `${logo.name} logo`}
            width={logo.width ?? 480}
            height={logo.height ?? 192}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw"
            loading="lazy"
            className="h-8 w-auto object-contain sm:h-10"
          />
        </div>
      ))}
    </div>
  );
}