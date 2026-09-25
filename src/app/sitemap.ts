import type { MetadataRoute } from "next";
import { getBlogPosts, getIndustries, getProducts, getProjects, getServices } from "@/lib/data";
import { catalogueCategories, catalogueProducts, getCatalogueProductHref } from "@/lib/catalogue";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [products, services, industries, projects, posts] = await Promise.all([getProducts(), getServices(), getIndustries(), getProjects(), getBlogPosts()]);
  const staticPaths = ["", "/about", "/products", "/services", "/industries", "/projects", "/clients", "/gallery", "/catalog", "/blog", "/contact", "/request-a-quote", "/privacy-policy", "/terms-and-conditions", "/cookie-policy"];

  return [
    ...staticPaths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : 0.7 })),
    ...catalogueCategories.map((category) => ({ url: `${base}/products/${category.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...catalogueProducts.map((product) => ({ url: `${base}${getCatalogueProductHref(product)}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...products.map((product) => ({ url: `${base}/products/${product.slug}`, lastModified: product.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...services.map((service) => ({ url: `${base}/services/${service.slug}`, lastModified: service.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...industries.map((industry) => ({ url: `${base}/industries/${industry.slug}`, lastModified: industry.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...projects.map((project) => ({ url: `${base}/projects/${project.slug}`, lastModified: project.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...posts.map(({ post }) => ({ url: `${base}/blog/${post.slug}`, lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
