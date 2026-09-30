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
 * @see ./published-catalogue.ts for the derivation and the reasoning.
 */

export {
  catalogueCategories,
  catalogueCategoryNames,
  catalogueCategorySlugs,
  catalogueProducts,
  getCatalogueApplications,
  getCatalogueCategory,
  getCatalogueIndustries,
  getCatalogueProductBySlug,
  getCatalogueProductHref,
  getCatalogueProductType,
  getCatalogueProductTypes,
  getCatalogueProductsByCategory,
  getCatalogueSearchText,
  getRelatedCatalogueProducts,
} from "@/lib/published-catalogue";

export type {
  CatalogueCategory,
  CatalogueCategorySlug,
  CatalogueFeature,
  CatalogueImage,
  CatalogueProduct,
  CatalogueSeo,
  CatalogueSpecification,
} from "@/lib/published-catalogue";
