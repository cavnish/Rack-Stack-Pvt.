import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";
import { FitHeading } from "@/components/site/fit-heading";
import { CatalogueProductBrowser } from "@/components/site/catalogue-product-browser";
import { CatalogueProductBrowserFallback } from "./catalogue-product-browser-fallback";
import { TrustedByStrip } from "@/components/site/trusted-by-strip";
import type { ClientLogo } from "@/components/site/client-logo-marquee";
import { catalogueCategories, toBrowserCategories, type CatalogueCategory, type CatalogueProduct } from "@/lib/catalogue";

export function CatalogueCategoryPage({ category, products, logos }: { category: CatalogueCategory; products: readonly CatalogueProduct[]; logos: ClientLogo[] }) {
  return (
    <main>
      <section className="relative isolate overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-0 -z-20">
          <SmartImage src={category.image} alt={`Illustrative ${category.name.toLowerCase()} environment`} fill priority className="object-cover opacity-35" sizes="100vw" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/30" />
        <div className="container-shell flex min-h-[500px] flex-col justify-end py-16">
          <p className="eyebrow text-red-400">{category.eyebrow}</p>
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
            <FitHeading className="section-heading mt-5 text-balance">Choose a starting point</FitHeading>
            <p className="section-description mt-5 text-zinc-600">Search by product, application, industry or product type. Share your project details and our team can confirm the final configuration.</p>
          </div>
          <div className="mt-10">
            {/* Suspense boundary required because the browser reads `?category=`
                with `useSearchParams`; without it this route cannot be
                prerendered. The category is locked, so the fallback's unfiltered
                grid is immediately replaced by the single-category one. */}
            <Suspense fallback={<CatalogueProductBrowserFallback rows={3} />}>
              <CatalogueProductBrowser products={products} categories={toBrowserCategories(catalogueCategories)} lockedCategory={category.slug} />
            </Suspense>
          </div>
        </div>
      </section>

      <TrustedByStrip logos={logos} className="border-y border-zinc-200" />

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
