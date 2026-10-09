import "server-only";
import { db, dbConfigured } from "@/db";
import {
  activityLogs, blogCategories, blogPosts, catalogDownloads, clientLogos, contactMessages, faqs, gallery, homeOfferCards, homeSliders, homepageSections, industries, inquiries,
  pages, productApplications, productBenefits, productComponents, productConfigurations, productFeatures, productGalleryImages, productImages, productIndustries, productProjects,

  productRelatedProducts, productSections, productSpecifications, productStoredMaterials, productStories, productWorkflows, products, projectImages, projects, redirects,
  seoSettings, serviceFeatures, serviceIndustries, serviceProjects, services, siteSettings, testimonials, videoProducts, videos, videoServices,
} from "@/db/schema";
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { logServer } from "@/lib/logger";
import { cacheContent } from "@/lib/cache";
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
import { reviveDates, reviveDeep, type StaticBlogPostWithCategory, type StaticProductDetail, type StaticVideo } from "@/lib/publish/types";
import { getPublicClientLogos } from "@/lib/client-assets";
import { homeOfferCardSeeds } from "@/lib/home-offer-cards";
import { buildProductIndex, resolveHomeProductCards, type HomeProductCard } from "@/lib/home-products";
import { getPrimaryProductImages, getPrimaryCatalogueImages } from "@/lib/product-primary-images";
import { buildRelatedProducts } from "@/lib/product-related";
import type { ReelVideoItem } from "@/lib/reel-video";


/**
 * Public content read layer.
 *
 * Neon is the single source of truth for every getter. The committed
 * `src/data/*.json` files are a build artefact and an offline seed only: they are
 * read when there is no database (a static build with no `DATABASE_URL`), never
 * to shadow a live row, so an admin edit can never disappear behind a stale file.
 *
 * Priority for every getter:
 *   1. Neon (cached in the incremental cache, tagged `cms-content`)
 *   2. Curated local fallback content, so a fresh or offline site is never blank
 *   3. Published static JSON, only when no database is configured
 *
 * A database that is configured but unreachable throws in production rather than
 * silently serving the committed JSON: a stale page that looks healthy is worse
 * than a visible error, because it hides the outage and can serve content the
 * editor has already replaced.
 */

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

/**
 * Reads a live query through the content cache and revives its dates.
 *
 * A JSON round-trip through the incremental cache turns every `Date` column into
 * a string, at every depth, so the whole payload is revived rather than only the
 * top-level row (`reviveStatic`).
 */
async function readDatabase<T>(key: CollectionKey, cacheKey: string[], load: () => Promise<T>): Promise<T> {
  return reviveDeep(await cacheContent([key, ...cacheKey], load));
}

async function resolve<T>(
  key: CollectionKey,
  load: () => Promise<T>,
  fallback: () => Promise<unknown> | unknown,
  options: { isEmpty?: (value: unknown) => boolean; cacheKey?: string[] } = {},
): Promise<Resolved<T>> {
  if (dbConfigured) {
    try {
      const fromDatabase = await readDatabase(key, options.cacheKey ?? [], load);
      if (fromDatabase !== null && fromDatabase !== undefined && !(options.isEmpty?.(fromDatabase) ?? false)) {
        return { value: fromDatabase, source: "database" };
      }
      // A reachable database holding an empty collection is a real answer, but
      // curated bootstrap content is preferred over a blank section on a fresh
      // install. The committed JSON is never used to fill it: only the database
      // or the code-level seed can answer.
      return { value: (await fallback()) as T, source: "fallback" };
    } catch (error) {
      logServer("error", `${key}.fetch.failed`, { message: error instanceof Error ? error.message : "unknown" });
      if (process.env.NODE_ENV === "production") throw error;
    }
  }

  const published = await readCollection<unknown>(key);
  if (published !== null && published !== undefined) {
    const revived = reviveStatic(published);
    if (!(options.isEmpty?.(revived) ?? false)) return { value: revived as T, source: "static" };
  }

  // Bootstrap data is authored as serializable JSON, so it is cast to the live row shape.
  return { value: (await fallback()) as T, source: "fallback" };
}

const notEmptyArray = (value: unknown) => (Array.isArray(value) ? value.length === 0 : value === null || value === undefined);

