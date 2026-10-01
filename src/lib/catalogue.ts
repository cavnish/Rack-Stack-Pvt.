/**
 * The product catalogue's public API.
 *
 * This used to be a 2,000-line file containing all thirty-two non-CMS products
 * as hardcoded TypeScript. Those products are now rows in `products`
 * (`scripts/import-catalogue-products.mts`), so the catalogue is derived from
 * the published payload and this file only re-exports it.
 *
 * The indirection is deliberate. Twenty-odd modules import from
 * `@/lib/catalogue`, and they should keep working while the data behind them
 * changed from a hardcoded array to published CMS content. The re-export keeps
 * that churn out of every call site, and leaves one obvious place to look for
 * where catalogue data actually comes from.
 *
 * ## Bundle warning
 *
 * This module reaches `products.json`, about a megabyte of product rows, so it
 * is server-side only. A client component that imports it ships the entire
 * catalogue to every visitor — which is exactly what the header, the product
 * card and the quote form used to do. Components that render in the browser must
 * import from `@/lib/catalogue-shared` instead (types, taxonomy and pure
 * helpers), or be handed the products they need as a prop by a server
 * component.
 *
 * @see ./published-catalogue.ts for the derivation and the reasoning.
 * @see ./catalogue-shared.ts for the data-free half.
 */

export {
  catalogueCategories,
  catalogueCategoryNames,
  catalogueCategorySlugs,
  catalogueProducts,
  getCatalogueApplications,
  getCatalogueCategory,
  getCatalogueIndustries,
  getCatalogueNavGroups,
  getCatalogueOptions,
  getCatalogueProductBySlug,
  getCatalogueProductHref,
  getCatalogueProductType,
  getCatalogueProductTypes,
  getCatalogueProductsByCategory,
  getCatalogueSearchText,
  getRelatedCatalogueProducts,
} from "@/lib/published-catalogue";

export { toBrowserCategories } from "@/lib/catalogue-shared";

export type {
  CatalogueCategory,
  CatalogueCategorySlug,
  CatalogueFeature,
  CatalogueImage,
  CatalogueProduct,
  CatalogueSeo,
  CatalogueSpecification,
} from "@/lib/catalogue-shared";
