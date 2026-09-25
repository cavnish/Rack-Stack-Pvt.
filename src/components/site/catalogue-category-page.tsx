import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/site/ui";
import { SmartImage } from "@/components/site/smart-image";
import { CatalogueProductBrowser } from "@/components/site/catalogue-product-browser";
import type { CatalogueCategory, CatalogueProduct } from "@/lib/catalogue";

export function CatalogueCategoryPage({ category, products }: { category: CatalogueCategory; products: readonly CatalogueProduct[] }) {
  return (
    <main>
      <section className="relative isolate overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-0 -z-20">
          <SmartImage src={category.image} alt={`Illustrative ${category.name.toLowerCase()} environment`} fill priority className="object-cover opacity-35" sizes="100vw" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/30" />
        <div className="container-shell flex min-h-[500px] flex-col justify-end py-16">
          <Breadcrumb items={[{ label: "Products", href: "/products" }, { label: category.name }]} />
          <p className="eyebrow mt-8 text-red-400">{category.eyebrow}</p>
          <h1 className="hero-heading mt-5 max-w-4xl text-balance">{category.title}</h1>
          <p className="hero-description mt-5 max-w-2xl text-zinc-300">{category.description}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="#catalogue" className="btn-primary">Explore Products <ArrowRight size={17} /></Link>
            <Link href="/request-a-quote" className="btn-light">Request a Quote</Link>
          </div>
        </div>
      </section>

      <section id="catalogue" className="bg-[#f4f4f1] py-20 lg:py-24">
        <div className="container-shell">
          <div className="max-w-3xl">
            <p className="eyebrow">{category.productCount} catalogue products</p>
            <h2 className="section-heading mt-5 text-balance">Choose a starting point</h2>
            <p className="section-description mt-5 text-zinc-600">Search by product, application, industry or product type. Share your project details and our team can confirm the final configuration.</p>
          </div>
          <div className="mt-10">
            <CatalogueProductBrowser products={products} lockedCategory={category.slug} />
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 py-16 text-white">
        <div className="container-shell grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="heading-md text-balance">Need a system configured around your site?</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">Share the available space, load, access and equipment details. We will help identify the right product and confirm what can be customized.</p>
          </div>
          <Link href="/request-a-quote" className="btn-primary shrink-0">Discuss Your Requirement <ArrowRight size={17} /></Link>
        </div>
      </section>
    </main>
  );
}