/**
 * True when a published payload is structurally usable.
 *
 * The static layer is preferred over the database precisely so the site keeps
 * serving content while Neon is paused, so a broken published file would
 * otherwise win forever. A slider list that no longer carries a single
 * photograph is exactly that: it is the fingerprint of a publish run whose
 * downloads all failed, and honouring it would leave the hero permanently
 * blank while the CMS row in front of it holds a perfectly good image. Treating
 * it as unusable falls through to the database, which re-publishes and repairs
 * the file, and a genuine outage still ends at the curated bootstrap content.
 */
function slidesWithoutImages(value: unknown) {
  if (!Array.isArray(value)) return notEmptyArray(value);
  if (value.length === 0) return true;
  return value.every((slide) => {
    const row = isPlainRecord(slide) ? slide : {};
    return !text(row.imageUrl) && !text(row.mobileImageUrl) && !text(row.videoUrl);
  });
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");


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
  );
  const record = Array.isArray(value) ? value[0] : value;
  return record ? reviveDates(record as unknown as Record<string, unknown>) as SiteSettingsRow : DEFAULT_SITE_SETTINGS;
}

export async function getSeoSettings() {
  const { value } = await resolve<typeof seoSettings.$inferSelect | null>(
    "seo",
    () => db.select().from(seoSettings).limit(1).then((rows) => rows[0] ?? null),
    () => null,
    { isEmpty: (row) => row === null },
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
    { isEmpty: notEmptyArray },
  );
  return Object.fromEntries(
    (value as Array<typeof homepageSections.$inferSelect>).map((row) => [
      row.sectionKey,
      reviveDates(row as unknown as Record<string, unknown>) as typeof homepageSections.$inferSelect,
    ]),
  );
}

export type HomeSlide = typeof homeSliders.$inferSelect;

export type HomeOfferCard = typeof homeOfferCards.$inferSelect;

/**
 * A card with its product's own copy already folded in, in display order.
 *
 * The raw row is not enough to render: every field is an override that may be
 * empty, and the product it points at may live in `products` or only in the
 * code-defined catalogue. `home-products.ts` does that resolution, so the
 * homepage receives a card that always has a name, an image and a destination.
 */
export type ResolvedHomeOfferCard = HomeProductCard;

/**
 * The homepage "What We Offer" cards, resolved and in display order.
 *
 * Cards point at products rather than duplicating them, so this reads the
 * products alongside the card rows and merges the two. Falls back to the curated
 * default shortlist so a freshly-migrated site still shows a full row of cards
 * before anyone has created them in the CMS. Hidden cards are already withheld by
 * the static generator, so nothing filters here.
 */
export async function getHomeOfferCards(): Promise<ResolvedHomeOfferCard[]> {
  const [{ value }, databaseProducts] = await Promise.all([
    resolve<HomeOfferCard[]>(
      "homeOfferCards",
      () =>
        db
          .select()
          .from(homeOfferCards)
          .where(eq(homeOfferCards.isActive, true))
          .orderBy(asc(homeOfferCards.displayOrder), asc(homeOfferCards.id)),
      () => fallbackOfferCards(),
      // No `isEmpty` guard, deliberately. A published `[]` means the editor
      // switched every card off, and that is an answer, not a missing file.
      // Treating it as empty made the reader fall through to the database and
      // then to the hardcoded seed cards, so disabling the last card brought
      // the deleted set back. A collection that has never been published has no
      // file at all, and `readCollection` returns null for that on its own.
      {},
    ),
    getProducts(),
  ]);
  /**
   * The same primary-image resolution the product detail page performs, for
   * every product at once and for both product systems. Passing these in is what
   * makes a card's image the head of the product's own image list rather than an
   * independent guess.
   */
  const [primaryImages, cataloguePrimaryImages] = await Promise.all([
    getPrimaryProductImages(databaseProducts),
    getPrimaryCatalogueImages(catalogueProducts),
  ]);
  return resolveHomeProductCards(
    value as HomeOfferCard[],
    buildProductIndex({ databaseProducts, primaryImages, catalogueProducts, cataloguePrimaryImages }),
  );
}

