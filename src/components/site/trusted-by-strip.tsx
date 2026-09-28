import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ClientLogoMarquee, type ClientLogo } from "@/components/site/client-logo-marquee";

/**
 * The "Trusted by businesses across India" logo strip.
 *
 * Lives here rather than inline in the homepage because the product pages carry
 * the same section: a single component means the eyebrow, the "See Our Clients"
 * link and the card marquee stay identical everywhere, instead of drifting into
 * three slightly different treatments.
 *
 * Renders nothing when there is no logo to show, so an empty CMS roster leaves
 * no orphaned heading.
 */
export function TrustedByStrip({
  logos,
  className = "border-b border-zinc-200",
}: {
  logos: ClientLogo[];
  /** Section edge treatment; the product pages sit between two sections. */
  className?: string;
}) {
  if (!logos.some((logo) => logo.imageUrl)) return null;

  return (
    <section className={`bg-white py-8 sm:py-10 ${className}`}>
      <div className="container-shell">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="eyebrow">Trusted by businesses across India</p>
          <Link
            href="/clients"
            className="group ml-auto inline-flex items-center gap-1.5 text-[.7rem] font-bold text-zinc-500 transition-colors duration-200 hover:text-[var(--red)] sm:text-[.75rem]"
          >
            <span className="relative">
              See Our Clients
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />
            </span>
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
        <div className="mt-6 sm:mt-7">
          <ClientLogoMarquee logos={logos} cards />
        </div>
      </div>
    </section>
  );
}
