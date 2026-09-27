import "server-only";
import { db, dbConfigured } from "@/db";
import {
  activityLogs, blogCategories, blogPosts, catalogDownloads, clientLogos, clients, contactMessages, faqs, gallery, homeSliders, homepageSections, industries, inquiries,
  pages, productApplications, productBenefits, productComponents, productConfigurations, productFeatures, productImages, productIndustries, productProjects,
  productRelatedProducts, productSpecifications, productStoredMaterials, productStories, productWorkflows, products, projectImages, projects, redirects,
  seoSettings, serviceFeatures, serviceIndustries, serviceProjects, services, siteSettings, testimonials, videoProducts, videos, videoServices,
} from "@/db/schema";
import { and, asc, desc, eq, gte, ilike, isNull, lte, or, sql } from "drizzle-orm";
import { logServer } from "@/lib/logger";
import { catalogueProducts, getCatalogueProductHref, getCatalogueSearchText } from "@/lib/catalogue";
import { readCollection, type CollectionKey } from "@/lib/publish/store";
import {
  bootstrapBlogCategories,
  bootstrapBlogPosts,
  bootstrapClientLogos,
  bootstrapFaqs,
  bootstrapGallery,
  bootstrapHomeSections,
  bootstrapIndustries,
  bootstrapPages,
  bootstrapProducts,
  bootstrapProductChildren,
  bootstrapProjects,
  bootstrapServices,
  bootstrapServiceFeatures,
  bootstrapSliders,
  bootstrapTestimonials,
  bootstrapVideos,
} from "@/lib/publish/bootstrap";
import { publishSerialized, type PublishScope } from "@/lib/publish";
import { reviveDates, reviveList, type StaticBlogPostWithCategory, type StaticProductDetail, type StaticRoutes, type StaticVideo } from "@/lib/publish/types";
import { getPublicClientLogos } from "@/lib/client-assets";
import type { ReelVideoItem } from "@/lib/reel-video";

/**
 * Public content read layer.
 *
 * Priority for every getter:
 *   1. Published static content in src/data/*.json  (no database, no network)
 *   2. Neon, and the result is re-published so the static layer catches up
 *   3. Curated local fallback content, so a section is never blank
 */

const regeneration = new Map<string, Promise<unknown>>();

function backgroundPublish(scope: PublishScope) {
  if (!dbConfigured) return;
  if (process.env.NODE_ENV === "production" && process.env.DISABLE_SELF_PUBLISH === "1") return;
  if (regeneration.has(scope)) return;
  const task = publishSerialized(scope)
    .catch(() => undefined)
    .finally(() => regeneration.delete(scope));
  regeneration.set(scope, task);
}

type Resolved<T> = { value: T; source: "static" | "database" | "fallback" };

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Static JSON keeps dates as ISO strings; the live rows expose real Date objects. */
function reviveStatic(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((row) => (isPlainRecord(row) ? reviveDates(row) : row));
  if (isPlainRecord(value)) return reviveDates(value);
  return value;
}

async function resolve<T>(
  key: CollectionKey,
  load: () => Promise<T>,
  fallback: () => Promise<unknown> | unknown,
  options: { scope: PublishScope; isEmpty?: (value: unknown) => boolean },
): Promise<Resolved<T>> {
  const published = await readCollection<unknown>(key);
  if (published !== null && published !== undefined) {
    const revived = reviveStatic(published);
    if (!(options.isEmpty?.(revived) ?? false)) return { value: revived as T, source: "static" };
  }

  try {
    if (!dbConfigured) throw new Error("DATABASE_URL is not configured");
    const fromDatabase = await load();
    if (fromDatabase !== null && fromDatabase !== undefined && !(options.isEmpty?.(fromDatabase) ?? false)) {
      backgroundPublish(options.scope);
      return { value: fromDatabase, source: "database" };
    }
  } catch (error) {
    logServer("warn", `${key}.fetch.failed`, { message: error instanceof Error ? error.message : "unknown" });
  }

  // Bootstrap data is authored as serializable JSON, so it is cast to the live row shape.
  return { value: (await fallback()) as T, source: "fallback" };
}

const notEmptyArray = (value: unknown) => (Array.isArray(value) ? value.length === 0 : value === null || value === undefined);


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

type SiteSettingsRow = typeof siteSettings.$inferSelect;

const siteSettingsFallback: SiteSettingsRow = {
  ...DEFAULT_SITE_SETTINGS,
  companyName: "Rack & Stack Storage Systems Pvt. Ltd.",
  primaryPhone: "+91 97692 67792",
  secondaryPhone: "+91 81698 26744",
  workingHours: "Monday\u2013Friday, 9:00 AM\u20136:00 PM",
};

export async function getSiteSettings() {
  const { value } = await resolve<SiteSettingsRow[]>(
    "site",
    () => db.select().from(siteSettings).limit(1),
    () => [siteSettingsFallback],
    { scope: "settings" },
  );
  const record = Array.isArray(value) ? value[0] : value;
  return record ? reviveDates(record as unknown as Record<string, unknown>) as SiteSettingsRow : DEFAULT_SITE_SETTINGS;
}

export async function getSeoSettings() {
  const { value } = await resolve<typeof seoSettings.$inferSelect | null>(
    "seo",
    () => db.select().from(seoSettings).limit(1).then((rows) => rows[0] ?? null),
    () => null,
    { scope: "seo", isEmpty: (row) => row === null },
  );
  if (!value) return null;
  return reviveDates(value as unknown as Record<string, unknown>) as typeof seoSettings.$inferSelect;
}