/**
 * Local stand-ins for the default cards.
 *
 * Only the pointer is filled in. Every other column is left null on purpose, so
 * the card falls back to the product's own name, description, image, badge and
 * link — the same source the CMS cards use. Hardcoding any of them here would
 * create a second place to update every time a product changes.
 */
function fallbackOfferCards(): HomeOfferCard[] {
  const now = new Date(0);
  return homeOfferCardSeeds.map((seed, index) => ({
    id: index + 1,
    productId: null,
    title: null,
    slug: seed.slug,
    description: null,
    imageUrl: null,
    imagePublicId: null,
    altText: null,
    category: null,
    href: null,
    ctaLabel: null,
    showQuoteButton: true,
    displayOrder: index,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));
}


export type ProductDetail = typeof products.$inferSelect & {
  features: Array<typeof productFeatures.$inferSelect>;
  specifications: Array<typeof productSpecifications.$inferSelect>;
  applications: Array<typeof productApplications.$inferSelect>;
  images: Array<typeof productImages.$inferSelect>;
  gallery: Array<typeof productGalleryImages.$inferSelect>;
  benefits: Array<typeof productBenefits.$inferSelect>;

  components: Array<typeof productComponents.$inferSelect>;
  configurations: Array<typeof productConfigurations.$inferSelect>;
  storedMaterials: Array<typeof productStoredMaterials.$inferSelect>;
  stories: Array<typeof productStories.$inferSelect>;
  workflows: Array<typeof productWorkflows.$inferSelect>;
  faqs: Array<typeof faqs.$inferSelect>;
  sections: Array<typeof productSections.$inferSelect>;
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
    { isEmpty: slidesWithoutImages },
  );
  return value;
}

