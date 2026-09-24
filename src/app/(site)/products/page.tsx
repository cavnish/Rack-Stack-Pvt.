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
  description: "Explore our racking, pallet racking, shelving, mezzanine floors and space-saving systems — built for real warehouse work.",
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
          <h1 className="hero-heading mt-5 text-balance">Storage Built Around the Way You Work</h1>
          <p className="hero-description mt-5 text-zinc-300">
            Pallet racking, shelving, mezzanine floors and space-saving systems — all built for your loads, equipment and layout.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/request-a-quote" className="btn-primary">
              Request a Quote <ArrowRight size={17} />
            </Link>
            <Link href="/catalog" className="btn-light">
              <Download size={16} /> Download Catalog
            </Link>
          </div>
        </div>
      </section>
      <section className="bg-[#f4f4f1] py-20 lg:py-24">
        <div className="container-shell">
          <SectionHeading eyebrow="Explore the range" title="Find the Right System" description="Search the catalogue, filter by category and compare systems side by side." />
          <ProductsCatalogue products={products} />
        </div>
      </section>
    </main>
  );
}