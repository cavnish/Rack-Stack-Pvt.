import { db } from "@/db";
import {
  activityLogs, blogCategories, blogPosts, catalogDownloads, clientLogos, clients, contactMessages, faqs, gallery, homeSliders, homepageSections, industries, inquiries,
  pages, productApplications, productBenefits, productComponents, productConfigurations, productFeatures, productImages, productIndustries, productProjects,
  productRelatedProducts, productSpecifications, productStoredMaterials, productStories, productWorkflows, products, projectImages, projects, redirects,
  seoSettings, serviceFeatures, serviceIndustries, serviceProjects, services, siteSettings, testimonials,
} from "@/db/schema";
import { and, asc, desc, eq, gte, ilike, isNull, lte, or, sql } from "drizzle-orm";
import { logServer } from "@/lib/logger";
import { catalogueProducts, getCatalogueProductHref, getCatalogueSearchText } from "@/lib/catalogue";

async function safe<T>(run: () => Promise<T>, fallback: T, event: string): Promise<T> {
  try {
    return await run();
  } catch (error) {
    logServer("warn", event, { message: error instanceof Error ? error.message : "unknown" });
    return fallback;
  }
}

export const DEFAULT_SITE_SETTINGS: typeof siteSettings.$inferSelect = {
  id: 0,
  companyName: "Rack & Stack Storage Systems Pvt. Ltd.",
  logo: null,
  favicon: null,
  primaryPhone: "+91 97692 67792",
  secondaryPhone: null,
  whatsapp: "+91 97692 67792",
  email: "info@rackandstack.in",
  address: "Sr. No. 94/1, Umar Compound, Sopara Phata, Vasai-Virar, Maharashtra 401208",
  workingHours: "Monday\u2013Friday, 9:00 AM\u20136:00 PM",
  socialLinks: {},
  footerContent: "Strong, reliable storage systems planned around your space, loads and the way you work.",
  copyright: "Rack & Stack Storage Systems Pvt. Ltd. All rights reserved.",
  googleMapsEmbed: null,
  brochureUrl: null,
  brochurePublicId: null,
  catalogTitle: "Rack & Stack Product Catalog",
  catalogDescription: "See our storage systems and talk to us about the right setup for your business.",
  catalogLeadGated: false,
  updatedAt: new Date(0),
};