export async function getProducts(featuredOnly = false) {
  const { value } = await resolve<Array<typeof products.$inferSelect>>(
    "products",
    () =>
      db
        .select()
        .from(products)
        .where(and(eq(products.status, "PUBLISHED"), isNull(products.deletedAt), featuredOnly ? eq(products.featured, true) : undefined))
        .orderBy(asc(products.displayOrder)),
    () => bootstrapProducts(),
    { isEmpty: notEmptyArray, cacheKey: [featuredOnly ? "featured" : "all"] },
  );
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
  if (base.length === 0) return [];

  // Offline: the published product detail carries its own children. Online: read
  // the three child tables in bulk rather than a query per product, and only keep
  // the first specification / application per product and an image count, which
  // is all the catalogue listing renders.
  if (!dbConfigured) {
    const published = (await readCollection<StaticProductDetail[]>("products")) ?? [];
    return base.map((product) => {
      const detail = published.find((entry) => entry.slug === product.slug);
      const specifications = detail?.specifications ?? [];
      const applications = detail?.applications ?? [];
      return {
        ...product,
        keySpec: specifications[0] ? { name: specifications[0].specificationName, value: specifications[0].specificationValue } : null,
        application: applications[0]?.application ?? null,
        applicationTitle: applications[0]?.title ?? null,
        imageCount: detail?.images.length ?? 0,
      };
    });
  }

  const ids = base.map((product) => product.id);
  const [specRows, applicationRows, imageRows] = await cacheContent(["products", "catalogue-children"], () =>
    Promise.all([
      db
        .select({ productId: productSpecifications.productId, specificationName: productSpecifications.specificationName, specificationValue: productSpecifications.specificationValue })
        .from(productSpecifications)
        .where(inArray(productSpecifications.productId, ids))
        .orderBy(asc(productSpecifications.displayOrder)),
      db
        .select({ productId: productApplications.productId, application: productApplications.application, title: productApplications.title })
        .from(productApplications)
        .where(inArray(productApplications.productId, ids))
        .orderBy(asc(productApplications.displayOrder)),
      db.select({ productId: productImages.productId }).from(productImages).where(inArray(productImages.productId, ids)),
    ]),
  );

  const firstSpec = new Map<number, { name: string; value: string }>();
  for (const row of specRows) {
    if (!firstSpec.has(row.productId)) firstSpec.set(row.productId, { name: row.specificationName, value: row.specificationValue });
  }
  const firstApplication = new Map<number, { application: string | null; title: string | null }>();
  for (const row of applicationRows) {
    if (!firstApplication.has(row.productId)) firstApplication.set(row.productId, { application: row.application, title: row.title });
  }
  const imageCounts = new Map<number, number>();
  for (const row of imageRows) imageCounts.set(row.productId, (imageCounts.get(row.productId) ?? 0) + 1);

  return base.map((product) => {
    const application = firstApplication.get(product.id) ?? null;
    return {
      ...product,
      keySpec: firstSpec.get(product.id) ?? null,
      application: application?.application ?? null,
      applicationTitle: application?.title ?? null,
      imageCount: imageCounts.get(product.id) ?? 0,
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
  if (dbConfigured) {
    try {
      const detail = await cacheContent(["product", slug, preview ? "preview" : "published"], async () => {
        const [product] = await db
          .select()
          .from(products)
          .where(and(eq(products.slug, slug), isNull(products.deletedAt), preview ? undefined : eq(products.status, "PUBLISHED")))
          .limit(1);
        if (!product) return null;
        const [
          features,
          specifications,
          applications,
          images,
          gallery,
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
          sectionRows,
        ] = await Promise.all([
          db.select().from(productFeatures).where(eq(productFeatures.productId, product.id)).orderBy(asc(productFeatures.displayOrder)),
          db.select().from(productSpecifications).where(eq(productSpecifications.productId, product.id)).orderBy(asc(productSpecifications.displayOrder)),
          db.select().from(productApplications).where(eq(productApplications.productId, product.id)).orderBy(asc(productApplications.displayOrder)),
          db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.displayOrder)),
          db.select().from(productGalleryImages).where(eq(productGalleryImages.productId, product.id)).orderBy(asc(productGalleryImages.displayOrder)),

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
            .where(and(eq(productRelatedProducts.productId, product.id), eq(productRelatedProducts.isActive, true), eq(products.isActive, true), eq(products.status, "PUBLISHED"), isNull(products.deletedAt)))
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
          db.select().from(productSections).where(eq(productSections.productId, product.id)).orderBy(asc(productSections.displayOrder)),
        ]);
        const allProducts = await getProducts();
        /*
         * Related products, from the same helper the publish generator uses.
         *
         * This block used to hold its own copy of the rule ("the editor's picks, or
         * a three-item same-category sample"), which is how the same defect existed
         * in two places at once: the published `products.json` and this database
         * fallback disagreed about what belongs in the strip, and a product added in
         * the CMS was recommended on no other product page until an editor also
         * linked it into `productRelatedProducts` for each one by hand. The picks
         * still lead, in editor order; the rest of the live catalogue follows.
         */
        const related = buildRelatedProducts(
          relatedRows.map((row) => row.item),
          allProducts,
          product,
        );
        return {
          ...product,
          features,
          specifications,
          applications,
          images,
          gallery,
          benefits,

          components,
          configurations,
          storedMaterials,
          stories,
          workflows,
          faqs: productFaqs,
          sections: sectionRows,
          related,
          industries: industryRows.map((row) => row.item),
          projects: projectRows.map((row) => row.item),
        };
      });
      if (detail) return reviveDeep(detail);
    } catch (error) {
      logServer("error", "product.fetch.failed", { slug, message: error instanceof Error ? error.message : "unknown" });
      if (process.env.NODE_ENV === "production") throw error;
    }
  }

  // No database: the committed detail (offline build) or the catalogue-derived
  // seed. A configured database that has no such row falls through to the seed so
  // a catalogue-only slug still resolves rather than looping on a redirect.
  const publishedProducts = dbConfigured ? [] : (await readCollection<StaticProductDetail[]>("products")) ?? [];
  const fromStatic = publishedProducts.find((item) => item.slug === slug);
  if (fromStatic) return reviveProductDetail(fromStatic);

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
    gallery: (Array.isArray(children.gallery) ? children.gallery : []) as unknown as ProductDetail["gallery"],
    benefits: [],

    components: [],
    configurations: [],
    storedMaterials: [],
    stories: [],
    workflows: [],
    faqs: [],
    sections: [],
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
    gallery: (detail.gallery ?? []).map(revive) as unknown as ProductDetail["gallery"],

    benefits: detail.benefits.map(revive) as unknown as ProductDetail["benefits"],
    components: detail.components.map(revive) as unknown as ProductDetail["components"],
    configurations: detail.configurations.map(revive) as unknown as ProductDetail["configurations"],
    storedMaterials: detail.storedMaterials.map(revive) as unknown as ProductDetail["storedMaterials"],
    stories: detail.stories.map(revive) as unknown as ProductDetail["stories"],
    sections: ((detail.sections ?? []) as unknown[]).map(revive) as unknown as ProductDetail["sections"],
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
    { isEmpty: notEmptyArray },
  );
  const featured = value.filter((row) => row.featured);
  return featuredOnly && featured.length > 0 ? featured : value;
}