export type HomepageSectionMap = Record<string, typeof homepageSections.$inferSelect>;

export async function getHomepageSections() {
  const { value } = await resolve<Array<typeof homepageSections.$inferSelect>>(
    "homepage",
    () => db.select().from(homepageSections).where(eq(homepageSections.enabled, true)).orderBy(asc(homepageSections.displayOrder)),
    () => bootstrapHomeSections(),
    { scope: "homepage", isEmpty: notEmptyArray },
  );
  return Object.fromEntries(
    (value as Array<typeof homepageSections.$inferSelect>).map((row) => [
      row.sectionKey,
      reviveDates(row as unknown as Record<string, unknown>) as typeof homepageSections.$inferSelect,
    ]),
  );
}

export type HomeSlide = typeof homeSliders.$inferSelect;

export type ProductDetail = typeof products.$inferSelect & {
  features: Array<typeof productFeatures.$inferSelect>;
  specifications: Array<typeof productSpecifications.$inferSelect>;
  applications: Array<typeof productApplications.$inferSelect>;
  images: Array<typeof productImages.$inferSelect>;
  benefits: Array<typeof productBenefits.$inferSelect>;
  components: Array<typeof productComponents.$inferSelect>;
  configurations: Array<typeof productConfigurations.$inferSelect>;
  storedMaterials: Array<typeof productStoredMaterials.$inferSelect>;
  stories: Array<typeof productStories.$inferSelect>;
  workflows: Array<typeof productWorkflows.$inferSelect>;
  faqs: Array<typeof faqs.$inferSelect>;
  related: Array<typeof products.$inferSelect>;
  industries: Array<typeof industries.$inferSelect>;
  projects: Array<typeof projects.$inferSelect>;
};

export type ServiceDetail = typeof services.$inferSelect & {
  features: Array<typeof serviceFeatures.$inferSelect>;
  faqs: Array<typeof faqs.$inferSelect>;
  industries: Array<typeof industries.$inferSelect>;
  projects: Array<typeof projects.$inferSelect>;
};

export type ProjectDetail = typeof projects.$inferSelect & {
  images: Array<typeof projectImages.$inferSelect>;
  products: Array<typeof products.$inferSelect>;
};

export type IndustryDetail = typeof industries.$inferSelect & {
  products: Array<typeof products.$inferSelect>;
  services: Array<typeof services.$inferSelect>;
};

export type BlogPostWithCategory = {
  post: typeof blogPosts.$inferSelect;
  category: typeof blogCategories.$inferSelect | null;
};

export async function getHomeSliders(): Promise<HomeSlide[]> {
  const now = new Date();
  const { value } = await resolve<Array<typeof homeSliders.$inferSelect>>(
    "sliders",
    () =>
      db
        .select()
        .from(homeSliders)
        .where(
          and(
            eq(homeSliders.status, "PUBLISHED"),
            or(isNull(homeSliders.startAt), lte(homeSliders.startAt, now)),
            or(isNull(homeSliders.endAt), gte(homeSliders.endAt, now)),
          ),
        )
        .orderBy(asc(homeSliders.sortOrder)),
    () => bootstrapSliders(),
    { scope: "sliders", isEmpty: notEmptyArray },
  );
  return value;
}

export async function getProducts(featuredOnly = false) {
  const load = async () => {
    const published = await readCollection<Array<typeof products.$inferSelect>>("products");
    if (published && published.length > 0) {
      const rows = featuredOnly ? published.filter((row) => row.featured) : published;
      if (rows.length > 0) return rows as typeof products.$inferSelect[];
    }
    return db
      .select()
      .from(products)
      .where(and(eq(products.status, "PUBLISHED"), isNull(products.deletedAt), featuredOnly ? eq(products.featured, true) : undefined))
      .orderBy(asc(products.displayOrder));
  };
  const { value } = await resolve<Array<typeof products.$inferSelect>>("products", load, () => bootstrapProducts(), {
    scope: "products",
    isEmpty: notEmptyArray,
  });
  return value as Array<typeof products.$inferSelect>;
}

export type CatalogueProduct = typeof products.$inferSelect & {
  keySpec: { name: string; value: string } | null;
  application: string | null;
  applicationTitle: string | null;
  imageCount: number;
};

export async function getProductCatalogue(): Promise<CatalogueProduct[]> {
  const base = await getProducts();
  const expanded = await readCollection<StaticProductDetail[]>("products");
  return base.map((product) => {
    const detail = expanded?.find((entry) => entry.slug === product.slug);
    const specifications = detail?.specifications ?? [];
    const applications = detail?.applications ?? [];
    const images = detail?.images ?? [];
    return {
      ...product,
      keySpec: specifications[0] ? { name: specifications[0].specificationName, value: specifications[0].specificationValue } : null,
      application: applications[0]?.application ?? null,
      applicationTitle: applications[0]?.title ?? null,
      imageCount: images.length,
    };
  });
}

async function productChildQuery<T>(slug: string, key: string, query: () => Promise<T[]>) {
  const children = (await bootstrapProductChildren(slug)) as unknown as Record<string, unknown> | null;
  const cached = children?.[key];
  if (Array.isArray(cached) && cached.length > 0) return cached as T[];
  try {
    if (!dbConfigured) return [];
    const rows = await query();
    if (rows.length > 0) return rows;
  } catch (error) {
    logServer("warn", `product.${key}.fetch.failed`, { slug, message: error instanceof Error ? error.message : "unknown" });
  }
  return [];
}

