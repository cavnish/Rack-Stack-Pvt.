import type { MetadataRoute } from "next";
import { getBlogPosts, getIndustries, getProducts, getProjects, getServices } from "@/lib/data";
import { catalogueCategories, catalogueProducts, getCatalogueProductHref } from "@/lib/catalogue";
import { siteOrigin } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteOrigin();
  const [products, services, industries, projects, posts] = await Promise.all([
    getProducts(),
    getServices(),
    getIndustries(),
    getProjects(),
    getBlogPosts(),
  ]);
  const staticPaths = ["", "/about", "/products", "/services", "/industries", "/projects", "/clients", "/gallery", "/catalog", "/blog", "/contact", "/request-a-quote", "/privacy-policy", "/terms-and-conditions", "/cookie-policy"];

  const entries: MetadataRoute.Sitemap = [
    ...staticPaths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : 0.7 })),
    ...catalogueCategories.map((category) => ({ url: `${base}/products/${category.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...catalogueProducts.map((product) => ({ url: `${base}${getCatalogueProductHref(product)}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...products.map((product) => ({ url: `${base}/products/${product.slug}`, lastModified: product.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...services.map((service) => ({ url: `${base}/services/${service.slug}`, lastModified: service.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...industries.map((industry) => ({ url: `${base}/industries/${industry.slug}`, lastModified: industry.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...projects.map((project) => ({ url: `${base}/projects/${project.slug}`, lastModified: project.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...posts.map(({ post }) => ({ url: `${base}/blog/${post.slug}`, lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];

  /*
   * Collapse repeated URLs.
   *
   * The product URL is contributed twice on purpose-looking code: once from the
   * static `catalogueProducts` array and once from the CMS `products` collection.
   * For most of the catalogue the two describe the same address, so 37 of the 114
   * entries were exact duplicates of an entry already present — the same
   * `loc` repeated with a different `lastmod`. Search engines treat that as a
   * conflicting signal about a page's freshness and it inflates the sitemap, so
   * the first entry for a URL wins and later ones are dropped.
   *
   * First-wins keeps the catalogue entry's higher priority (0.8) over the CMS
   * entry's (0.7), which is the better value for the page it points at.
   */
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