export async function getServiceBySlug(slug: string, preview = false): Promise<ServiceDetail | null> {
  if (dbConfigured) {
    try {
      const detail = await cacheContent(["service", slug, preview ? "preview" : "published"], async () => {
        const [service] = await db
          .select()
          .from(services)
          .where(and(eq(services.slug, slug), isNull(services.deletedAt), preview ? undefined : eq(services.status, "PUBLISHED")))
          .limit(1);
        if (!service) return null;
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
        return { ...service, features, faqs: serviceFaqs, industries: industryRows.map((row) => row.item), projects: projectRows.map((row) => row.item) };
      });
      if (detail) return reviveDeep(detail);
    } catch (error) {
      logServer("error", "service.fetch.failed", { slug, message: error instanceof Error ? error.message : "unknown" });
      if (process.env.NODE_ENV === "production") throw error;
    }
  }

  const published = dbConfigured ? [] : (await readCollection<Array<Record<string, unknown>>>("services")) ?? [];
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
    { isEmpty: notEmptyArray },
  );
  return value as Array<typeof industries.$inferSelect>;
}

export async function getIndustryBySlug(slug: string): Promise<IndustryDetail | null> {
  if (dbConfigured) {
    try {
      const detail = await cacheContent(["industry", slug], async () => {
        const [industry] = await db
          .select()
          .from(industries)
          .where(and(eq(industries.slug, slug), eq(industries.status, "PUBLISHED")))
          .limit(1);
        if (!industry) return null;
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
        return {
          ...industry,
          products: assignedProducts.length ? assignedProducts.map((row) => row.item) : fallbackProducts.slice(0, 4),
          services: assignedServices.length ? assignedServices.map((row) => row.item).slice(0, 4) : fallbackServices.slice(0, 3),
        };
      });
      if (detail) return reviveDeep(detail);
    } catch (error) {
      logServer("error", "industry.fetch.failed", { slug, message: error instanceof Error ? error.message : "unknown" });
      if (process.env.NODE_ENV === "production") throw error;
    }
  }

  const published = dbConfigured ? [] : (await readCollection<Array<Record<string, unknown>>>("industries")) ?? [];
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
    { isEmpty: notEmptyArray },
  );
  return value as Array<typeof projects.$inferSelect>;
}

export async function getProjectBySlug(slug: string, preview = false): Promise<ProjectDetail | null> {
  if (dbConfigured) {
    try {
      const detail = await cacheContent(["project", slug, preview ? "preview" : "published"], async () => {
        const [project] = await db
          .select()
          .from(projects)
          .where(and(eq(projects.slug, slug), isNull(projects.deletedAt), preview ? undefined : eq(projects.status, "PUBLISHED")))
          .limit(1);
        if (!project) return null;
        const [images, productRows] = await Promise.all([
          db.select().from(projectImages).where(eq(projectImages.projectId, project.id)).orderBy(asc(projectImages.displayOrder)),
          db
            .select({ item: products })
            .from(productProjects)
            .innerJoin(products, eq(productProjects.productId, products.id))
            .where(and(eq(productProjects.projectId, project.id), eq(products.status, "PUBLISHED"), isNull(products.deletedAt))),
        ]);
        return { ...project, images, products: productRows.map((row) => row.item) };
      });
      if (detail) return reviveDeep(detail);
    } catch (error) {
      logServer("error", "project.fetch.failed", { slug, message: error instanceof Error ? error.message : "unknown" });
      if (process.env.NODE_ENV === "production") throw error;
    }
  }

  const published = dbConfigured ? [] : (await readCollection<Array<Record<string, unknown>>>("projects")) ?? [];
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

  const project = bootstrapProjects().find((item) => item.slug === slug);
  if (!project) return null;
  const detail: ProjectDetail = {
    ...(reviveDates(project as unknown as Record<string, unknown>) as typeof projects.$inferSelect),
    images: [],
    products: [],
  };
  return detail;
}