export async function getProductBySlug(slug: string, preview = false): Promise<ProductDetail | null> {
  const publishedProducts = (await readCollection<StaticProductDetail[]>("products")) ?? [];
  const fromStatic = publishedProducts.find((item) => item.slug === slug);
  if (fromStatic) return reviveProductDetail(fromStatic);

  try {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), isNull(products.deletedAt), preview ? undefined : eq(products.status, "PUBLISHED")))
      .limit(1);
    if (product) {
      const [
        features,
        specifications,
        applications,
        images,
        benefits,
        components,
        configurations,
        storedMaterials,
        stories,
        workflows,
        productFaqs,
        relatedRows,
        industryRows,
        projectRows,
      ] = await Promise.all([
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
        db
          .select()
          .from(faqs)
          .where(
            and(
              eq(faqs.status, "PUBLISHED"),
              or(eq(faqs.entityType, "GLOBAL"), and(eq(faqs.entityType, "PRODUCT"), eq(faqs.entityId, product.id))),
            ),
          )
          .orderBy(asc(faqs.displayOrder)),
        db
          .select({ item: products })
          .from(productRelatedProducts)
          .innerJoin(products, eq(productRelatedProducts.relatedProductId, products.id))
          .where(and(eq(productRelatedProducts.productId, product.id), eq(products.status, "PUBLISHED"), isNull(products.deletedAt)))
          .orderBy(asc(productRelatedProducts.displayOrder)),
        db
          .select({ item: industries })
          .from(productIndustries)
          .innerJoin(industries, eq(productIndustries.industryId, industries.id))
          .where(and(eq(productIndustries.productId, product.id), eq(industries.status, "PUBLISHED")))
          .orderBy(asc(productIndustries.displayOrder)),
        db
          .select({ item: projects })
          .from(productProjects)
          .innerJoin(projects, eq(productProjects.projectId, projects.id))
          .where(and(eq(productProjects.productId, product.id), eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt)))
          .orderBy(asc(productProjects.displayOrder)),
      ]);
      const allProducts = await getProducts();
      const related = relatedRows.length
        ? relatedRows.map((row) => row.item)
        : allProducts.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 3);
      backgroundPublish("products");
      return {
        ...product,
        features,
        specifications,
        applications,
        images,
        benefits,
        components,
        configurations,
        storedMaterials,
        stories,
        workflows,
        faqs: productFaqs,
        related,
        industries: industryRows.map((row) => row.item),
        projects: projectRows.map((row) => row.item),
      };
    }
  } catch (error) {
    logServer("warn", "product.fetch.failed", { slug, message: error instanceof Error ? error.message : "unknown" });
  }

  const bootstrapProduct = (await bootstrapProducts()).find((item) => item.slug === slug);
  if (!bootstrapProduct) return null;
  const children = await bootstrapProductChildren(slug);
  if (!children) return null;
  const [allProducts, allIndustries] = await Promise.all([bootstrapProducts(), bootstrapIndustries()]);
  const detail: ProductDetail = {
    ...(reviveDates(bootstrapProduct as unknown as Record<string, unknown>) as typeof products.$inferSelect),
    features: children.features as unknown as ProductDetail["features"],
    specifications: children.specifications as unknown as ProductDetail["specifications"],
    applications: children.applications as unknown as ProductDetail["applications"],
    images: children.images as unknown as ProductDetail["images"],
    benefits: [],
    components: [],
    configurations: [],
    storedMaterials: [],
    stories: [],
    workflows: [],
    faqs: [],
    related: children.related
      .map((id) => allProducts.find((item) => item.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => reviveDates(item as unknown as Record<string, unknown>) as typeof products.$inferSelect),
    industries: children.industries
      .map((id) => allIndustries[id - 1])
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => reviveDates(item as unknown as Record<string, unknown>) as typeof industries.$inferSelect),
    projects: [],
  };
  return detail;
}

function reviveProductDetail(detail: StaticProductDetail): ProductDetail {
  const revive = (value: unknown) => reviveDates(value as Record<string, unknown>);
  return {
    ...(revive(detail) as typeof products.$inferSelect),
    features: detail.features.map(revive) as unknown as ProductDetail["features"],
    specifications: detail.specifications.map(revive) as unknown as ProductDetail["specifications"],
    applications: detail.applications.map(revive) as unknown as ProductDetail["applications"],
    images: detail.images.map(revive) as unknown as ProductDetail["images"],
    benefits: detail.benefits.map(revive) as unknown as ProductDetail["benefits"],
    components: detail.components.map(revive) as unknown as ProductDetail["components"],
    configurations: detail.configurations.map(revive) as unknown as ProductDetail["configurations"],
    storedMaterials: detail.storedMaterials.map(revive) as unknown as ProductDetail["storedMaterials"],
    stories: detail.stories.map(revive) as unknown as ProductDetail["stories"],
    workflows: detail.workflows.map(revive) as unknown as ProductDetail["workflows"],
    faqs: detail.faqs.map(revive) as unknown as ProductDetail["faqs"],
    related: detail.related.map(revive) as unknown as ProductDetail["related"],
    industries: detail.industries.map(revive) as unknown as ProductDetail["industries"],
    projects: detail.projects.map(revive) as unknown as ProductDetail["projects"],
  };
}

