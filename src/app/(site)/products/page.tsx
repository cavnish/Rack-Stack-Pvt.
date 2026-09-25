import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { Breadcrumb, SectionHeading } from "@/components/site/ui";
import { SmartImage } from "@/components/site/smart-image";
import { CatalogueProductBrowser } from "@/components/site/catalogue-product-browser";
import { catalogueCategories, catalogueProducts } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Products | Rack & Stack Storage Systems",
  description: "Explore 32 storage, racking, material-handling and workplace storage products from Rack & Stack.",
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  return (
    <main>
      <section className="relative isolate overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-0 -z-20">
          <SmartImage src={catalogueCategories[1].image} alt="Illustrative industrial storage environment" fill priority className="object-cover opacity-35" sizes="100vw" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/30" />
        <div className="container-shell flex min-h-[520px] flex-col justify-end py-16">
          <Breadcrumb items={[{ label: "Products" }]} />
          <p className="eyebrow mt-8 text-red-400">32-product catalogue</p>
          <h1 className="hero-heading mt-5 max-w-4xl text-balance">Storage and handling systems, clearly organised</h1>
          <p className="hero-description mt-5 max-w-2xl text-zinc-300">Browse office storage, industrial storage and material-handling equipment by product, application, industry or product type.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="#catalogue" className="btn-primary">Explore Products <ArrowRight size={17} /></Link>
            <Link href="/catalog" className="btn-light"><Download size={16} /> Download Catalog</Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f4f1] py-20 lg:py-24">
        <div className="container-shell">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <SectionHeading eyebrow="Explore the range" title="Find the right starting point" description="Use the catalogue information to shortlist a system, then share your site and load details for confirmation." />
            <div className="grid gap-3 sm:grid-cols-3 lg:w-[38rem]">
              {catalogueCategories.map((category) => (
                <Link key={category.slug} href={`/products/${category.slug}`} className="group border border-zinc-300 bg-white p-4 transition-colors hover:border-zinc-950">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-red-600">{category.productCount} products</span>
                  <span className="mt-3 block text-sm font-semibold text-zinc-900 group-hover:text-red-600">{category.name}</span>
                  <ArrowRight size={15} className="mt-5 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-red-600" />
                </Link>
              ))}
            </div>
          </div>
          <div id="catalogue" className="mt-12">
            <CatalogueProductBrowser products={catalogueProducts} initialCategory={category} />
          </div>
        </div>
      </section>
    </main>
  );
}
