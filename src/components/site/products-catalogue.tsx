"use client";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { ProductCard, type ProductCardProduct } from "@/components/site/product-card";
import type { CatalogueProduct } from "@/lib/data";

export function ProductsCatalogue({ products }: { products: CatalogueProduct[] }) {
  const reduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))), [products]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category && p.category !== category) return false;
      if (featuredOnly && !p.featured) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.shortDescription?.toLowerCase().includes(q) ||
        (p.keySpec?.name ?? "").toLowerCase().includes(q) ||
        (p.keySpec?.value ?? "").toLowerCase().includes(q) ||
        (p.applicationTitle ?? p.application ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, category, featuredOnly]);
  return (
    <>
      <div className="mt-10 flex flex-col gap-4">
        <div className="relative w-full max-w-md">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product, spec or use…"
            aria-label="Search products"
            className="w-full border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`px-4 py-2 text-xs font-bold transition-colors ${category === null ? "bg-zinc-950 text-white" : "border border-zinc-300 bg-white hover:border-zinc-500"}`}
          >
            All systems
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(category === c ? null : c)}
              className={`px-4 py-2 text-xs font-bold transition-colors ${category === c ? "bg-zinc-950 text-white" : "border border-zinc-300 bg-white hover:border-zinc-500"}`}
            >
              {c}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFeaturedOnly((v) => !v)}
            aria-pressed={featuredOnly}
            className={`px-4 py-2 text-xs font-bold transition-colors ${featuredOnly ? "bg-red-600 text-white" : "border border-zinc-300 bg-white hover:border-zinc-500"}`}
          >
            Featured only
          </button>
        </div>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product, i) => (
          <motion.div
            key={product.id}
            layout
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduced ? 0 : Math.min(i % 3, 2) * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProductCard product={product as ProductCardProduct} index={i} />
          </motion.div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="mt-8 border border-dashed border-zinc-300 bg-zinc-50 p-14 text-center">
          <h2 className="text-lg font-semibold">Nothing Matches Your Search</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">Try a different search term, or ask our team to recommend the right system for your load and space.</p>
        </div>
      )}
      <div className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-zinc-200 pt-8 text-sm text-zinc-600 sm:flex-row">
        <p>
          Showing <strong className="text-zinc-900">{filtered.length}</strong> of {products.length} systems
        </p>
        <p>Need a custom system? We&apos;ll design racking around your loads and bay layout.</p>
      </div>
    </>
  );
}