export async function getServices(featuredOnly = false) {
  const { value } = await resolve<Array<typeof services.$inferSelect>>(
    "services",
    () =>
      db
        .select()
        .from(services)
        .where(and(eq(services.status, "PUBLISHED"), isNull(services.deletedAt), featuredOnly ? eq(services.featured, true) : undefined))
        .orderBy(asc(services.displayOrder)),
    () => bootstrapServices(),
    { scope: "services", isEmpty: notEmptyArray },
  );
  const featured = value.filter((row) => row.featured);
  return featuredOnly && featured.length > 0 ? featured : value;
}

export async function getServiceBySlug(slug: string, preview = false): Promise<ServiceDetail | null> {
  const published = (await readCollection<Array<Record<string, unknown>>>("services")) ?? [];
  const fromStatic = published.find((item) => item.slug === slug);
  if (fromStatic) {
    const detail = fromStatic as unknown as {
      features: Array<Record<string, unknown>>;
      faqs: Array<Record<string, unknown>>;
      industries: Array<Record<string, unknown>>;
      projects: Array<Record<string, unknown>>;
    };
    const staticDetail: ServiceDetail = {
      ...(reviveDates(fromStatic) as typeof services.$inferSelect),
      features: (detail.features ?? []).map((item) => reviveDates(item)) as ServiceDetail["features"],
      faqs: (detail.faqs ?? []).map((item) => reviveDates(item)) as ServiceDetail["faqs"],
      industries: (detail.industries ?? []).map((item) => reviveDates(item)) as ServiceDetail["industries"],
      projects: (detail.projects ?? []).map((item) => reviveDates(item)) as ServiceDetail["projects"],
    };
    return staticDetail;
  }

  try {
    const [service] = await db
      .select()
      .from(services)
      .where(and(eq(services.slug, slug), isNull(services.deletedAt), preview ? undefined : eq(services.status, "PUBLISHED")))
      .limit(1);
    if (service) {
      const [features, serviceFaqs, industryRows, projectRows] = await Promise.all([
        db.select().from(serviceFeatures).where(eq(serviceFeatures.serviceId, service.id)).orderBy(asc(serviceFeatures.displayOrder)),
        db
          .select()
          .from(faqs)
          .where(
            and(
              eq(faqs.status, "PUBLISHED"),
              or(eq(faqs.entityType, "GLOBAL"), and(eq(faqs.entityType, "SERVICE"), eq(faqs.entityId, service.id))),
            ),
          )
          .orderBy(asc(faqs.displayOrder)),
        db
          .select({ item: industries })
          .from(serviceIndustries)
          .innerJoin(industries, eq(serviceIndustries.industryId, industries.id))
          .where(and(eq(serviceIndustries.serviceId, service.id), eq(industries.status, "PUBLISHED"))),
        db
          .select({ item: projects })
          .from(serviceProjects)
          .innerJoin(projects, eq(serviceProjects.projectId, projects.id))
          .where(and(eq(serviceProjects.serviceId, service.id), eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt))),
      ]);
      backgroundPublish("services");
      return { ...service, features, faqs: serviceFaqs, industries: industryRows.map((row) => row.item), projects: projectRows.map((row) => row.item) };
    }
  } catch (error) {
    logServer("warn", "service.fetch.failed", { slug, message: error instanceof Error ? error.message : "unknown" });
  }

  const serviceList = await bootstrapServices();
  const service = serviceList.find((item) => item.slug === slug);
  if (!service) return null;
  const detail: ServiceDetail = {
    ...(reviveDates(service as unknown as Record<string, unknown>) as typeof services.$inferSelect),
    features: bootstrapServiceFeatures(service.id) as unknown as ServiceDetail["features"],
    faqs: (await bootstrapFaqs()) as unknown as ServiceDetail["faqs"],
    industries: [],
    projects: [],
  };
  return detail;
}

export async function getIndustries() {
  const { value } = await resolve<Array<typeof industries.$inferSelect>>(
    "industries",
    () => db.select().from(industries).where(eq(industries.status, "PUBLISHED")).orderBy(asc(industries.displayOrder)),
    () => bootstrapIndustries(),
    { scope: "industries", isEmpty: notEmptyArray },
  );
  return value as Array<typeof industries.$inferSelect>;
}

