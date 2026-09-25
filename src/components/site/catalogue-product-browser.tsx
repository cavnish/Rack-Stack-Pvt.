"use client";

import { useId, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw, Search } from "lucide-react";
import { CatalogueProductCard } from "@/components/site/catalogue-product-card";
import {
  catalogueCategories,
  catalogueCategoryNames,
  getCatalogueApplications,
  getCatalogueCategory,
  getCatalogueIndustries,
  getCatalogueProductType,
  getCatalogueProductTypes,
  getCatalogueSearchText,
  type CatalogueProduct,
} from "@/lib/catalogue";

type CatalogueProductBrowserProps = {
  products: readonly CatalogueProduct[];
  lockedCategory?: string;
  initialCategory?: string;
};

type SortOption = "featured" | "az";

export function CatalogueProductBrowser({ products, lockedCategory, initialCategory }: CatalogueProductBrowserProps) {
  const filterId = useId();
  const reducedMotion = useReducedMotion();
  const initialCategoryValue = initialCategory && getCatalogueCategory(initialCategory) ? initialCategory : "all";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategoryValue);
  const [application, setApplication] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [productType, setProductType] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("featured");

  const effectiveCategory = lockedCategory ?? category;
  const applications = useMemo(() => getCatalogueApplications(products), [products]);
  const industries = useMemo(() => getCatalogueIndustries(products), [products]);
  const productTypes = useMemo(() => getCatalogueProductTypes(products), [products]);
  const lockedCategoryName = lockedCategory
    ? catalogueCategoryNames[lockedCategory as keyof typeof catalogueCategoryNames] ??
      getCatalogueCategory(lockedCategory)?.name ??
      lockedCategory
    : "";

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      if (effectiveCategory && product.category !== effectiveCategory) return false;
      if (application !== "all" && !product.applications.includes(application)) return false;
      if (industry !== "all" && !product.industries.includes(industry)) return false;
      if (productType !== "all" && getCatalogueProductType(product) !== productType) return false;
      if (featuredOnly && !product.featured) return false;
      if (!normalizedQuery) return true;
      return getCatalogueSearchText(product).includes(normalizedQuery);
    });

    return [...filtered].sort((first, second) => {
      if (sort === "featured" && first.featured !== second.featured) {
        return first.featured ? -1 : 1;
      }
      return first.name.localeCompare(second.name);
    });
  }, [application, effectiveCategory, featuredOnly, industry, productType, products, query, sort]);

  const hasFilters = Boolean(
    query ||
      application !== "all" ||
      industry !== "all" ||
      productType !== "all" ||
      featuredOnly ||
      (!lockedCategory && category !== "all"),
  );

  function resetFilters() {
    setQuery("");
    if (!lockedCategory) setCategory("all");
    setApplication("all");
    setIndustry("all");
    setProductType("all");
    setFeaturedOnly(false);
    setSort("featured");
  }

  const categorySelectId = `${filterId}-category`;
  const applicationSelectId = `${filterId}-application`;
  const industrySelectId = `${filterId}-industry`;
  const productTypeSelectId = `${filterId}-product-type`;
  const featuredId = `${filterId}-featured`;
  const sortId = `${filterId}-sort`;

  return (
    <div aria-label="Catalogue product browser">
      <div className="border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
          <div>
            <label className="form-label" htmlFor={`${filterId}-search`}>
              Search products
            </label>
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
              <input
                id={`${filterId}-search`}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="form-field pl-11"
                placeholder="Search by product, application or specification"
                autoComplete="off"
                aria-controls="catalogue-results"
              />
            </div>
          </div>
          <div>
            <label className="form-label" htmlFor={sortId}>
              Sort products
            </label>
            <select id={sortId} value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="form-field">
              <option value="featured">Featured</option>
              <option value="az">A-Z</option>
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div>
            <label className="form-label" htmlFor={categorySelectId}>
              Category
            </label>
            <select
              id={categorySelectId}
              value={effectiveCategory}
              onChange={(event) => setCategory(event.target.value)}
              disabled={Boolean(lockedCategory)}
              aria-describedby={lockedCategory ? `${filterId}-locked-category` : undefined}
              className="form-field disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-600"
            >
              <option value="all">All categories</option>
              {catalogueCategories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            {lockedCategory ? (
              <p id={`${filterId}-locked-category`} className="mt-1.5 text-xs leading-5 text-zinc-600">
                Locked to {lockedCategoryName}
              </p>
            ) : null}
          </div>

          <div>
            <label className="form-label" htmlFor={applicationSelectId}>
              Application
            </label>
            <select
              id={applicationSelectId}
              value={application}
              onChange={(event) => setApplication(event.target.value)}
              className="form-field"
            >
              <option value="all">All applications</option>
              {applications.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor={industrySelectId}>
              Industry
            </label>
            <select
              id={industrySelectId}
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              className="form-field"
            >
              <option value="all">All industries</option>
              {industries.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor={productTypeSelectId}>
              Product type
            </label>
            <select
              id={productTypeSelectId}
              value={productType}
              onChange={(event) => setProductType(event.target.value)}
              className="form-field"
            >
              <option value="all">All product types</option>
              {productTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label
              htmlFor={featuredId}
              className="flex min-h-[3.25rem] w-full cursor-pointer items-center gap-3 border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-600"
            >
              <input
                id={featuredId}
                type="checkbox"
                checked={featuredOnly}
                onChange={(event) => setFeaturedOnly(event.target.checked)}
                className="h-4 w-4 accent-red-600"
              />
              Featured only
            </label>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-zinc-600" role="status" aria-live="polite" aria-atomic="true">
        Showing <strong className="text-zinc-950">{visibleProducts.length}</strong> of {products.length}{" "}
        {products.length === 1 ? "product" : "products"}
      </p>

      {visibleProducts.length > 0 ? (
        <motion.div
          id="catalogue-results"
          layout={!reducedMotion}
          className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {visibleProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout={!reducedMotion}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.34,
                  delay: reducedMotion ? 0 : Math.min(index % 3, 2) * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <CatalogueProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="mt-6 border border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center" role="status">
          <h2 className="text-xl font-semibold text-zinc-950">No products match these filters</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-600">
            Try a broader search or clear the filters to review the complete catalogue.
          </p>
          {hasFilters ? (
            <button type="button" onClick={resetFilters} className="btn-secondary mt-6">
              <RotateCcw size={16} aria-hidden="true" /> Clear filters
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
