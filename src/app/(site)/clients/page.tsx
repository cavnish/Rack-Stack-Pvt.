import type { Metadata } from "next";
import { getClientLogos, getGallery } from "@/lib/data";
import { CTASection, PageHero, SectionHeading } from "@/components/site/ui";
import { ClientLogoMarquee } from "@/components/site/client-logo-marquee";

const CLIENTS_DESCRIPTION =
  "Organizations on the official Rack & Stack client list — the businesses that trust our industrial storage and warehouse racking systems.";

export const metadata: Metadata = {
  title: "Clients",
  description: CLIENTS_DESCRIPTION,
  alternates: { canonical: "/clients" },
  openGraph: {
    title: "Our Clients",
    description: CLIENTS_DESCRIPTION,
    url: "/clients",
    siteName: "Rack & Stack Storage Systems",
    type: "website",
  },
  twitter: { card: "summary", title: "Our Clients", description: CLIENTS_DESCRIPTION },
};

export default async function ClientsPage() {
  const [logos, gallery] = await Promise.all([getClientLogos(), getGallery()]);
  return (
    <main>
      <PageHero
        title="Our Valued Clients"
        description="The organizations below are from the official Rack & Stack client list. This is our published roster only — it does not imply any specific project or endorsement."
        image={gallery[0]?.imageUrl}
      />
      <section className="bg-[#f4f4f1] py-14">
        <div className="container-shell">
          <SectionHeading
            eyebrow="Official client list"
            title="Who We Work With"
            description="A clear view of the organizations that make up our published client roster."
          />
          <div className="mt-12">
            <ClientLogoMarquee logos={logos} showNames />
          </div>
        </div>
      </section>
      <CTASection title="Talk to Us About Your Storage Needs" />
    </main>
  );
}