export async function getIndustryBySlug(slug: string): Promise<IndustryDetail | null> {
  const published = (await readCollection<Array<Record<string, unknown>>>("industries")) ?? [];
  const fromStatic = published.find((item) => item.slug === slug);
  if (fromStatic) {
    const detail = fromStatic as unknown as { products: Array<Record<string, unknown>>; services: Array<Record<string, unknown>> };
    const staticDetail: IndustryDetail = {
      ...(reviveDates(fromStatic) as typeof industries.$inferSelect),
      products: (detail.products ?? []).map((item) => reviveDates(item)) as IndustryDetail["products"],
      services: (detail.services ?? []).map((item) => reviveDates(item)) as IndustryDetail["services"],
    };
    return staticDetail;
  }

  try {
    const [industry] = await db
      .select()
      .from(industries)
      .where(and(eq(industries.slug, slug), eq(industries.status, "PUBLISHED")))
      .limit(1);
    if (industry) {
      const [assignedProducts, assignedServices, fallbackProducts, fallbackServices] = await Promise.all([
        db
          .select({ item: products })
          .from(productIndustries)
          .innerJoin(products, eq(productIndustries.productId, products.id))
          .where(and(eq(productIndustries.industryId, industry.id), eq(products.status, "PUBLISHED"), isNull(products.deletedAt)))
          .orderBy(asc(productIndustries.displayOrder)),
        db
          .select({ item: services })
          .from(serviceIndustries)
          .innerJoin(services, eq(serviceIndustries.serviceId, services.id))
          .where(and(eq(serviceIndustries.industryId, industry.id), eq(services.status, "PUBLISHED"), isNull(services.deletedAt))),
        getProducts(),
        getServices(),
      ]);
      backgroundPublish("industries");
      return {
        ...industry,
        products: assignedProducts.length ? assignedProducts.map((row) => row.item) : fallbackProducts.slice(0, 4),
        services: assignedServices.length ? assignedServices.map((row) => row.item).slice(0, 4) : fallbackServices.slice(0, 3),
      };
    }
  } catch (error) {
    logServer("warn", "industry.fetch.failed", { slug, message: error instanceof Error ? error.message : "unknown" });
  }

  const list = await bootstrapIndustries();
  const industry = list.find((item) => item.slug === slug);
  if (!industry) return null;
  const [allProducts, allServices] = await Promise.all([bootstrapProducts(), bootstrapServices()]);
  const detail: IndustryDetail = {
    ...(reviveDates(industry as unknown as Record<string, unknown>) as typeof industries.$inferSelect),
    products: allProducts.slice(0, 4) as unknown as IndustryDetail["products"],
    services: allServices.slice(0, 3) as unknown as IndustryDetail["services"],
  };
  return detail;
}

export async function getProjects() {
  const { value } = await resolve<Array<typeof projects.$inferSelect>>(
    "projects",
    () =>
      db
        .select()
        .from(projects)
        .where(and(eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt)))
        .orderBy(desc(projects.projectDate)),
    () => bootstrapProjects(),
    { scope: "projects", isEmpty: notEmptyArray },
  );
  return value as Array<typeof projects.$inferSelect>;
}

export async function getProjectBySlug(slug: string, preview = false): Promise<ProjectDetail | null> {
  const published = (await readCollection<Array<Record<string, unknown>>>("projects")) ?? [];
  const fromStatic = published.find((item) => item.slug === slug);
  if (fromStatic) {
    const detail = fromStatic as unknown as { images: Array<Record<string, unknown>>; products: Array<Record<string, unknown>> };
    const staticDetail: ProjectDetail = {
      ...(reviveDates(fromStatic) as typeof projects.$inferSelect),
      images: (detail.images ?? []).map((item) => reviveDates(item)) as ProjectDetail["images"],
      products: (detail.products ?? []).map((item) => reviveDates(item)) as ProjectDetail["products"],
    };
    return staticDetail;
  }

  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), isNull(projects.deletedAt), preview ? undefined : eq(projects.status, "PUBLISHED")))
      .limit(1);
    if (project) {
      const [images, productRows] = await Promise.all([
        db.select().from(projectImages).where(eq(projectImages.projectId, project.id)).orderBy(asc(projectImages.displayOrder)),
        db
          .select({ item: products })
          .from(productProjects)
          .innerJoin(products, eq(productProjects.productId, products.id))
          .where(and(eq(productProjects.projectId, project.id), eq(products.status, "PUBLISHED"), isNull(products.deletedAt))),
      ]);
      backgroundPublish("projects");
      return { ...project, images, products: productRows.map((row) => row.item) };
    }
  } catch (error) {
    logServer("warn", "project.fetch.failed", { slug, message: error instanceof Error ? error.message : "unknown" });
  }

  const project = bootstrapProjects().find((item) => item.slug === slug);
  if (!project) return null;
  const detail: ProjectDetail = {
    ...(reviveDates(project as unknown as Record<string, unknown>) as typeof projects.$inferSelect),
    images: [],
    products: [],
  };
  return detail;
}

export async function getClients() {
  const { value } = await resolve<Array<typeof clients.$inferSelect>>(
    "clients",
    () => db.select().from(clients).where(isNull(clients.deletedAt)).orderBy(asc(clients.displayOrder)),
    () => [],
    { scope: "clients", isEmpty: notEmptyArray },
  );
  return value as Array<typeof clients.$inferSelect>;
}

export type ClientLogo = { id: number; name: string; imageUrl: string; altText: string; width: number | null; height: number | null };

export async function getClientLogos(): Promise<ClientLogo[]> {
  const { value } = await resolve<Array<{ id: number; name: string; imageUrl: string; altText: string; width: number | null; height: number | null }>>(
    "clientLogos",
    async () => {
      const published = (await readCollection<Array<Record<string, unknown>>>("clients")) ?? [];
      const roster = published.length > 0
        ? published.map((row, index) => ({
            id: Number(row.id ?? index + 1),
            name: String(row.name ?? ""),
            imageUrl: String(row.logo ?? ""),
            altText: `${String(row.name ?? "")} logo`,
            width: null as number | null,
            height: null as number | null,
          }))
        : (
            await db
              .select({ id: clients.id, name: clients.name, imageUrl: clients.logo })
              .from(clients)
              .where(isNull(clients.deletedAt))
              .orderBy(asc(clients.displayOrder))
          ).map((row) => ({ id: row.id, name: row.name, imageUrl: row.imageUrl ?? "", altText: `${row.name} logo`, width: null, height: null }));
      return roster;
    },
    () => bootstrapClientLogos(),
    { scope: "client-logos", isEmpty: notEmptyArray },
  );

  const usable = value.filter((logo) => logo.imageUrl && logo.imageUrl.trim());
  if (usable.length > 0) return usable;

  // No CMS logo uploaded yet: fall back to the logo files shipped in public/.
  const localLogos = await getPublicClientLogos();
  if (localLogos.length > 0) return localLogos;
  return value;
}