export type ClientLogo = { id: number; name: string; imageUrl: string; altText: string; width: number | null; height: number | null };

/**
 * The client logo roster, from `client_logos` — the single source of truth.
 *
 * This used to be a second, parallel implementation that read the retired
 * `clients` table, meaning `/admin/client-logos` edits had no effect on the
 * site: the published `client_logos.json` held rows with an empty `imageUrl`,
 * which the filter below rejected, and the site silently fell through to the
 * files in `public/rack-and-stack-clients` while the CMS reported eight
 * perfectly good logos. There was also a full-table scan of `clients` on the
 * request path.
 *
 * It now reads the same collection the CMS writes, so an edit in Admin is
 * published and visible immediately. The static-first priority is unchanged:
 * published `client-logos.json` first, then the `client_logos` table (which
 * re-publishes itself so the file catches up), then the curated local files as
 * a last resort so the section is never blank.
 */
export async function getClientLogos(): Promise<ClientLogo[]> {
  const { value } = await resolve<Array<{ id: number; name: string; imageUrl: string; altText: string; width: number | null; height: number | null }>>(
    "clientLogos",
    async () => {
      const rows = await db
        .select({
          id: clientLogos.id,
          name: clientLogos.name,
          imageUrl: clientLogos.imageUrl,
          altText: clientLogos.altText,
          width: clientLogos.width,
          height: clientLogos.height,
        })
        .from(clientLogos)
        .where(eq(clientLogos.isActive, true))
        .orderBy(asc(clientLogos.sortOrder), asc(clientLogos.id));
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        imageUrl: row.imageUrl ?? "",
        altText: row.altText,
        width: row.width ?? null,
        height: row.height ?? null,
      }));
    },
    () => bootstrapClientLogos(),
    { isEmpty: notEmptyArray },
  );

  const usable = value.filter((logo) => logo.imageUrl && logo.imageUrl.trim());
  if (usable.length > 0) return usable;

  // No CMS logo carries an image yet: fall back to the logo files shipped in
  // public/ so the section still renders rather than going blank.
  const localLogos = await getPublicClientLogos();
  if (localLogos.length > 0) return localLogos;
  return value;
}

export async function getGallery() {
  const { value } = await resolve<Array<typeof gallery.$inferSelect>>(
    "gallery",
    () => db.select().from(gallery).where(eq(gallery.status, "PUBLISHED")).orderBy(asc(gallery.displayOrder)),
    () => bootstrapGallery(),
    { isEmpty: notEmptyArray },
  );
  return value as Array<typeof gallery.$inferSelect>;
}

/**
 * The published testimonials, in the order an editor arranged them.
 *
 * Only `PUBLISHED` rows are read, so a draft never reaches the homepage. The
 * secondary sort on `id` matters more than it looks: `displayOrder` is a plain
 * integer an editor renumbers, and two rows left on the same value have no
 * defined order between them, so the carousel could show them in a different
 * sequence on the next render than it did on the last. Ties now always break the
 * same way, and the order matches what `generateTestimonials` writes to disk.
 */
export async function getTestimonials() {
  const { value } = await resolve<Array<typeof testimonials.$inferSelect>>(
    "testimonials",
    () => db.select().from(testimonials).where(eq(testimonials.status, "PUBLISHED")).orderBy(asc(testimonials.displayOrder), asc(testimonials.id)),
    () => bootstrapTestimonials(),
    { isEmpty: notEmptyArray },
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
    { isEmpty: notEmptyArray },
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
    { isEmpty: notEmptyArray },
  );
  return value as Array<typeof faqs.$inferSelect>;
}

