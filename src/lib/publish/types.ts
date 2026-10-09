import type {
  blogCategories,
  blogPosts,
  clientLogos,
  faqs,
  gallery,
  homeSliders,
  homeOfferCards,
  homepageSections,
  industries,
  pages,
  productApplications,
  productBenefits,
  productComponents,
  productConfigurations,
  productFeatures,
  productGalleryImages,
  productImages,
  productRelatedProducts,
  productSpecifications,
  productStoredMaterials,
  productStories,
  productWorkflows,
  products,
  projectImages,
  projects,
  redirects,
  seoSettings,
  serviceFeatures,
  services,
  siteSettings,
  testimonials,
  videos,
} from "@/db/schema";

/** Dates become ISO strings; everything else keeps its JSON shape. */
type Serialized<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
      ? string | null
      : T[K];
};

export type Static<T> = Serialized<T>;
export type StaticList<T> = Serialized<T>[];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

/** Revives ISO strings back into Date for the columns drizzle models as Date. */
export function reviveDates<T extends Record<string, unknown>>(row: T): T {
  const output: Record<string, unknown> = { ...row };
  for (const [key, value] of Object.entries(output)) {
    if (typeof value === "string" && ISO_DATE.test(value)) output[key] = new Date(value);
  }
  return output as T;
}

export function reviveList<T extends Record<string, unknown>>(rows: StaticList<T>): T[] {
  return (rows as unknown as T[]).map((row) => reviveDates(row));
}

/**
 * Revives ISO strings at every depth.
 *
 * `reviveDates` only converts a row's own top-level fields, which is enough for
 * the published files because their nested rows are never consumed as dates.
 * A value that has been through `unstable_cache` is a JSON round-trip of a live
 * query result, though, and its nested rows (product images, service features,
 * related products) carry real `Date` columns the renderer may touch. This walks
 * the whole structure so no column is left as a string where a `Date` is
 * expected.
 */
export function reviveDeep<T>(value: T): T {
  if (typeof value === "string") return (ISO_DATE.test(value) ? new Date(value) : value) as unknown as T;
  if (Array.isArray(value)) return value.map((entry) => reviveDeep(entry)) as unknown as T;
  if (value && typeof value === "object") {
    if (value instanceof Date) return value;
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) output[key] = reviveDeep(entry);
    return output as unknown as T;
  }
  return value;
}

export type StaticHomeSection = Static<typeof homepageSections.$inferSelect>;
export type StaticHomeOfferCard = Static<typeof homeOfferCards.$inferSelect>;
export type StaticHomeSlider = Static<typeof homeSliders.$inferSelect>;
export type StaticProduct = Static<typeof products.$inferSelect>;
export type StaticService = Static<typeof services.$inferSelect>;
export type StaticProject = Static<typeof projects.$inferSelect>;
export type StaticIndustry = Static<typeof industries.$inferSelect>;
export type StaticGalleryItem = Static<typeof gallery.$inferSelect>;
export type StaticTestimonial = Static<typeof testimonials.$inferSelect>;
export type StaticPage = Static<typeof pages.$inferSelect>;
export type StaticFaq = Static<typeof faqs.$inferSelect>;
export type StaticClientLogo = Static<typeof clientLogos.$inferSelect>;
export type StaticBlogPost = Static<typeof blogPosts.$inferSelect>;
export type StaticBlogCategory = Static<typeof blogCategories.$inferSelect>;
export type StaticSiteSettings = Static<typeof siteSettings.$inferSelect>;
export type StaticSeoSettings = Static<typeof seoSettings.$inferSelect>;
export type StaticRedirect = Static<typeof redirects.$inferSelect>;
export type StaticProductImage = Static<typeof productImages.$inferSelect>;
export type StaticProductGalleryImage = Static<typeof productGalleryImages.$inferSelect>;
export type StaticProjectImage = Static<typeof projectImages.$inferSelect>;
export type StaticProductFeature = Static<typeof productFeatures.$inferSelect>;
export type StaticProductSpecification = Static<typeof productSpecifications.$inferSelect>;
export type StaticProductApplication = Static<typeof productApplications.$inferSelect>;
export type StaticProductBenefit = Static<typeof productBenefits.$inferSelect>;
export type StaticProductComponent = Static<typeof productComponents.$inferSelect>;
export type StaticProductConfiguration = Static<typeof productConfigurations.$inferSelect>;
export type StaticProductStoredMaterial = Static<typeof productStoredMaterials.$inferSelect>;
export type StaticProductStory = Static<typeof productStories.$inferSelect>;
export type StaticProductWorkflow = Static<typeof productWorkflows.$inferSelect>;
export type StaticServiceFeature = Static<typeof serviceFeatures.$inferSelect>;

/**
 * A published video, with its product/service relations flattened to slugs by
 * the `videos` generator so pages can filter without a second round trip.
 */
export type StaticVideo = Static<typeof videos.$inferSelect> & {
  productSlugs: string[];
  serviceSlugs: string[];
};

/** A fully expanded product record, the shape the public product page consumes. */
export type StaticProductDetail = StaticProduct & {
  images: StaticProductImage[];
  gallery: StaticProductGalleryImage[];
  features: StaticProductFeature[];
  specifications: StaticProductSpecification[];
  applications: StaticProductApplication[];
  benefits: StaticProductBenefit[];
  components: StaticProductComponent[];
  configurations: StaticProductConfiguration[];
  storedMaterials: StaticProductStoredMaterial[];
  stories: StaticProductStory[];
  workflows: StaticProductWorkflow[];
  faqs: StaticFaq[];
  /**
   * Editor-built content sections. Optional because a payload published before
   * this existed has no such key, and the public page must keep rendering from
   * an older file rather than treating the gap as an error.
   */
  sections?: StaticProductSection[];
  related: StaticProduct[];
  industries: StaticIndustry[];
  projects: StaticProject[];
};

/** One row of the `product_sections` table, as published. */
export type StaticProductSection = {
  id: number;
  productId: number;
  key: string;
  eyebrow: string | null;
  title: string;
  body: string | null;
  layout: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  altText: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  isActive: boolean;
  displayOrder: number;
};

export type StaticServiceDetail = StaticService & {
  features: StaticServiceFeature[];
  faqs: StaticFaq[];
  industries: StaticIndustry[];
  projects: StaticProject[];
};

export type StaticProjectDetail = StaticProject & {
  images: StaticProjectImage[];
  products: StaticProduct[];
};

export type StaticIndustryDetail = StaticIndustry & {
  products: StaticProduct[];
  services: StaticService[];
};

export type StaticBlogPostWithCategory = {
  post: StaticBlogPost;
  category: StaticBlogCategory | null;
};

export type StaticRoutes = {
  generatedAt: string;
  products: string[];
  services: string[];
  projects: string[];
  industries: string[];
  blog: string[];
  pages: string[];
  gallery: number;
  clientLogos: number;
};