export async function getGallery() {
  const { value } = await resolve<Array<typeof gallery.$inferSelect>>(
    "gallery",
    () => db.select().from(gallery).where(eq(gallery.status, "PUBLISHED")).orderBy(asc(gallery.displayOrder)),
    () => bootstrapGallery(),
    { scope: "gallery", isEmpty: notEmptyArray },
  );
  return value as Array<typeof gallery.$inferSelect>;
}

export async function getTestimonials() {
  const { value } = await resolve<Array<typeof testimonials.$inferSelect>>(
    "testimonials",
    () => db.select().from(testimonials).where(eq(testimonials.status, "PUBLISHED")).orderBy(asc(testimonials.displayOrder)),
    () => bootstrapTestimonials(),
    { scope: "testimonials", isEmpty: notEmptyArray },
  );
  return value as Array<typeof testimonials.$inferSelect>;
}

/** Reads every published video, with product/service relations flattened to slugs. */
export async function getReelVideos(): Promise<ReelVideoItem[]> {
  const { value } = await resolve<StaticVideo[]>(
    "videos",
    async () => {
      const rows = await db
        .select()
        .from(videos)
        // Must match `generateVideos`, or the live fallback would show reels the
        // static layer deliberately withheld.
        .where(and(eq(videos.status, "PUBLISHED"), eq(videos.isActive, true), isNull(videos.deletedAt)))
        .orderBy(asc(videos.displayOrder));
      if (rows.length === 0) return [];
      const [productLinks, serviceLinks] = await Promise.all([
        db
          .select({ videoId: videoProducts.videoId, slug: products.slug })
          .from(videoProducts)
          .innerJoin(products, eq(videoProducts.productId, products.id)),
        db
          .select({ videoId: videoServices.videoId, slug: services.slug })
          .from(videoServices)
          .innerJoin(services, eq(videoServices.serviceId, services.id)),
      ]);
      const byVideo = (links: Array<{ videoId: number; slug: string }>, id: number) =>
        links.filter((link) => link.videoId === id).map((link) => link.slug);
      return rows.map((row) => ({
        ...(row as unknown as StaticVideo),
        productSlugs: byVideo(productLinks, row.id),
        serviceSlugs: byVideo(serviceLinks, row.id),
      }));
    },
    () => bootstrapVideos(),
    { scope: "videos", isEmpty: notEmptyArray },
  );
  return value as ReelVideoItem[];
}

/** Reels the CMS flagged for the homepage, in the curated display order. */
export async function getHomeReelVideos(limit?: number): Promise<ReelVideoItem[]> {
  const all = (await getReelVideos()).filter((video) => video.showOnHome);
  return typeof limit === "number" ? all.slice(0, limit) : all;
}

/**
 * Reels the CMS flagged for the Products section page.
 *
 * The section page is about the range as a whole, so a Reel needs nothing more
 * than the placement flag. Targeting a single product page is a separate,
 * stricter question handled by `getProductReelVideos`.
 */
export async function getProductsReelVideos(limit?: number): Promise<ReelVideoItem[]> {
  const all = (await getReelVideos()).filter((video) => video.showOnProducts);
  return typeof limit === "number" ? all.slice(0, limit) : all;
}

/** Reels the CMS flagged for the Services section page. Mirrors the Products rule. */
export async function getServicesReelVideos(limit?: number): Promise<ReelVideoItem[]> {
  const all = (await getReelVideos()).filter((video) => video.showOnServices);
  return typeof limit === "number" ? all.slice(0, limit) : all;
}

/**
 * Reels explicitly linked to one product. Videos with no product relation are
 * never returned here: showing an unrelated reel to a product visitor is worse
 * than showing no reel at all.
 */
export async function getProductReelVideos(slug: string, limit?: number): Promise<ReelVideoItem[]> {
  const all = (await getReelVideos()).filter(
    (video) => video.showOnProducts && video.productSlugs.includes(slug),
  );
  return typeof limit === "number" ? all.slice(0, limit) : all;
}

/** Reels explicitly linked to one service. Same no-guessing rule as products. */
export async function getServiceReelVideos(slug: string, limit?: number): Promise<ReelVideoItem[]> {
  const all = (await getReelVideos()).filter(
    (video) => video.showOnServices && video.serviceSlugs.includes(slug),
  );
  return typeof limit === "number" ? all.slice(0, limit) : all;
}

export async function getGlobalFaqs() {
  const { value } = await resolve<Array<typeof faqs.$inferSelect>>(
    "faqs",
    () =>
      db
        .select()
        .from(faqs)
        .where(and(eq(faqs.status, "PUBLISHED"), eq(faqs.entityType, "GLOBAL")))
        .orderBy(asc(faqs.displayOrder)),
    () => bootstrapFaqs(),
    { scope: "faqs", isEmpty: notEmptyArray },
  );
  return value as Array<typeof faqs.$inferSelect>;
}