export async function getPage(slug: string, preview = false) {
  if (dbConfigured) {
    try {
      const row = await cacheContent(["page", slug, preview ? "preview" : "published"], async () => {
        const [found] = await db
          .select()
          .from(pages)
          .where(and(eq(pages.slug, slug), isNull(pages.deletedAt), preview ? undefined : eq(pages.status, "PUBLISHED")))
          .limit(1);
        return found ?? null;
      });
      if (row) return reviveDeep(row) as typeof pages.$inferSelect;
    } catch (error) {
      logServer("error", "page.fetch.failed", { slug, message: error instanceof Error ? error.message : "unknown" });
      if (process.env.NODE_ENV === "production") throw error;
    }
  }

  const published = dbConfigured ? [] : (await readCollection<Array<Record<string, unknown>>>("pages")) ?? [];
  const staticMatch = published.find((row) => row.slug === slug && (preview || row.status === "PUBLISHED"));
  if (staticMatch) return reviveDates(staticMatch) as typeof pages.$inferSelect;

  const fallback = (await bootstrapPages()).find((row) => row.slug === slug);
  return fallback ? (reviveDates(fallback as unknown as Record<string, unknown>) as typeof pages.$inferSelect) : null;
}

/**
 * The slugs of every published CMS page, for `generateStaticParams`.
 *
 * Reads the live table first, falling back to the published collection and then
 * the bootstrap set when there is no database. Drafts and soft-deleted pages are
 * excluded so they cannot be prerendered into the public build.
 */
export async function getPageSlugs(): Promise<string[]> {
  if (dbConfigured) {
    try {
      const rows = await cacheContent(["pages", "slugs"], () =>
        db.select({ slug: pages.slug }).from(pages).where(and(eq(pages.status, "PUBLISHED"), isNull(pages.deletedAt))),
      );
      return [...new Set(rows.map((row) => row.slug))];
    } catch (error) {
      logServer("error", "pages.slugs.fetch.failed", { message: error instanceof Error ? error.message : "unknown" });
      if (process.env.NODE_ENV === "production") throw error;
    }
  }

  const published = await readCollection<Array<{ slug?: unknown; status?: unknown; deletedAt?: unknown }>>("pages");
  const fromStatic = (published ?? [])
    .filter((row) => row.status === "PUBLISHED" && !row.deletedAt && typeof row.slug === "string")
    .map((row) => row.slug as string);
  if (fromStatic.length > 0) return [...new Set(fromStatic)];

  const fallback = await bootstrapPages();
  return [...new Set(fallback.filter((row) => row.status === "PUBLISHED" && !row.deletedAt).map((row) => row.slug))];
}

export async function getBlogPosts() {
  if (dbConfigured) {
    try {
      const rows = await cacheContent(["blogPosts", "published"], () =>
        db
          .select({ post: blogPosts, category: blogCategories })
          .from(blogPosts)
          .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
          .where(and(eq(blogPosts.status, "PUBLISHED"), isNull(blogPosts.deletedAt)))
          .orderBy(desc(blogPosts.publishedAt)),
      );
      // The post's `publishedAt`/`updatedAt` are consumed as Dates by the blog
      // page, so the JSON-round-tripped rows have to be revived.
      return reviveDeep(rows);
    } catch (error) {
      logServer("error", "blog-posts.fetch.failed", { message: error instanceof Error ? error.message : "unknown" });
      if (process.env.NODE_ENV === "production") throw error;
    }
  }

  const staticPosts = await readCollection<StaticBlogPostWithCategory[]>("blogPosts");
  if (staticPosts && staticPosts.length > 0) {
    return staticPosts.map((entry) => ({
      post: reviveDates(entry.post as unknown as Record<string, unknown>) as typeof blogPosts.$inferSelect,
      category: entry.category
        ? (reviveDates(entry.category as unknown as Record<string, unknown>) as typeof blogCategories.$inferSelect)
        : null,
    }));
  }
  const posts = await bootstrapBlogPosts();
  const categories = bootstrapBlogCategories();
  // Same revival as `getBlogPost`: bootstrap rows hold ISO strings, not Dates.
  return posts.map((post) => {
    const category = categories.find((item) => item.id === post.categoryId);
    return {
      post: reviveDates(post as unknown as Record<string, unknown>) as typeof blogPosts.$inferSelect,
      category: category
        ? (reviveDates(category as unknown as Record<string, unknown>) as typeof blogCategories.$inferSelect)
        : null,
    };
  });
}

