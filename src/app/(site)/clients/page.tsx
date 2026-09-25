import type { Metadata } from "next";
import { getGallery } from "@/lib/data";
import { getPublicClientLogos } from "@/lib/client-assets";
import { CTASection, PageHero, SectionHeading } from "@/components/site/ui";
import { ClientLogoMarquee } from "@/components/site/client-logo-marquee";

export const metadata: Metadata = {
  title: "Clients",
  description: "Organizations on the official Rack & Stack client list.",
};

export default async function ClientsPage() {
  const [logos, gallery] = await Promise.all([getPublicClientLogos(), getGallery()]);
  return (
    <main>
      <PageHero
        eyebrow="Clients"
        title="Our Valued Clients"
        description="The organizations below are from the official Rack & Stack client list. This is our published roster only — it does not imply any specific project or endorsement."
        image={gallery[0]?.imageUrl}
        breadcrumb={[{ label: "Clients" }]}
      />
      <section className="bg-[#f4f4f1] py-24">
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
