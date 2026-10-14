import type { MetadataRoute } from "next";
import { getBlogPosts, getIndustries, getPage, getPageSlugs, getProducts, getProjects, getServices } from "@/lib/data";
import { catalogueCategories, catalogueProducts, getCatalogueProductHref } from "@/lib/catalogue";
import { canonicalPath, siteOrigin } from "@/lib/site-url";

/**
 * `sitemap.xml`, built only from canonical, indexable HTTPS `www` URLs.
 *
 * The rules this file enforces, and why:
 *
 *  - One host. Every URL is assembled from `siteOrigin()`, which normalises any
 *    configured apex/HTTP value to `https://www.rackandstack.in`, so the sitemap
 *    and the pages' own canonical tags can never name different hosts.
 *  - Only indexable URLs. A product or service with `robotsIndex: false` is
 *    `noindex` on the page, so it must not be advertised here too. A product with
 *    `isActive: false` is unpublished in practice (the schema documents that it
 *    stops appearing in listings and the sitemap) and is dropped even though
 *    `getProducts()` still returns the row.
 *  - One URL, one entry. The code-defined catalogue and the CMS `products`
 *    collection describe the same addresses, so the list is de-duplicated by
 *    URL and the first (higher-priority) entry wins.
 *  - Honest `lastModified`. A date is only emitted when a real modification
 *    date exists. Code routes with no stored date get none; seeded fallbacks
 *    stamp `updatedAt` as the Unix epoch and are ignored, so "1 January 1970"
 *    is never published as a freshness signal.
 *  - Self-canonical routes only. If an editor stored a `canonicalUrl` that
 *    points at a different page, that route is omitted here — it canonicalises
 *    elsewhere, so it is not the indexable address.
 *
 * CMS-driven: the pages, products, services, industries, projects and posts are
 * read through the same published content layer the site renders from, so a page
 * published in the Admin appears and a deleted or unpublished one disappears on
 * the next revalidation, with no code change.
 */

export const revalidate = 3600;

/** A `lastModified` below this is a placeholder (the bootstrap epoch), not a real date. */
const DATE_FLOOR = Date.parse("2000-01-01T00:00:00Z");

function reliableDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime()) || date.getTime() < DATE_FLOOR) return undefined;
  return date;
}

type SitemapEntry = MetadataRoute.Sitemap[number];
type SitemapExtra = Omit<SitemapEntry, "url">;

/**
 * Slugs served by a dedicated code route. A CMS page with the same slug is
 * shadowed by that route, so it is not added a second time (which would also let
 * the CMS row's date masquerade as the code route's freshness).
 */
const DEDICATED_ROUTE_SLUGS = new Set([
  "about",
  "products",
  "services",
  "industries",
  "projects",
  "clients",
  "gallery",
  "blog",
  "contact",
  "request-a-quote",
  "search",
  "thank-you",
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteOrigin();
  const [products, services, industries, projects, posts, pageSlugs] = await Promise.all([
    getProducts(),
    getServices(),
    getIndustries(),
    getProjects(),
    getBlogPosts(),
    getPageSlugs(),
  ]);
  const cmsPages = (await Promise.all(pageSlugs.map((slug) => getPage(slug)))).filter(
    (page): page is NonNullable<typeof page> => Boolean(page),
  );

  /** URLs already collected, in insertion order. First entry wins. */
  const collected = new Map<string, SitemapEntry>();

  function add(url: string, extra: SitemapExtra) {
    const existing = collected.get(url);
    if (!existing) {
      collected.set(url, { url, ...extra });
      return;
    }
    // A later duplicate may carry a date the first entry lacked (the code
    // catalogue has no dates; the CMS row for the same product does).
    if (!existing.lastModified && extra.lastModified) existing.lastModified = extra.lastModified;
  }

  const absolute = (path: string) => `${base}${path}`;

  // --- Static code routes -------------------------------------------------
  // The homepage is written with its trailing slash so its `<loc>` is byte-for-
  // byte the canonical Next emits for `/`.
  for (const path of [
    "/",
    "/about",
    "/products",
    "/services",
    "/industries",
    "/projects",
    "/clients",
    "/gallery",
    "/blog",
    "/contact",
    "/request-a-quote",
  ]) {
    add(absolute(path), {
      changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "/" ? 1 : 0.7,
    });
  }

  // --- Published CMS pages ------------------------------------------------
  // Legal and other single-segment pages come from the CMS, not a hardcoded
  // list, so a new page is picked up and a deleted one is dropped.
  for (const page of cmsPages) {
    if (DEDICATED_ROUTE_SLUGS.has(page.slug)) continue;
    const self = `/${page.slug}`;
    if ((canonicalPath(page.canonicalUrl) ?? self) !== self) continue;
    add(absolute(self), {
      lastModified: reliableDate(page.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    });
  }

  // --- Catalogue categories ----------------------------------------------
  for (const category of catalogueCategories) {
    add(absolute(`/products/${category.slug}`), { changeFrequency: "weekly" as const, priority: 0.8 });
  }

  // --- Products -----------------------------------------------------------
  // Accurate dates for the code catalogue entries, which carry no date of their
  // own but are the same rows as the CMS products.
  const productLastModified = new Map<string, Date>();
  for (const product of products) {
    const modified = reliableDate(product.updatedAt);
    if (modified) productLastModified.set(product.slug, modified);
  }

  // A product the CMS has switched off or set `noindex` must not be listed. In
  // the database-backed deployment the CMS is authoritative even though the code
  // catalogue still contains a matching slug.
  const excludedProductSlugs = new Set(
    products.filter((product) => product.isActive === false || product.robotsIndex === false).map((product) => product.slug),
  );

  for (const product of catalogueProducts) {
    if (excludedProductSlugs.has(product.slug)) continue;
    add(absolute(getCatalogueProductHref(product)), {
      lastModified: productLastModified.get(product.slug),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    });
  }

  for (const product of products) {
    if (product.isActive === false || product.robotsIndex === false) continue;
    const self = `/products/${product.slug}`;
    if ((canonicalPath(product.canonicalUrl) ?? self) !== self) continue;
    add(absolute(self), {
      lastModified: reliableDate(product.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    });
  }

  // --- Services -----------------------------------------------------------
  for (const service of services) {
    if (service.robotsIndex === false) continue;
    const self = `/services/${service.slug}`;
    if ((canonicalPath(service.canonicalUrl) ?? self) !== self) continue;
    add(absolute(self), {
      lastModified: reliableDate(service.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    });
  }

  // --- Industries ---------------------------------------------------------
  for (const industry of industries) {
    add(absolute(`/industries/${industry.slug}`), {
      lastModified: reliableDate(industry.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    });
  }

  // --- Projects -----------------------------------------------------------
  for (const project of projects) {
    const self = `/projects/${project.slug}`;
    if ((canonicalPath(project.canonicalUrl) ?? self) !== self) continue;
    add(absolute(self), {
      lastModified: reliableDate(project.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    });
  }

  // --- Blog posts ---------------------------------------------------------
  for (const { post } of posts) {
    const self = `/blog/${post.slug}`;
    if ((canonicalPath(post.canonicalUrl) ?? self) !== self) continue;
    add(absolute(self), {
      lastModified: reliableDate(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    });
  }

  return [...collected.values()];
}