export async function getBlogPost(slug: string, preview = false) {
  if (dbConfigured) {
    try {
      const rows = await cacheContent(["blogPost", slug, preview ? "preview" : "published"], () =>
        db
          .select({ post: blogPosts, category: blogCategories })
          .from(blogPosts)
          .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
          .where(and(eq(blogPosts.slug, slug), isNull(blogPosts.deletedAt), preview ? undefined : eq(blogPosts.status, "PUBLISHED")))
          .limit(1),
      );
      if (rows[0]) return reviveDeep(rows[0]);
    } catch (error) {
      logServer("error", "blog-post.fetch.failed", { slug, message: error instanceof Error ? error.message : "unknown" });
      if (process.env.NODE_ENV === "production") throw error;
    }
  }

  const staticPosts = dbConfigured ? [] : (await readCollection<StaticBlogPostWithCategory[]>("blogPosts")) ?? [];
  const fromStatic = staticPosts.find((entry) => entry.post.slug === slug);
  if (fromStatic) {
    return {
      post: reviveDates(fromStatic.post as unknown as Record<string, unknown>) as typeof blogPosts.$inferSelect,
      category: fromStatic.category
        ? (reviveDates(fromStatic.category as unknown as Record<string, unknown>) as typeof blogCategories.$inferSelect)
        : null,
    };
  }
  const posts = await bootstrapBlogPosts();
  const post = posts.find((item) => item.slug === slug);
  if (!post) return null;
  // Bootstrap rows carry ISO strings (`publishedAt: EPOCH`), so they have to be
  // revived like the static-file rows above. Without this the cast lies: the
  // page calls `post.publishedAt?.toISOString()` and throws while prerendering
  // any post that only exists in the bootstrap set.
  const category = bootstrapBlogCategories().find((item) => item.id === post.categoryId);
  return {
    post: reviveDates(post as unknown as Record<string, unknown>) as typeof blogPosts.$inferSelect,
    category: category
      ? (reviveDates(category as unknown as Record<string, unknown>) as typeof blogCategories.$inferSelect)
      : null,
  };
}

export async function getRedirectPath(sourcePath: string) {
  if (dbConfigured) {
    try {
      const rows = await cacheContent(["redirect", sourcePath], () =>
        db.select().from(redirects).where(eq(redirects.sourcePath, sourcePath)).limit(1),
      );
      return rows[0]?.destinationPath ?? null;
    } catch (error) {
      logServer("error", "redirects.fetch.failed", { message: error instanceof Error ? error.message : "unknown" });
      if (process.env.NODE_ENV === "production") throw error;
    }
  }

  const staticRedirects = (await readCollection<Array<{ sourcePath: string; destinationPath: string }>>("redirects")) ?? [];
  return staticRedirects.find((item) => item.sourcePath === sourcePath)?.destinationPath ?? null;
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

  if (!dbConfigured) {
    const staticResults = await searchStatic(trimmed);
    return staticResults.length > 0 ? staticResults : catalogueSearch(trimmed);
  }

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
    logServer("error", "search.fetch.failed", { message: error instanceof Error ? error.message : "unknown" });
    if (process.env.NODE_ENV === "production") throw error;
  }
  return catalogueSearch(trimmed);
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
  const [productList, serviceList, projectList, logoList] = await Promise.all([
    getProducts(),
    getServices(),
    getProjects(),
    getClientLogos(),
  ]);
  const counts = await Promise.all([
    db.select({ value: sql<number>`count(*)` }).from(products).where(isNull(products.deletedAt)),
    db.select({ value: sql<number>`count(*)` }).from(services).where(isNull(services.deletedAt)),
    db.select({ value: sql<number>`count(*)` }).from(projects).where(isNull(projects.deletedAt)),
    // Counts the roster an editor actually manages. The retired `clients` table
    // was never the source of the site's logos, so counting it reported a number
    // that had nothing to do with what the homepage shows.
    db.select({ value: sql<number>`count(*)` }).from(clientLogos),
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
    clients: Number(counts[3][0]?.value ?? logoList.length),
    newInquiries: Number(counts[4][0]?.value ?? 0),
    newMessages: Number(counts[5][0]?.value ?? 0),
    catalogDownloads: Number(counts[6][0]?.value ?? 0),
    draftProducts: Number(counts[7][0]?.value ?? 0),
    recent,
    statuses,
    recentActivity,
  };
}