export async function getPage(slug: string, preview = false) {
  const published = (await readCollection<Array<Record<string, unknown>>>("pages")) ?? [];
  const staticMatch = published.find((row) => row.slug === slug && (preview || row.status === "PUBLISHED"));
  if (staticMatch) return reviveDates(staticMatch) as typeof pages.$inferSelect;

  try {
    const [row] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.slug, slug), isNull(pages.deletedAt), preview ? undefined : eq(pages.status, "PUBLISHED")))
      .limit(1);
    if (row) {
      backgroundPublish("pages");
      return row;
    }
  } catch (error) {
    logServer("warn", "page.fetch.failed", { slug, message: error instanceof Error ? error.message : "unknown" });
  }

  const fallback = (await bootstrapPages()).find((row) => row.slug === slug);
  return fallback ? (reviveDates(fallback as unknown as Record<string, unknown>) as typeof pages.$inferSelect) : null;
}

export async function getBlogPosts() {
  const staticPosts = await readCollection<StaticBlogPostWithCategory[]>("blogPosts");
  if (staticPosts && staticPosts.length > 0) {
    return staticPosts.map((entry) => ({
      post: reviveDates(entry.post as unknown as Record<string, unknown>) as typeof blogPosts.$inferSelect,
      category: entry.category
        ? (reviveDates(entry.category as unknown as Record<string, unknown>) as typeof blogCategories.$inferSelect)
        : null,
    }));
  }
  try {
    const rows = await db
      .select({ post: blogPosts, category: blogCategories })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(and(eq(blogPosts.status, "PUBLISHED"), isNull(blogPosts.deletedAt)))
      .orderBy(desc(blogPosts.publishedAt));
    if (rows.length > 0) {
      backgroundPublish("blog");
      return rows;
    }
  } catch (error) {
    logServer("warn", "blog-posts.fetch.failed", { message: error instanceof Error ? error.message : "unknown" });
  }
  const posts = await bootstrapBlogPosts();
  const categories = bootstrapBlogCategories();
  return posts.map((post) => ({ post: post as unknown as typeof blogPosts.$inferSelect, category: categories.find((item) => item.id === post.categoryId) ?? null }));
}

export async function getBlogPost(slug: string, preview = false) {
  const staticPosts = (await readCollection<StaticBlogPostWithCategory[]>("blogPosts")) ?? [];
  const fromStatic = staticPosts.find((entry) => entry.post.slug === slug);
  if (fromStatic) {
    return {
      post: reviveDates(fromStatic.post as unknown as Record<string, unknown>) as typeof blogPosts.$inferSelect,
      category: fromStatic.category
        ? (reviveDates(fromStatic.category as unknown as Record<string, unknown>) as typeof blogCategories.$inferSelect)
        : null,
    };
  }
  try {
    const rows = await db
      .select({ post: blogPosts, category: blogCategories })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(and(eq(blogPosts.slug, slug), isNull(blogPosts.deletedAt), preview ? undefined : eq(blogPosts.status, "PUBLISHED")))
      .limit(1);
    if (rows[0]) {
      backgroundPublish("blog");
      return rows[0];
    }
  } catch (error) {
    logServer("warn", "blog-post.fetch.failed", { slug, message: error instanceof Error ? error.message : "unknown" });
  }
  const posts = await bootstrapBlogPosts();
  const post = posts.find((item) => item.slug === slug);
  if (!post) return null;
  return { post: post as unknown as typeof blogPosts.$inferSelect, category: bootstrapBlogCategories().find((item) => item.id === post.categoryId) ?? null };
}

export async function getRedirectPath(sourcePath: string) {
  const staticRedirects = (await readCollection<Array<{ sourcePath: string; destinationPath: string }>>("redirects")) ?? [];
  const fromStatic = staticRedirects.find((item) => item.sourcePath === sourcePath);
  if (fromStatic) return fromStatic.destinationPath;
  try {
    const rows = await db.select().from(redirects).where(eq(redirects.sourcePath, sourcePath)).limit(1);
    if (rows[0]) {
      backgroundPublish("redirects");
      return rows[0].destinationPath;
    }
  } catch (error) {
    logServer("warn", "redirects.fetch.failed", { message: error instanceof Error ? error.message : "unknown" });
  }
  return null;
}

export async function getPublishedRoutes(): Promise<StaticRoutes | null> {
  return readCollection<StaticRoutes>("routes");
}

export type SearchResult = {
  title: string;
  slug: string;
  description: string;
  type: string;
  href: string;
};