export async function getRedirectPath(sourcePath: string) { return safe(() => db.select().from(redirects).where(eq(redirects.sourcePath, sourcePath)).limit(1).then((rows) => rows[0]?.destinationPath ?? null), null, "redirects.fetch.failed"); }
export async function getSiteSettings() {
  return safe(() => db.select().from(siteSettings).limit(1).then((rows) => rows[0] ?? null), DEFAULT_SITE_SETTINGS, "site-settings.fetch.failed");
}
export async function getSeoSettings() {
  return safe(() => db.select().from(seoSettings).limit(1).then((rows) => rows[0] ?? null), null, "seo-settings.fetch.failed");
}
export async function getHomepageSections() {
  const rows = await safe(() => db.select().from(homepageSections).where(eq(homepageSections.enabled, true)).orderBy(asc(homepageSections.displayOrder)), [], "homepage-sections.fetch.failed");
  return Object.fromEntries(rows.map((row) => [row.sectionKey, row]));
}
export type HomeSlide = typeof homeSliders.$inferSelect;
export async function getHomeSliders(): Promise<HomeSlide[]> {
  const now = new Date();
  return safe(() => db.select().from(homeSliders).where(and(eq(homeSliders.status, "PUBLISHED"), or(isNull(homeSliders.startAt), lte(homeSliders.startAt, now)), or(isNull(homeSliders.endAt), gte(homeSliders.endAt, now)))).orderBy(asc(homeSliders.sortOrder)), [], "home-sliders.fetch.failed");
}
export async function getProducts(featuredOnly = false) {
  return safe(() => db.select().from(products).where(and(eq(products.status, "PUBLISHED"), isNull(products.deletedAt), featuredOnly ? eq(products.featured, true) : undefined)).orderBy(asc(products.displayOrder)), [], "products.fetch.failed");
}
export type CatalogueProduct = typeof products.$inferSelect & {
  keySpec: { name: string; value: string } | null;
  application: string | null;
  applicationTitle: string | null;
  imageCount: number;
};
export async function getProductCatalogue(): Promise<CatalogueProduct[]> {
  return safe(async () => {
    const [rows, specs, apps, counts] = await Promise.all([
      getProducts(),
      db.select().from(productSpecifications).orderBy(asc(productSpecifications.displayOrder)),
      db.select().from(productApplications).orderBy(asc(productApplications.displayOrder)),
      db.select({ productId: productImages.productId, count: sql<number>`count(*)` }).from(productImages).groupBy(productImages.productId),
    ]);
    const specMap = new Map<number, { name: string; value: string }>();
    for (const spec of specs) {
      if (!specMap.has(spec.productId)) specMap.set(spec.productId, { name: spec.specificationName, value: spec.specificationValue });
    }
    const appMap = new Map<number, { title: string | null; application: string }>();
    for (const app of apps) {
      if (!appMap.has(app.productId)) appMap.set(app.productId, { title: app.title, application: app.application });
    }
    const countMap = new Map(counts.map((row) => [row.productId, Number(row.count)]));
    return rows.map((row) => ({
      ...row,
      keySpec: specMap.get(row.id) ?? null,
      application: appMap.get(row.id)?.application ?? null,
      applicationTitle: appMap.get(row.id)?.title ?? null,
      imageCount: countMap.get(row.id) ?? 0,
    }));
  }, [], "product-catalogue.fetch.failed");
}
export async function getProductBySlug(slug: string, preview = false) {
  return safe(async () => {
    const product = (await db.select().from(products).where(and(eq(products.slug, slug), isNull(products.deletedAt), preview ? undefined : eq(products.status, "PUBLISHED"))).limit(1))[0];
    if (!product) return null;
    const [features, specifications, applications, images, benefits, components, configurations, storedMaterials, stories, workflows, allProducts, productFaqs, relatedRows, industryRows, projectRows] = await Promise.all([
      db.select().from(productFeatures).where(eq(productFeatures.productId, product.id)).orderBy(asc(productFeatures.displayOrder)),
      db.select().from(productSpecifications).where(eq(productSpecifications.productId, product.id)).orderBy(asc(productSpecifications.displayOrder)),
      db.select().from(productApplications).where(eq(productApplications.productId, product.id)).orderBy(asc(productApplications.displayOrder)),
      db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.displayOrder)),
      db.select().from(productBenefits).where(eq(productBenefits.productId, product.id)).orderBy(asc(productBenefits.displayOrder)),
      db.select().from(productComponents).where(eq(productComponents.productId, product.id)).orderBy(asc(productComponents.displayOrder)),
      db.select().from(productConfigurations).where(eq(productConfigurations.productId, product.id)).orderBy(asc(productConfigurations.displayOrder)),
      db.select().from(productStoredMaterials).where(eq(productStoredMaterials.productId, product.id)).orderBy(asc(productStoredMaterials.displayOrder)),
      db.select().from(productStories).where(eq(productStories.productId, product.id)).orderBy(asc(productStories.displayOrder)),
      db.select().from(productWorkflows).where(eq(productWorkflows.productId, product.id)).orderBy(asc(productWorkflows.displayOrder)),
      getProducts(),
      db.select().from(faqs).where(and(eq(faqs.status, "PUBLISHED"), or(eq(faqs.entityType, "GLOBAL"), and(eq(faqs.entityType, "PRODUCT"), eq(faqs.entityId, product.id))))).orderBy(asc(faqs.displayOrder)),
      db.select({ item: products }).from(productRelatedProducts).innerJoin(products, eq(productRelatedProducts.relatedProductId, products.id)).where(and(eq(productRelatedProducts.productId, product.id), eq(products.status, "PUBLISHED"), isNull(products.deletedAt))).orderBy(asc(productRelatedProducts.displayOrder)),
      db.select({ item: industries }).from(productIndustries).innerJoin(industries, eq(productIndustries.industryId, industries.id)).where(and(eq(productIndustries.productId, product.id), eq(industries.status, "PUBLISHED"))).orderBy(asc(productIndustries.displayOrder)),
      db.select({ item: projects }).from(productProjects).innerJoin(projects, eq(productProjects.projectId, projects.id)).where(and(eq(productProjects.productId, product.id), eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt))).orderBy(asc(productProjects.displayOrder)),
    ]);
    const related = relatedRows.length ? relatedRows.map((row) => row.item) : allProducts.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 3);
    return { ...product, features, specifications, applications, images, benefits, components, configurations, storedMaterials, stories, workflows, faqs: productFaqs, related, industries: industryRows.map((row) => row.item), projects: projectRows.map((row) => row.item) };
  }, null, "product.fetch.failed");
}
export async function getServices(featuredOnly = false) {
  return safe(() => db.select().from(services).where(and(eq(services.status, "PUBLISHED"), isNull(services.deletedAt), featuredOnly ? eq(services.featured, true) : undefined)).orderBy(asc(services.displayOrder)), [], "services.fetch.failed");
}
export async function getServiceBySlug(slug: string, preview = false) {
  return safe(async () => {
    const service = (await db.select().from(services).where(and(eq(services.slug, slug), isNull(services.deletedAt), preview ? undefined : eq(services.status, "PUBLISHED"))).limit(1))[0];
    if (!service) return null;
    const [features, serviceFaqs, industryRows, projectRows] = await Promise.all([
      db.select().from(serviceFeatures).where(eq(serviceFeatures.serviceId, service.id)).orderBy(asc(serviceFeatures.displayOrder)),
      db.select().from(faqs).where(and(eq(faqs.status, "PUBLISHED"), or(eq(faqs.entityType, "GLOBAL"), and(eq(faqs.entityType, "SERVICE"), eq(faqs.entityId, service.id))))).orderBy(asc(faqs.displayOrder)),
      db.select({ item: industries }).from(serviceIndustries).innerJoin(industries, eq(serviceIndustries.industryId, industries.id)).where(and(eq(serviceIndustries.serviceId, service.id), eq(industries.status, "PUBLISHED"))),
      db.select({ item: projects }).from(serviceProjects).innerJoin(projects, eq(serviceProjects.projectId, projects.id)).where(and(eq(serviceProjects.serviceId, service.id), eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt))),
    ]);
    return { ...service, features, faqs: serviceFaqs, industries: industryRows.map((row) => row.item), projects: projectRows.map((row) => row.item) };
  }, null, "service.fetch.failed");
}
export async function getIndustries() {
  return safe(() => db.select().from(industries).where(eq(industries.status, "PUBLISHED")).orderBy(asc(industries.displayOrder)), [], "industries.fetch.failed");
}
export async function getIndustryBySlug(slug: string) {
  return safe(async () => {
    const industry = (await db.select().from(industries).where(and(eq(industries.slug, slug), eq(industries.status, "PUBLISHED"))).limit(1))[0];
    if (!industry) return null;
    const [assignedProducts, assignedServices, fallbackProducts, fallbackServices] = await Promise.all([
      db.select({ item: products }).from(productIndustries).innerJoin(products, eq(productIndustries.productId, products.id)).where(and(eq(productIndustries.industryId, industry.id), eq(products.status, "PUBLISHED"), isNull(products.deletedAt))).orderBy(asc(productIndustries.displayOrder)),
      db.select({ item: services }).from(serviceIndustries).innerJoin(services, eq(serviceIndustries.serviceId, services.id)).where(and(eq(serviceIndustries.industryId, industry.id), eq(services.status, "PUBLISHED"), isNull(services.deletedAt))),
      getProducts(),
      getServices(),
    ]);
    return { ...industry, products: assignedProducts.length ? assignedProducts.map((row) => row.item) : fallbackProducts.slice(0, 4), services: assignedServices.length ? assignedServices.map((row) => row.item).slice(0, 4) : fallbackServices.slice(0, 3) };
  }, null, "industry.fetch.failed");
}
export async function getProjects() {
  return safe(() => db.select().from(projects).where(and(eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt))).orderBy(desc(projects.projectDate)), [], "projects.fetch.failed");
}
export async function getProjectBySlug(slug: string, preview = false) {
  return safe(async () => {
    const project = (await db.select().from(projects).where(and(eq(projects.slug, slug), isNull(projects.deletedAt), preview ? undefined : eq(projects.status, "PUBLISHED"))).limit(1))[0];
    if (!project) return null;
    const [images, productRows] = await Promise.all([
      db.select().from(projectImages).where(eq(projectImages.projectId, project.id)).orderBy(asc(projectImages.displayOrder)),
      db.select({ item: products }).from(productProjects).innerJoin(products, eq(productProjects.productId, products.id)).where(and(eq(productProjects.projectId, project.id), eq(products.status, "PUBLISHED"), isNull(products.deletedAt))),
    ]);
    return { ...project, images, products: productRows.map((row) => row.item) };
  }, null, "project.fetch.failed");
}
export async function getClients() { return safe(() => db.select().from(clients).where(isNull(clients.deletedAt)).orderBy(asc(clients.displayOrder)), [], "clients.fetch.failed"); }
export type ClientLogo = { id: number; name: string; imageUrl: string; altText: string; width: number | null; height: number | null };
export async function getClientLogos(): Promise<ClientLogo[]> {
  const logos = await safe(() => db
    .select({ id: clientLogos.id, name: clientLogos.name, imageUrl: clientLogos.imageUrl, altText: clientLogos.altText, width: clientLogos.width, height: clientLogos.height })
    .from(clientLogos)
    .where(eq(clientLogos.isActive, true))
    .orderBy(asc(clientLogos.sortOrder), asc(clientLogos.id)), [], "client-logos.fetch.failed");
  if (logos.length > 0) return logos;
  return safe(() => db
    .select({ id: clients.id, name: clients.name, imageUrl: clients.logo })
    .from(clients)
    .where(isNull(clients.deletedAt))
    .orderBy(asc(clients.displayOrder)).then((roster) => roster.map((row) => ({ id: row.id, name: row.name, imageUrl: row.imageUrl ?? "", altText: `${row.name} logo`, width: null, height: null }))), [], "client-logos.roster-fallback.failed");
}
export async function getGallery() { return safe(() => db.select().from(gallery).where(eq(gallery.status, "PUBLISHED")).orderBy(asc(gallery.displayOrder)), [], "gallery.fetch.failed"); }
export async function getTestimonials() { return safe(() => db.select().from(testimonials).where(eq(testimonials.status, "PUBLISHED")).orderBy(asc(testimonials.displayOrder)), [], "testimonials.fetch.failed"); }
export async function getGlobalFaqs() { return safe(() => db.select().from(faqs).where(and(eq(faqs.status, "PUBLISHED"), eq(faqs.entityType, "GLOBAL"))).orderBy(asc(faqs.displayOrder)), [], "global-faqs.fetch.failed"); }
export async function getPage(slug: string, preview = false) {
  return safe(() => db.select().from(pages).where(and(eq(pages.slug, slug), isNull(pages.deletedAt), preview ? undefined : eq(pages.status, "PUBLISHED"))).limit(1).then((rows) => rows[0] ?? null), null, "page.fetch.failed");
}
export async function getBlogPosts() {
  return safe(() => db.select({ post: blogPosts, category: blogCategories }).from(blogPosts).leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id)).where(and(eq(blogPosts.status, "PUBLISHED"), isNull(blogPosts.deletedAt))).orderBy(desc(blogPosts.publishedAt)), [], "blog-posts.fetch.failed");
}
export async function getBlogPost(slug: string, preview = false) {
  return safe(() => db.select({ post: blogPosts, category: blogCategories }).from(blogPosts).leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id)).where(and(eq(blogPosts.slug, slug), isNull(blogPosts.deletedAt), preview ? undefined : eq(blogPosts.status, "PUBLISHED"))).limit(1).then((rows) => rows[0] ?? null), null, "blog-post.fetch.failed");
}
export async function searchSite(query: string) {
  return safe(async () => {
    const term = `%${query.trim()}%`;
    const normalizedQuery = query.trim().toLowerCase();
    if (query.trim().length < 2) return [];
    const [productRows, serviceRows, projectRows, blogRows, pageRows] = await Promise.all([
      db.select({ title: products.name, slug: products.slug, description: products.shortDescription }).from(products).where(and(eq(products.status, "PUBLISHED"), isNull(products.deletedAt), or(ilike(products.name, term), ilike(products.shortDescription, term)))).limit(8),
      db.select({ title: services.name, slug: services.slug, description: services.shortDescription }).from(services).where(and(eq(services.status, "PUBLISHED"), isNull(services.deletedAt), or(ilike(services.name, term), ilike(services.shortDescription, term)))).limit(8),
      db.select({ title: projects.title, slug: projects.slug, description: projects.description }).from(projects).where(and(eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt), or(ilike(projects.title, term), ilike(projects.description, term)))).limit(8),
      db.select({ title: blogPosts.title, slug: blogPosts.slug, description: blogPosts.excerpt }).from(blogPosts).where(and(eq(blogPosts.status, "PUBLISHED"), isNull(blogPosts.deletedAt), or(ilike(blogPosts.title, term), ilike(blogPosts.excerpt, term)))).limit(8),
      db.select({ title: pages.title, slug: pages.slug, description: pages.heroDescription }).from(pages).where(and(eq(pages.status, "PUBLISHED"), isNull(pages.deletedAt), or(ilike(pages.title, term), ilike(pages.content, term)))).limit(8),
    ]);
    const staticProductRows = catalogueProducts.filter((product) => getCatalogueSearchText(product).includes(normalizedQuery)).slice(0, 8).map((product) => ({ title: product.name, slug: product.slug, description: product.shortDescription, type: "Product", href: getCatalogueProductHref(product) }));
    return [
      ...staticProductRows,
      ...productRows.map((x) => ({ ...x, type: "Product", href: `/products/${x.slug}` })),
      ...serviceRows.map((x) => ({ ...x, type: "Service", href: `/services/${x.slug}` })),
      ...projectRows.map((x) => ({ ...x, type: "Project", href: `/projects/${x.slug}` })),
      ...blogRows.map((x) => ({ ...x, type: "Resource", href: `/blog/${x.slug}` })),
      ...pageRows.map((x) => ({ ...x, type: "Page", href: `/${x.slug}` })),
    ];
  }, [], "search.fetch.failed");
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