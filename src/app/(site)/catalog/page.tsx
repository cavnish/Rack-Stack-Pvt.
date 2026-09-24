import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { CatalogDownload } from "@/components/site/catalog-download";
import { PageHero, ProductCard, SectionHeading } from "@/components/site/ui";
import { Stagger, StaggerItem } from "@/components/site/reveal";
import { getGallery, getProducts, getSiteSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Industrial Storage Product Catalog",
  description: "See our racking, shelving, mezzanine, compactor and workplace storage ranges — and download the catalog when available.",
  alternates: { canonical: "/catalog" },
};

export default async function CatalogPage() {
  const [settings, products, gallery] = await Promise.all([getSiteSettings(), getProducts(), getGallery()]);
  if (!settings) notFound();
  const categories = Array.from(new Set(products.map((product) => product.category)));
  return <main>
    <PageHero eyebrow="Product catalog" title={settings.catalogTitle} description={settings.catalogDescription} image={gallery[0]?.imageUrl || products[0]?.heroImage} breadcrumb={[{ label: "Catalog" }]}/>
    <section className="py-24"><div className="container-shell grid gap-14 lg:grid-cols-[.75fr_1.25fr]">
      <div><p className="eyebrow">Download</p><h2 className="section-heading mt-5 text-balance">Keep Our Full Product Range at Hand</h2><p className="section-description mt-5 text-zinc-600">The catalog introduces our system categories. Final sizes, loads, accessories and fit are confirmed for your project.</p><ul className="mt-8 space-y-3">{["Racking and shelving categories","Space optimization systems","Workplace storage options","A clear next step to discuss your setup"].map((item)=><li key={item} className="flex items-center gap-3 text-sm"><CheckCircle2 size={17} className="text-red-600"/>{item}</li>)}</ul></div>
      <div className="surface-grid border border-zinc-200 bg-[#f4f4f1] p-7 sm:p-10"><span className="grid h-12 w-12 place-items-center bg-zinc-950 text-white"><BookOpen size={21}/></span><h2 className="card-title mt-7">{settings.catalogTitle}</h2><p className="mt-3 text-sm leading-6 text-zinc-600">{settings.catalogLeadGated ? "Enter your details to download the latest catalog." : "Download the catalog now."}</p><div className="mt-7"><CatalogDownload available={Boolean(settings.brochureUrl)} gated={settings.catalogLeadGated}/></div></div>
    </div></section>
    <section className="surface-grid bg-[#f4f4f1] py-24"><div className="container-shell"><SectionHeading eyebrow="Catalog overview" title="Product Categories for Every Storage Need"/><Stagger className="mt-10 grid gap-px bg-zinc-300 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category)=><StaggerItem key={category} className="h-full"><Link href={`/products?category=${encodeURIComponent(category)}`} className="group flex h-full flex-col bg-white p-7 hover:bg-zinc-950 hover:text-white"><h3 className="text-xl font-semibold">{category}</h3><p className="mt-2 text-sm text-zinc-500 group-hover:text-zinc-400">{products.filter((product)=>product.category===category).length} systems</p><ArrowRight size={17} className="mt-8 text-red-600 transition-transform group-hover:translate-x-1"/></Link></StaggerItem>)}</Stagger></div></section>
    <section className="py-24"><div className="container-shell"><SectionHeading eyebrow="Explore online" title="See Full Details on Our Product Pages"/><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{products.slice(0,4).map((product,index)=><ProductCard key={product.id} product={product} index={index}/>)}</div></div></section>
    <section className="dark-grid bg-zinc-950 py-20 text-white"><div className="container-shell flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><p className="eyebrow text-red-400">Need help choosing?</p><h2 className="section-heading mt-5">The Catalog Starts the Conversation. Your Business Shapes the System.</h2></div><Link href="/request-a-quote" className="btn-primary shrink-0">Request a Quote <ArrowRight size={17}/></Link></div></section>
  </main>;
}
