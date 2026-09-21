import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { CatalogDownload } from "@/components/site/catalog-download";
import { PageHero, ProductCard, SectionHeading } from "@/components/site/ui";
import { getGallery, getProducts, getSiteSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Industrial Storage Product Catalog",
  description: "Explore Rack & Stack racking, shelving, mezzanine, compactor and workplace storage categories and download the current catalog when available.",
  alternates: { canonical: "/catalog" },
};

export default async function CatalogPage() {
  const [settings, products, gallery] = await Promise.all([getSiteSettings(), getProducts(), getGallery()]);
  if (!settings) notFound();
  const categories = Array.from(new Set(products.map((product) => product.category)));
  return <main>
    <PageHero eyebrow="Product catalog" title={settings.catalogTitle} description={settings.catalogDescription} image={gallery[0]?.imageUrl || products[0]?.heroImage} breadcrumb={[{ label: "Catalog" }]}/>
    <section className="py-24"><div className="container-shell grid gap-14 lg:grid-cols-[.75fr_1.25fr]">
      <div><p className="eyebrow">Download</p><h2 className="heading-md mt-5">Keep the product range available for planning conversations.</h2><p className="mt-5 leading-8 text-zinc-600">The catalog introduces system categories. Final dimensions, loading, accessories and suitability are confirmed against project-specific information.</p><ul className="mt-8 space-y-3">{["Racking and shelving categories","Space optimization systems","Workplace storage options","A clear path to discuss configuration"].map((item)=><li key={item} className="flex items-center gap-3 text-sm"><CheckCircle2 size={17} className="text-red-600"/>{item}</li>)}</ul></div>
      <div className="surface-grid border border-zinc-200 bg-[#f4f4f1] p-7 sm:p-10"><span className="grid h-12 w-12 place-items-center bg-zinc-950 text-white"><BookOpen size={21}/></span><h2 className="mt-7 text-2xl font-semibold">{settings.catalogTitle}</h2><p className="mt-3 text-sm leading-6 text-zinc-600">{settings.catalogLeadGated ? "Enter your business details to access the current catalog." : "Download the current catalog directly."}</p><div className="mt-7"><CatalogDownload available={Boolean(settings.brochureUrl)} gated={settings.catalogLeadGated}/></div></div>
    </div></section>
    <section className="surface-grid bg-[#f4f4f1] py-24"><div className="container-shell"><SectionHeading eyebrow="Catalog overview" title="Product categories for different storage priorities."/><div className="mt-10 grid gap-px bg-zinc-300 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category)=><Link href={`/products?category=${encodeURIComponent(category)}`} key={category} className="group bg-white p-7 hover:bg-zinc-950 hover:text-white"><h3 className="text-xl font-semibold">{category}</h3><p className="mt-2 text-sm text-zinc-500 group-hover:text-zinc-400">{products.filter((product)=>product.category===category).length} published systems</p><ArrowRight size={17} className="mt-8 text-red-600 transition-transform group-hover:translate-x-1"/></Link>)}</div></div></section>
    <section className="py-24"><div className="container-shell"><SectionHeading eyebrow="Explore online" title="Product pages provide the current CMS detail."/><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{products.slice(0,4).map((product,index)=><ProductCard key={product.id} product={product} index={index}/>)}</div></div></section>
    <section className="dark-grid bg-zinc-950 py-20 text-white"><div className="container-shell flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><p className="eyebrow text-red-400">Project-specific support</p><h2 className="heading-lg mt-5">A catalog starts the conversation. Your operation defines the system.</h2></div><Link href="/request-a-quote" className="btn-primary shrink-0">Request a Quote <ArrowRight size={17}/></Link></div></section>
  </main>;
}
