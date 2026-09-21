import { db } from "@/db";
import {
  activityLogs, blogCategories, blogPosts, catalogDownloads, clientLogos, clients, contactMessages, faqs, gallery, homepageSections, industries, inquiries,
  pages, productApplications, productFeatures, productImages, productIndustries, productProjects,
  productRelatedProducts, productSpecifications, products, projectImages, projects, redirects,
  seoSettings, serviceFeatures, serviceIndustries, serviceProjects, services, siteSettings, testimonials,
} from "@/db/schema";
import { and, asc, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { logServer } from "@/lib/logger";

export async function getRedirectPath(sourcePath: string) { return (await db.select().from(redirects).where(eq(redirects.sourcePath, sourcePath)).limit(1))[0]?.destinationPath ?? null; }
export async function getSiteSettings() {
  return (await db.select().from(siteSettings).limit(1))[0] ?? null;
}
export async function getSeoSettings() {
  return (await db.select().from(seoSettings).limit(1))[0] ?? null;
}
export async function getHomepageSections() {
  const rows = await db.select().from(homepageSections).where(eq(homepageSections.enabled, true)).orderBy(asc(homepageSections.displayOrder));
  return Object.fromEntries(rows.map((row) => [row.sectionKey, row]));
}
export async function getProducts(featuredOnly = false) {
  return db.select().from(products).where(and(eq(products.status, "PUBLISHED"), isNull(products.deletedAt), featuredOnly ? eq(products.featured, true) : undefined)).orderBy(asc(products.displayOrder));
}
export async function getProductBySlug(slug: string, preview = false) {
  const product = (await db.select().from(products).where(and(eq(products.slug, slug), isNull(products.deletedAt), preview ? undefined : eq(products.status, "PUBLISHED"))).limit(1))[0];
  if (!product) return null;
  const [features, specifications, applications, images, allProducts, productFaqs, relatedRows, industryRows, projectRows] = await Promise.all([
    db.select().from(productFeatures).where(eq(productFeatures.productId, product.id)).orderBy(asc(productFeatures.displayOrder)),
    db.select().from(productSpecifications).where(eq(productSpecifications.productId, product.id)).orderBy(asc(productSpecifications.displayOrder)),
    db.select().from(productApplications).where(eq(productApplications.productId, product.id)).orderBy(asc(productApplications.displayOrder)),
    db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.displayOrder)),
    getProducts(),
    db.select().from(faqs).where(and(eq(faqs.status, "PUBLISHED"), or(eq(faqs.entityType, "GLOBAL"), and(eq(faqs.entityType, "PRODUCT"), eq(faqs.entityId, product.id))))).orderBy(asc(faqs.displayOrder)),
    db.select({ item: products }).from(productRelatedProducts).innerJoin(products, eq(productRelatedProducts.relatedProductId, products.id)).where(and(eq(productRelatedProducts.productId, product.id), eq(products.status, "PUBLISHED"), isNull(products.deletedAt))).orderBy(asc(productRelatedProducts.displayOrder)),
    db.select({ item: industries }).from(productIndustries).innerJoin(industries, eq(productIndustries.industryId, industries.id)).where(and(eq(productIndustries.productId, product.id), eq(industries.status, "PUBLISHED"))).orderBy(asc(productIndustries.displayOrder)),
    db.select({ item: projects }).from(productProjects).innerJoin(projects, eq(productProjects.projectId, projects.id)).where(and(eq(productProjects.productId, product.id), eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt))).orderBy(asc(productProjects.displayOrder)),
  ]);
  const related = relatedRows.length ? relatedRows.map((row) => row.item) : allProducts.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 3);
  return { ...product, features, specifications, applications, images, faqs: productFaqs, related, industries: industryRows.map((row) => row.item), projects: projectRows.map((row) => row.item) };
}
export async function getServices(featuredOnly = false) {
  return db.select().from(services).where(and(eq(services.status, "PUBLISHED"), isNull(services.deletedAt), featuredOnly ? eq(services.featured, true) : undefined)).orderBy(asc(services.displayOrder));
}
export async function getServiceBySlug(slug: string, preview = false) {
  const service = (await db.select().from(services).where(and(eq(services.slug, slug), isNull(services.deletedAt), preview ? undefined : eq(services.status, "PUBLISHED"))).limit(1))[0];
  if (!service) return null;
  const [features, serviceFaqs, industryRows, projectRows] = await Promise.all([
    db.select().from(serviceFeatures).where(eq(serviceFeatures.serviceId, service.id)).orderBy(asc(serviceFeatures.displayOrder)),
    db.select().from(faqs).where(and(eq(faqs.status, "PUBLISHED"), or(eq(faqs.entityType, "GLOBAL"), and(eq(faqs.entityType, "SERVICE"), eq(faqs.entityId, service.id))))).orderBy(asc(faqs.displayOrder)),
    db.select({ item: industries }).from(serviceIndustries).innerJoin(industries, eq(serviceIndustries.industryId, industries.id)).where(and(eq(serviceIndustries.serviceId, service.id), eq(industries.status, "PUBLISHED"))),
    db.select({ item: projects }).from(serviceProjects).innerJoin(projects, eq(serviceProjects.projectId, projects.id)).where(and(eq(serviceProjects.serviceId, service.id), eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt))),
  ]);
  return { ...service, features, faqs: serviceFaqs, industries: industryRows.map((row) => row.item), projects: projectRows.map((row) => row.item) };
}
export async function getIndustries() {
  return db.select().from(industries).where(eq(industries.status, "PUBLISHED")).orderBy(asc(industries.displayOrder));
}
export async function getIndustryBySlug(slug: string) {
  const industry = (await db.select().from(industries).where(and(eq(industries.slug, slug), eq(industries.status, "PUBLISHED"))).limit(1))[0];
  if (!industry) return null;
  const [assignedProducts, assignedServices, fallbackProducts, fallbackServices] = await Promise.all([
    db.select({ item: products }).from(productIndustries).innerJoin(products, eq(productIndustries.productId, products.id)).where(and(eq(productIndustries.industryId, industry.id), eq(products.status, "PUBLISHED"), isNull(products.deletedAt))).orderBy(asc(productIndustries.displayOrder)),
    db.select({ item: services }).from(serviceIndustries).innerJoin(services, eq(serviceIndustries.serviceId, services.id)).where(and(eq(serviceIndustries.industryId, industry.id), eq(services.status, "PUBLISHED"), isNull(services.deletedAt))),
    getProducts(),
    getServices(),
  ]);
  return { ...industry, products: assignedProducts.length ? assignedProducts.map((row) => row.item) : fallbackProducts.slice(0, 4), services: assignedServices.length ? assignedServices.map((row) => row.item).slice(0, 4) : fallbackServices.slice(0, 3) };
}
export async function getProjects() {
  return db.select().from(projects).where(and(eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt))).orderBy(desc(projects.projectDate));
}
export async function getProjectBySlug(slug: string, preview = false) {
  const project = (await db.select().from(projects).where(and(eq(projects.slug, slug), isNull(projects.deletedAt), preview ? undefined : eq(projects.status, "PUBLISHED"))).limit(1))[0];
  if (!project) return null;
  const [images, productRows] = await Promise.all([
    db.select().from(projectImages).where(eq(projectImages.projectId, project.id)).orderBy(asc(projectImages.displayOrder)),
    db.select({ item: products }).from(productProjects).innerJoin(products, eq(productProjects.productId, products.id)).where(and(eq(productProjects.projectId, project.id), eq(products.status, "PUBLISHED"), isNull(products.deletedAt))),
  ]);
  return { ...project, images, products: productRows.map((row) => row.item) };
}
export async function getClients() { return db.select().from(clients).where(isNull(clients.deletedAt)).orderBy(asc(clients.displayOrder)); }
export type ClientLogo = { id: number; name: string; imageUrl: string; altText: string; width: number | null; height: number | null };
export async function getClientLogos(): Promise<ClientLogo[]> {
  try {
    const logos = await db
      .select({ id: clientLogos.id, name: clientLogos.name, imageUrl: clientLogos.imageUrl, altText: clientLogos.altText, width: clientLogos.width, height: clientLogos.height })
      .from(clientLogos)
      .where(eq(clientLogos.isActive, true))
      .orderBy(asc(clientLogos.sortOrder), asc(clientLogos.id));
    if (logos.length > 0) return logos;
  } catch (error) {
    logServer("error", "client-logos.fetch.failed", { message: error instanceof Error ? error.message : "unknown" });
  }
  try {
    const roster = await db
      .select({ id: clients.id, name: clients.name, imageUrl: clients.logo })
      .from(clients)
      .where(isNull(clients.deletedAt))
      .orderBy(asc(clients.displayOrder));
    return roster.map((row) => ({ id: row.id, name: row.name, imageUrl: row.imageUrl ?? "", altText: `${row.name} logo`, width: null, height: null }));
  } catch (error) {
    logServer("error", "client-logos.roster-fallback.failed", { message: error instanceof Error ? error.message : "unknown" });
    return [];
  }
}
export async function getGallery() { return db.select().from(gallery).where(eq(gallery.status, "PUBLISHED")).orderBy(asc(gallery.displayOrder)); }
export async function getTestimonials() { return db.select().from(testimonials).where(eq(testimonials.status, "PUBLISHED")).orderBy(asc(testimonials.displayOrder)); }
export async function getGlobalFaqs() { return db.select().from(faqs).where(and(eq(faqs.status, "PUBLISHED"), eq(faqs.entityType, "GLOBAL"))).orderBy(asc(faqs.displayOrder)); }
export async function getPage(slug: string, preview = false) {
  return (await db.select().from(pages).where(and(eq(pages.slug, slug), isNull(pages.deletedAt), preview ? undefined : eq(pages.status, "PUBLISHED"))).limit(1))[0] ?? null;
}
export async function getBlogPosts() {
  return db.select({ post: blogPosts, category: blogCategories }).from(blogPosts).leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id)).where(and(eq(blogPosts.status, "PUBLISHED"), isNull(blogPosts.deletedAt))).orderBy(desc(blogPosts.publishedAt));
}
export async function getBlogPost(slug: string, preview = false) {
  return (await db.select({ post: blogPosts, category: blogCategories }).from(blogPosts).leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id)).where(and(eq(blogPosts.slug, slug), isNull(blogPosts.deletedAt), preview ? undefined : eq(blogPosts.status, "PUBLISHED"))).limit(1))[0] ?? null;
}
export async function searchSite(query: string) {
  const term = `%${query.trim()}%`;
  if (query.trim().length < 2) return [];
  const [productRows, serviceRows, projectRows, blogRows, pageRows] = await Promise.all([
    db.select({ title: products.name, slug: products.slug, description: products.shortDescription }).from(products).where(and(eq(products.status, "PUBLISHED"), isNull(products.deletedAt), or(ilike(products.name, term), ilike(products.shortDescription, term)))).limit(8),
    db.select({ title: services.name, slug: services.slug, description: services.shortDescription }).from(services).where(and(eq(services.status, "PUBLISHED"), isNull(services.deletedAt), or(ilike(services.name, term), ilike(services.shortDescription, term)))).limit(8),
    db.select({ title: projects.title, slug: projects.slug, description: projects.description }).from(projects).where(and(eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt), or(ilike(projects.title, term), ilike(projects.description, term)))).limit(8),
    db.select({ title: blogPosts.title, slug: blogPosts.slug, description: blogPosts.excerpt }).from(blogPosts).where(and(eq(blogPosts.status, "PUBLISHED"), isNull(blogPosts.deletedAt), or(ilike(blogPosts.title, term), ilike(blogPosts.excerpt, term)))).limit(8),
    db.select({ title: pages.title, slug: pages.slug, description: pages.heroDescription }).from(pages).where(and(eq(pages.status, "PUBLISHED"), isNull(pages.deletedAt), or(ilike(pages.title, term), ilike(pages.content, term)))).limit(8),
  ]);
  return [
    ...productRows.map((x) => ({ ...x, type: "Product", href: `/products/${x.slug}` })),
    ...serviceRows.map((x) => ({ ...x, type: "Service", href: `/services/${x.slug}` })),
    ...projectRows.map((x) => ({ ...x, type: "Project", href: `/projects/${x.slug}` })),
    ...blogRows.map((x) => ({ ...x, type: "Resource", href: `/blog/${x.slug}` })),
    ...pageRows.map((x) => ({ ...x, type: "Page", href: `/${x.slug}` })),
  ];
}
export async function getDashboardStats() {
  const counts = await Promise.all([
    db.select({ value: sql<number>`count(*)` }).from(products).where(isNull(products.deletedAt)),
    db.select({ value: sql<number>`count(*)` }).from(services).where(isNull(services.deletedAt)),
    db.select({ value: sql<number>`count(*)` }).from(projects).where(isNull(projects.deletedAt)),
    db.select({ value: sql<number>`count(*)` }).from(clients).where(isNull(clients.deletedAt)),
    db.select({ value: sql<number>`count(*)` }).from(inquiries).where(eq(inquiries.status, "NEW")),
    db.select({ value: sql<number>`count(*)` }).from(contactMessages).where(eq(contactMessages.status, "NEW")),
    db.select({ value: sql<number>`count(*)` }).from(catalogDownloads),
    db.select({ value: sql<number>`count(*)` }).from(products).where(and(eq(products.status, "DRAFT"), isNull(products.deletedAt))),
  ]);
  const [recent, statuses, recentActivity] = await Promise.all([
    db.select().from(inquiries).orderBy(desc(inquiries.createdAt)).limit(6),
    db.select({ status: inquiries.status, count: sql<number>`count(*)` }).from(inquiries).groupBy(inquiries.status),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(7),
  ]);
  return {
    products: Number(counts[0][0].value), services: Number(counts[1][0].value), projects: Number(counts[2][0].value),
    clients: Number(counts[3][0].value), newInquiries: Number(counts[4][0].value), newMessages: Number(counts[5][0].value),
    catalogDownloads: Number(counts[6][0].value), draftProducts: Number(counts[7][0].value), recent, statuses, recentActivity,
  };
}
