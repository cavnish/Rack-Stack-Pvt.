"use client";

import Link from "next/link";
import { ChevronDown, Download, Mail, Menu, MessageCircle, Phone, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "./logo";
import {
  catalogueCategories,
  getCatalogueProductHref,
  getCatalogueProductsByCategory,
} from "@/lib/catalogue";

const catalogueDownloadHref = "/Rack%20%26%20Stack%20_Brochure%20(1).pdf";

export function Header({ phone, whatsapp }: { phone: string; whatsapp: string }) {
  const [mobile, setMobile] = useState(false);
  const [mega, setMega] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 20);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobile]);

  const groups = useMemo(
    () => catalogueCategories.map((category) => ({ category, products: getCatalogueProductsByCategory(category.slug) })),
    [],
  );

  return (
    <header className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur-xl transition-shadow ${scrolled ? "border-zinc-200 shadow-[0_8px_30px_rgba(0,0,0,.06)]" : "border-zinc-200"}`}>
      <div className="hidden bg-zinc-950 py-2 text-[.7rem] font-medium text-zinc-300 lg:block">
        <div className="container-shell flex justify-between">
          <span className="flex min-w-0 items-center gap-2">
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-red-500" />
            <span>Storage and material-handling systems planned around your business</span>
          </span>
          <div className="flex shrink-0 items-center gap-6">
            <a href="mailto:info@rackandstack.in" className="flex items-center gap-2 hover:text-white"><Mail size={13} />info@rackandstack.in</a>
            <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white"><MessageCircle size={13} />{whatsapp}</a>
          </div>
        </div>
      </div>
      <div className="container-shell flex h-[72px] items-center justify-between">
        <Logo />
        <nav aria-label="Main navigation" className="hidden h-full items-center gap-7 lg:flex">
          <div className="h-full" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
            <button
              className="flex h-full items-center gap-1 text-sm font-bold text-zinc-700 hover:text-red-700"
              onClick={() => setMega((value) => !value)}
              aria-expanded={mega}
              aria-controls="products-menu"
            >
              Products <ChevronDown size={14} />
            </button>
            {mega ? (
              <div id="products-menu" className="absolute left-0 right-0 top-full border-y border-zinc-200 bg-white shadow-2xl">
                <div className="container-shell grid grid-cols-[.65fr_1fr_1fr_1fr] gap-8 py-9">
                  <div className="bg-zinc-950 p-6 text-white">
                    <p className="text-[.65rem] font-bold uppercase tracking-[.18em] text-red-400">Product catalogue</p>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight">Built for your loads, space and access.</h2>
                    <Link onClick={() => setMega(false)} href="/products" className="mt-8 inline-flex border-b border-red-500 pb-1 text-xs font-bold">View all products →</Link>
                  </div>
                  {groups.map(({ category, products }) => (
                    <div key={category.slug}>
                      <Link onClick={() => setMega(false)} href={`/products/${category.slug}`} className="mb-4 block text-[.67rem] font-extrabold uppercase tracking-[.14em] text-zinc-500 hover:text-red-600">
                        {category.name}
                      </Link>
                      <div className="space-y-1">
                        {products.slice(0, 5).map((item) => (
                          <Link key={item.id} onClick={() => setMega(false)} href={getCatalogueProductHref(item)} className="block border-l-2 border-transparent px-3 py-2 hover:border-red-600 hover:bg-zinc-50">
                            <span className="block text-sm font-semibold">{item.name}</span>
                            <span className="mt-1 line-clamp-1 text-[.68rem] text-zinc-500">{item.shortDescription}</span>
                          </Link>
                        ))}
                      </div>
                      <Link onClick={() => setMega(false)} href={`/products/${category.slug}`} className="mt-3 inline-block px-3 text-xs font-bold text-red-600">See all {category.productCount} →</Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          {[['Services', '/services'], ['Industries', '/industries'], ['Projects', '/projects'], ['About', '/about'], ['Resources', '/blog']].map(([label, href]) => (
            <Link key={href} href={href} className="text-sm font-bold text-zinc-700 hover:text-red-700">{label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/search" aria-label="Search website" className="hidden h-10 w-10 place-items-center text-zinc-700 hover:bg-zinc-100 sm:grid"><Search size={18} /></Link>
          <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hidden h-10 w-10 place-items-center text-zinc-700 hover:bg-zinc-100 md:grid"><MessageCircle size={18} /></a>
          <a href={catalogueDownloadHref} download className="hidden items-center gap-2 px-2 text-[.72rem] font-bold text-zinc-700 hover:text-red-700 xl:flex"><Download size={15} /> Catalogue</a>
          <button className="grid h-11 w-11 place-items-center lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu"><Menu /></button>
        </div>
      </div>
      {mobile ? (
        <div className="fixed inset-0 z-[70] min-h-screen overflow-y-auto bg-zinc-950 text-white lg:hidden">
          <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5">
            <Logo light />
            <button onClick={() => setMobile(false)} aria-label="Close menu"><X /></button>
          </div>
          <nav className="px-5 py-8">
            <p className="mb-4 text-[.64rem] font-bold uppercase tracking-[.18em] text-zinc-500">Product catalogue</p>
            <div className="space-y-6">
              {groups.map(({ category, products }) => (
                <div key={category.slug}>
                  <Link onClick={() => setMobile(false)} href={`/products/${category.slug}`} className="block border-b border-white/10 pb-2 text-base font-semibold text-white">{category.name}</Link>
                  <div className="mt-2 space-y-1">
                    {products.map((item) => (
                      <Link onClick={() => setMobile(false)} key={item.id} href={getCatalogueProductHref(item)} className="block py-2 text-sm text-zinc-300">{item.name}</Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-px bg-white/10">
              {[['Services', '/services'], ['Industries', '/industries'], ['Projects', '/projects'], ['About', '/about'], ['Resources', '/blog'], ['Contact', '/contact']].map(([label, href]) => (
                <Link onClick={() => setMobile(false)} href={href} key={href} className="bg-zinc-950 p-4 text-sm font-semibold">{label}</Link>
              ))}
            </div>
            <a onClick={() => setMobile(false)} href={catalogueDownloadHref} download className="btn-light mt-8 w-full"><Download size={16} /> Download Catalogue</a>
            <div className="mt-4 flex gap-2">
              <a className="btn-light flex-1" href={`tel:${phone.replace(/\s/g, "")}`}><Phone size={16} /> Call</a>
              <Link onClick={() => setMobile(false)} className="btn-light flex-1" href="/search"><Search size={16} /> Search</Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
