import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/site/ui";
import { CatalogueProductBrowser } from "@/components/site/catalogue-product-browser";
import { CatalogueProductBrowserFallback } from "@/components/site/catalogue-product-browser-fallback";
import { TrustedByStrip } from "@/components/site/trusted-by-strip";
import { ReelShowcase } from "@/components/media/reel-showcase";
import { catalogueCategories, catalogueProducts, toBrowserCategories } from "@/lib/catalogue";
import { getClientLogos, getProductsReelVideos } from "@/lib/data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Products",
  description: "Explore 32 storage, racking, material-handling and workplace storage products from Rack & Stack.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: "Products",
    description: "Explore 32 storage, racking, material-handling and workplace storage products from Rack & Stack.",
    url: "/products",
    siteName: "Rack & Stack Storage Systems",
    type: "website",
    images: [{ url: catalogueCategories[1].image, alt: "Industrial storage environment" }],
  },
  twitter: { card: "summary_large_image", title: "Products", description: "Explore 32 storage, racking, material-handling and workplace storage products from Rack & Stack." },
};

/**
 * No `searchParams` here any more.
 *
 * The page used to `await searchParams` purely to hand `?category=` to the
 * catalogue browser, which made the route dynamic: nothing was prerendered, so
 * every visit rebuilt the page, and on a cold start that meant re-reading the
 * catalogue plus the reel videos and client logos. The query string is now read
 * by the browser component, wrapped in Suspense below so this stays statically
 * rendered while `/products?category=industrial-storage` still opens on that tab.
 */
export default async function ProductsPage() {
  const [reels, logos] = await Promise.all([
    getProductsReelVideos(10),
    getClientLogos(),
  ]);
  return (
    <main>
      <PageHero
        eyebrow="32-product catalogue"
        title="Storage and handling systems, clearly organised"
        description="Browse office storage, industrial storage and material-handling equipment by product, application, industry or product type."
        image={catalogueCategories[1].image}
        actions={
          <>
            <Link href="#catalogue" className="btn-primary">Explore Products <ArrowRight size={17} /></Link>
            <Link href="/rack-and-stack-brochure.pdf" download className="btn-light"><Download size={16} /> Download Catalog</Link>
          </>
        }
      />

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
            {/* `useSearchParams` in the browser needs a Suspense boundary for the
                page to stay statically rendered. The fallback matches the
                unfiltered grid the component shows first anyway. */}
            <Suspense fallback={<CatalogueProductBrowserFallback />}>
              <CatalogueProductBrowser products={catalogueProducts} categories={toBrowserCategories(catalogueCategories)} />
            </Suspense>
          </div>
        </div>
      </section>

      <TrustedByStrip logos={logos} className="border-y border-zinc-200" />

      <ReelShowcase
        videos={reels}
        subtitle="Our systems on site — installed, loaded and working in live warehouses."
        cta={{ label: "Request a Quote", href: "/request-a-quote" }}
      />
    </main>
  );
}