export async function searchSite(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const staticResults = await searchStatic(trimmed);
  if (staticResults.length > 0) return staticResults;

  try {
    const term = `%${trimmed}%`;
    const [productRows, serviceRows, projectRows, blogRows, pageRows] = await Promise.all([
      db
        .select({ title: products.name, slug: products.slug, description: products.shortDescription })
        .from(products)
        .where(and(eq(products.status, "PUBLISHED"), isNull(products.deletedAt), or(ilike(products.name, term), ilike(products.shortDescription, term))))
        .limit(8),
      db
        .select({ title: services.name, slug: services.slug, description: services.shortDescription })
        .from(services)
        .where(and(eq(services.status, "PUBLISHED"), isNull(services.deletedAt), or(ilike(services.name, term), ilike(services.shortDescription, term))))
        .limit(8),
      db
        .select({ title: projects.title, slug: projects.slug, description: projects.description })
        .from(projects)
        .where(and(eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt), or(ilike(projects.title, term), ilike(projects.description, term))))
        .limit(8),
      db
        .select({ title: blogPosts.title, slug: blogPosts.slug, description: blogPosts.excerpt })
        .from(blogPosts)
        .where(and(eq(blogPosts.status, "PUBLISHED"), isNull(blogPosts.deletedAt), or(ilike(blogPosts.title, term), ilike(blogPosts.excerpt, term))))
        .limit(8),
      db
        .select({ title: pages.title, slug: pages.slug, description: pages.heroDescription })
        .from(pages)
        .where(and(eq(pages.status, "PUBLISHED"), isNull(pages.deletedAt), or(ilike(pages.title, term), ilike(pages.content, term))))
        .limit(8),
    ]);
    return [
      ...productRows.map((x) => ({ ...x, description: x.description ?? "", type: "Product", href: `/products/${x.slug}` })),
      ...serviceRows.map((x) => ({ ...x, description: x.description ?? "", type: "Service", href: `/services/${x.slug}` })),
      ...projectRows.map((x) => ({ ...x, description: x.description ?? "", type: "Project", href: `/projects/${x.slug}` })),
      ...blogRows.map((x) => ({ ...x, description: x.description ?? "", type: "Resource", href: `/blog/${x.slug}` })),
      ...pageRows.map((x) => ({ ...x, description: x.description ?? "", type: "Page", href: `/${x.slug}` })),
    ];
  } catch (error) {
    logServer("warn", "search.fetch.failed", { message: error instanceof Error ? error.message : "unknown" });
  }
  return staticResults.length > 0 ? staticResults : catalogueSearch(trimmed);
}

async function searchStatic(query: string): Promise<SearchResult[]> {
  const [products, services, projects, industries, posts, pages] = await Promise.all([
    readCollection<Array<{ name: string; slug: string; shortDescription: string; description: string }>>("products"),
    readCollection<Array<{ name: string; slug: string; shortDescription: string; description: string }>>("services"),
    readCollection<Array<{ title: string; slug: string; description: string }>>("projects"),
    readCollection<Array<{ name: string; slug: string; shortDescription: string; description: string }>>("industries"),
    readCollection<StaticBlogPostWithCategory[]>("blogPosts"),
    readCollection<Array<{ title: string; slug: string; content: string; heroDescription: string | null }>>("pages"),
  ]);
  const needle = query.toLowerCase();
  const matches = (value: string | null | undefined) => Boolean(value && value.toLowerCase().includes(needle));
  const results: SearchResult[] = [];
  for (const product of products ?? []) {
    if (matches(product.name) || matches(product.shortDescription)) {
      results.push({ title: product.name, slug: product.slug, description: product.shortDescription, type: "Product", href: `/products/${product.slug}` });
    }
  }
  for (const service of services ?? []) {
    if (matches(service.name) || matches(service.shortDescription)) {
      results.push({ title: service.name, slug: service.slug, description: service.shortDescription, type: "Service", href: `/services/${service.slug}` });
    }
  }
  for (const project of projects ?? []) {
    if (matches(project.title) || matches(project.description)) {
      results.push({ title: project.title, slug: project.slug, description: project.description, type: "Project", href: `/projects/${project.slug}` });
    }
  }
  for (const industry of industries ?? []) {
    if (matches(industry.name) || matches(industry.shortDescription)) {
      results.push({ title: industry.name, slug: industry.slug, description: industry.shortDescription, type: "Industry", href: `/industries/${industry.slug}` });
    }
  }
  for (const entry of posts ?? []) {
    if (matches(entry.post.title) || matches(entry.post.excerpt)) {
      results.push({ title: entry.post.title, slug: entry.post.slug, description: entry.post.excerpt, type: "Resource", href: `/blog/${entry.post.slug}` });
    }
  }
  for (const page of pages ?? []) {
    if (matches(page.title) || matches(page.heroDescription)) {
      results.push({ title: page.title, slug: page.slug, description: page.heroDescription ?? "", type: "Page", href: `/${page.slug}` });
    }
  }
  return results.slice(0, 24);
}

function catalogueSearch(query: string): SearchResult[] {
  const needle = query.toLowerCase();
  return catalogueProducts
    .filter((product) => getCatalogueSearchText(product).includes(needle))
    .slice(0, 8)
    .map((product) => ({
      title: product.name,
      slug: product.slug,
      description: product.shortDescription,
      type: "Product",
      href: getCatalogueProductHref(product),
    }));
}

export async function getDashboardStats() {
  const [productList, serviceList, projectList, clientList] = await Promise.all([
    getProducts(),
    getServices(),
    getProjects(),
    getClients(),
  ]);
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
    products: Number(counts[0][0]?.value ?? productList.length),
    services: Number(counts[1][0]?.value ?? serviceList.length),
    projects: Number(counts[2][0]?.value ?? projectList.length),
    clients: Number(counts[3][0]?.value ?? clientList.length),
    newInquiries: Number(counts[4][0]?.value ?? 0),
    newMessages: Number(counts[5][0]?.value ?? 0),
    catalogDownloads: Number(counts[6][0]?.value ?? 0),
    draftProducts: Number(counts[7][0]?.value ?? 0),
    recent,
    statuses,
    recentActivity,
  };
}
