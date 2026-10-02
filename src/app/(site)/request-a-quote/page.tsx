import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { getProducts, getServices } from "@/lib/data";
import { catalogueProducts } from "@/lib/catalogue";
import { InquiryForm } from "@/components/site/inquiry-form";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";

/**
 * ISR window, matching the rest of the public site.
 *
 * Without it a route that is no longer forced dynamic by `searchParams` would be
 * rendered once and then never refreshed, so a product added in the admin would
 * not appear in this page's dropdowns until a redeploy.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Share your storage, racking, shelving or mezzanine requirement with Rack & Stack.",
};

/**
 * No `searchParams` here any more.
 *
 * The page used to `await searchParams` only to pre-select a product or service
 * from `?product=` / `?service=`. Awaiting it forced the route to render
 * dynamically on every request. `InquiryForm` now reads those two parameters and
 * resolves them against the option lists it is already given, so the deep links
 * behave identically while this page can be prerendered from published data.
 */
export default async function QuotePage() {
  const [products, services] = await Promise.all([getProducts(), getServices()]);
  const productOptions = [...catalogueProducts, ...products].filter((product, index, allProducts) => allProducts.findIndex((candidate) => candidate.slug === product.slug) === index);

  return (
    /*
     * Capped at 5xl rather than the full 1280px container. The form is the
     * working part of this page, and at full container width its two columns
     * read as a stretched web form instead of a quote sheet; the heading column
     * keeps its own width and the pair still sits centred on the page.
     */
    <main className="bg-[#f4f4f1] py-14 lg:py-20">
      <div className="container-shell">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-12">
          <div>
            <p className="eyebrow">Request a quote</p>
            <h1 className="section-heading mt-5">Let&apos;s Plan Your Requirement</h1>
            <p className="section-description mt-4 text-zinc-600">Tell us what you know today. We&apos;ll help fill in any missing sizes, load details or site information before we prepare a quote.</p>
            <Stagger className="mt-7 space-y-3">
              {["Your details are stored securely", "Your selected product or service is added automatically", "You'll get a confirmation once email is set up", "No obligation — sending the form is free"].map((item) => (
                <StaggerItem key={item}>
                  <p className="flex gap-3 text-sm"><CheckCircle2 size={17} className="shrink-0 text-red-600" />{item}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
          <Reveal>
            <div className="bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,.08)] sm:p-7">
              <h2 className="heading-md">Requirement Details</h2>
              <p className="mt-1.5 text-sm text-zinc-500">Fields marked * are required.</p>
              <div className="mt-6">
                {/* Suspense boundary so the form's `useSearchParams` does not force
                    this route to render dynamically. */}
                <Suspense fallback={<div className="h-[420px] w-full animate-pulse rounded bg-zinc-50" aria-hidden="true" />}>
                  <InquiryForm products={productOptions} services={services} />
                </Suspense>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
