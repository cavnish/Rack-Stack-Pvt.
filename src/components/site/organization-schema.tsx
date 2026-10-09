import { JsonLd } from "./ui";
import { absoluteUrl, siteOrigin } from "@/lib/site-url";
import type { siteSettings } from "@/db/schema";
type Settings = typeof siteSettings.$inferSelect;

/**
 * Site-wide structured data, emitted once from the site layout.
 *
 * Two blocks, both describing facts the visible site already states:
 *
 * - `Organization`/`LocalBusiness` from the real site settings (name, phone,
 *   email, address) plus the shipped logo, so search engines and knowledge
 *   panels can associate the brand mark with the entity. The logo falls back to
 *   the repository mark when no CMS logo is set, which is the same image the
 *   header renders.
 * - `WebSite` with a `SearchAction`, pointing at the site's real on-site search
 *   (`/search?q=`), so a search result can offer a sitelinks search box. The
 *   query parameter name matches the search page's `q` param exactly.
 *
 * Nothing here is invented: `settings.*` are the live CMS values and the
 * address region/postal code match the address rendered on the contact page.
 */
export function OrganizationSchema({ settings }: { settings: Settings }) {
  const logo = absoluteUrl(settings.logo || "/logo.png");
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": ["Organization", "LocalBusiness"],
          name: settings.companyName,
          url: siteOrigin(),
          logo,
          image: logo,
          email: settings.email,
          telephone: settings.primaryPhone,
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address,
            addressRegion: "Maharashtra",
            postalCode: "401208",
            addressCountry: "IN",
          },
          openingHours: "Mo-Fr 09:00-18:00",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: settings.companyName,
          url: siteOrigin(),
          potentialAction: {
            "@type": "SearchAction",
            target: `${absoluteUrl("/search")}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
    </>
  );
}
