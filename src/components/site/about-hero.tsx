import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageHero } from "@/components/site/ui";

/**
 * The About page hero.
 *
 * Delegates to the shared compact `PageHero` so the About page sits at exactly
 * the same height, scale and scrim as Contact, Projects, Services and Products.
 * The only difference is the photograph: it settles from a slight scale-down
 * over a long ease (`.about-hero-image`) — the same load language the homepage
 * hero uses, so the page still opens with a subtle motion that the other section
 * pages do not. The scale runs under `prefers-reduced-motion: no-preference`
 * only, so reduced-motion visitors get the settled photograph immediately.
 */
export function AboutHero({
  image,
  title,
  description,
  primary,
  secondary,
}: {
  image: string;
  title: string;
  description: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}) {
  return (
    <PageHero
      eyebrow="About Rack &amp; Stack"
      title={title}
      description={description}
      image={image}
      imageClassName="about-hero-image"
      actions={
        <>
          <Link href={primary.href} className="btn-primary">
            {primary.label} <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link href={secondary.href} className="btn-light">
            {secondary.label}
          </Link>
        </>
      }
    />
  );
}