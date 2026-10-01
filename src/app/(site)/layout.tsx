import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Header, type HeaderNavCategory } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { SiteLoader } from "@/components/site/site-loader";
import { CookieConsent } from "@/components/site/cookie-consent";
import { FloatingActions } from "@/components/site/floating-actions";
import { OrganizationSchema } from "@/components/site/organization-schema";
import { getSiteSettings } from "@/lib/data";
import { getCatalogueNavGroups } from "@/lib/published-catalogue";

// Settings resolve from the published static JSON first, so the shell can be
// cached and revalidated on demand instead of re-rendered on every request.
export const revalidate = 3600;

/**
 * The navigation tree, narrowed to exactly what the header renders.
 *
 * `getCatalogueNavGroups` reads the published catalogue on the server. Passing
 * the result down as a prop is what keeps the header interactive without putting
 * the catalogue in the browser bundle — the header is a client component, so an
 * import of the catalogue from it would ship the whole product payload to every
 * visitor on every page.
 *
 * The mapping is also what keeps the prop honest: `eyebrow`, `title`,
 * `description`, `image`, `order` and `seo` are carried on the server's category
 * record but never drawn in the menu, so they are dropped here rather than
 * serialised into the RSC payload of every page in the site.
 */
function headerCategories(): HeaderNavCategory[] {
  return getCatalogueNavGroups().map(({ slug, name, productCount, products }) => ({
    slug,
    name,
    productCount,
    products: products.map(({ id, slug: productSlug, name: productName, href, category, shortDescription }) => ({
      id,
      slug: productSlug,
      name: productName,
      href,
      category,
      shortDescription,
    })),
  }));
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  if (!settings) notFound();
  const groups = headerCategories();

  return (
    <>
      <SiteLoader />
      <OrganizationSchema settings={settings} />
      <Header phone={settings.primaryPhone} whatsapp={settings.whatsapp} groups={groups} />
      {children}
      <Footer settings={settings} />
      <CookieConsent />
      <FloatingActions phone={settings.primaryPhone} whatsapp={settings.whatsapp} />
    </>
  );
}
