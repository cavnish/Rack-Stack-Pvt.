import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { Breadcrumb, SectionHeading } from "@/components/site/ui";
import { SmartImage } from "@/components/site/smart-image";
import { ProductsCatalogue } from "@/components/site/products-catalogue";
import { getProductCatalogue } from "@/lib/data";
import { optimizeImage } from "@/lib/image-utils";
export const metadata: Metadata = {
  title: "Products – Rack & Stack Storage Systems",
  description: "Explore configurable industrial racking, pallet racking, shelving, mezzanine floors and space optimisation systems engineered for warehouse operations.",
};
export default async function ProductsPage() {
  const products = await getProductCatalogue();
  const heroImage = optimizeImage(products[3]?.heroImage || products[0]?.heroImage || "", 1800);
  return (
    <main>
      <section className="relative isolate overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-0 -z-20">
          {heroImage ? <SmartImage src={heroImage} alt="" fill priority className="object-cover opacity-35" sizes="100vw" /> : null}
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/30" />
        <div className="container-shell flex min-h-[520px] flex-col justify-end py-16">
          <Breadcrumb items={[{ label: "Products" }]} />
          <p className="eyebrow mt-8 text-red-400">Industrial storage systems</p>
          <h1 className="heading-lg mt-5 max-w-4xl text-balance">Racking and shelving built around the way you operate.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            Configurable pallet racking, medium-duty shelving, slotted angle racks, mezzanine floors and space-optimisation systems — each engineered around your loads, handling equipment and bay layouts.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/request-a-quote" className="btn-primary">
              Request a quote <ArrowRight size={17} />
            </Link>
            <Link href="/catalog" className="btn-light">
              <Download size={16} /> Download catalog
            </Link>
          </div>
        </div>
      </section>
      <section className="bg-[#f4f4f1] py-20 lg:py-24">
        <div className="container-shell">
          <SectionHeading eyebrow="Explore the range" title="Find the system for your storage challenge." description="Search across the catalogue, filter by category, or compare closely related systems side by side." />
          <ProductsCatalogue products={products} />
        </div>
      </section>
    </main>
  );
}