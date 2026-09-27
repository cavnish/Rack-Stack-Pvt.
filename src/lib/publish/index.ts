import { createHash } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { asc, and, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, dbConfigured } from "@/db";
import {
  blogCategories,
  blogPosts,
  clientLogos,
  clients,
  faqs,
  gallery,
  homeSliders,
  homepageSections,
  industries,
  pages,
  productApplications,
  productBenefits,
  productComponents,
  productConfigurations,
  productFeatures,
  productImages,
  productIndustries,
  productProjects,
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
  serviceIndustries,
  serviceProjects,
  services,
  siteSettings,
  testimonials,
  videoProducts,
  videos,
  videoServices,
} from "@/db/schema";
import { logServer } from "@/lib/logger";
import {
  cacheImage,
  flushMediaManifest,
  resolveLocalAssetBySource,
  slugifySegment,
  type AssetGroup,
  type CachedAsset,
} from "./media";
import { flushWrites, readCollection, readManifest, updateManifest, writeCollection, type CollectionKey } from "./store";
import type { StaticRoutes } from "./types";

export type PublishScope =
  | "all"
  | "settings"
  | "seo"
  | "homepage"
  | "sliders"
  | "products"
  | "product"
  | "services"
  | "service"
  | "projects"
  | "project"
  | "clients"
  | "client-logos"
  | "industries"
  | "industry"
  | "gallery"
  | "testimonials"
  | "blog"
  | "faqs"
  | "pages"
  | "redirects"
  | "videos";

export type PublishResult = {
  scope: PublishScope;
  collections: CollectionKey[];
  assetsCached: number;
  assetsReused: number;
  assetsFailed: number;
  durationMs: number;
  skipped: boolean;
  error?: string;
};

type Counters = { cached: number; reused: number; failed: number; unresolved: number };

/**
 * Media counters belong to a single publish run, not to the module. Scopes are
 * published concurrently, so a module-level counter would mix the asset counts
 * of unrelated runs. AsyncLocalStorage keeps the counter correct across the
 * awaits inside generators without threading it through every call site.
 */
const runStorage = new AsyncLocalStorage<Counters>();

function activeCounters(): Counters {
  return runStorage.getStore() ?? { cached: 0, reused: 0, failed: 0, unresolved: 0 };
}

function fingerprint(value: unknown) {
  return createHash("sha1").update(JSON.stringify(value) ?? "null").digest("hex").slice(0, 16);
}

function serialize<T>(rows: T[]) {
  return JSON.parse(JSON.stringify(rows)) as T[];
}

function serializeOne<T>(row: T) {
  return JSON.parse(JSON.stringify(row)) as T;
}

async function asset(group: AssetGroup, name: string, source: string | null | undefined, entityKey: string): Promise<CachedAsset | null> {
  const result = await cacheImage(source, { group, name: slugifySegment(`${name}`), entityKey });
  const counters = activeCounters();
  if (!result) {
    if (source) counters.failed += 1;
    return null;
  }
  if (result.cached) counters.reused += 1;
  else counters.cached += 1;
  return result;
}

/**
 * Resolves a cached asset to its local path.
 *
 * The remote original is deliberately never returned: publishing must not leak
 * Cloudinary/CDN URLs into `src/data`, because those would bypass the local
 * asset layer entirely (no manifest entry, no optimization, and a live
 * dependency on the third-party host). A missing asset becomes `null` and the
 * site renders `DEFAULT_IMAGE_FALLBACK` instead.
 */
function pickAsset(result: CachedAsset | null, _original?: string | null) {
  return result?.url ?? null;
}

/**
 * Keeps a value that is already local (`/assets/...`) and drops remote ones.
 * Used where a section image is optional and a null value is preferable to
 * publishing an unlocalized CDN reference.
 */
function localOrNull(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^(https?:)?\/\//i.test(trimmed) ? null : trimmed;
}

/** Rewrites image columns through the media cache so only local paths are published. */
async function mapImageColumns<T extends Record<string, unknown>>(
  rows: T[],
  fields: Array<{ key: keyof T & string; group: AssetGroup; name: (row: T) => string; entityKey: (row: T) => string }>,
) {
  const output: T[] = [];
  for (const row of rows) {
    const next: Record<string, unknown> = { ...row };
    for (const field of fields) {
      const original = row[field.key];
      if (typeof original !== "string" || !original.trim()) continue;
      const cached = await asset(field.group, field.name(row), original, field.entityKey(row));
      next[field.key] = pickAsset(cached, original);
    }
    output.push(next as T);
  }
  return output;
}

/** Image-shaped field names, used to avoid rewriting ordinary outbound links. */
const IMAGE_FIELD = /(image|img|logo|photo|thumb|icon|avatar|picture|banner|poster|graphic)/i;

function isRemoteUrl(value: unknown): value is string {
  return typeof value === "string" && /^(https?:)?\/\//i.test(value.trim());
}

/**
 * Last line of defence before a collection is written.
 *
 * Generators localize their known image columns, but any field added later (a
 * new column, a nested JSON blob) could otherwise slip a Cloudinary/CDN URL
 * into `src/data` and bypass the local asset layer. This resolves every
 * image-shaped remote string against the live manifest, caching it on demand if
 * it has never been seen, and nulls it out when it cannot be made local.
 */
async function localizeSerialized(value: unknown, key = ""): Promise<unknown> {
  if (Array.isArray(value)) return Promise.all(value.map((entry) => localizeSerialized(entry, key)));
  // A Date has no own enumerable properties, so recursing into it would quietly
  // turn a timestamp into `{}`. Generators are expected to call `serialize()`
  // first, but flattening a date is silent and very hard to trace back.
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const entries = await Promise.all(
      Object.entries(source).map(async ([childKey, item]) => [childKey, await localizeSerialized(item, childKey)] as const),
    );
    return Object.fromEntries(entries);
  }
  // Ordinary outbound links (a client website, a social profile) are left alone.
  if (!IMAGE_FIELD.test(key) || !isRemoteUrl(value)) return value;
  const source = value.trim();
  const cached = await resolveLocalAssetBySource(source);
  if (cached) return cached;
  const refetched = await cacheImage(source, { group: "misc", name: `unresolved-${hashName(source)}` });
  if (refetched) {
    activeCounters().cached += 1;
    return refetched.url;
  }
  activeCounters().unresolved += 1;
  activeCounters().failed += 1;
  logServer("warn", "publish.unresolved_media", { source });
  return null;
}

function hashName(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 8);
}

// ---------------------------------------------------------------------------
// Collection generators
// ---------------------------------------------------------------------------

async function generateSettings() {
  const rows = await db.select().from(siteSettings).limit(1);
  const record = rows[0] ?? null;
  if (!record) return null;
  const logo = await asset("misc", "site-logo", record.logo, `settings:${record.id}`);
  return serialize([{ ...record, logo: pickAsset(logo, record.logo) }]);
}

async function generateSeo() {
  const rows = await db.select().from(seoSettings).limit(1);
  const record = rows[0] ?? null;
  if (!record) return null;
  const ogImage = await asset("misc", "default-og-image", record.ogImage, `seo:${record.id}`);
  const twitterImage = await asset("misc", "default-twitter-image", record.twitterImage, `seo:${record.id}`);
  return serialize([
    {
      ...record,
      ogImage: pickAsset(ogImage, record.ogImage),
      twitterImage: pickAsset(twitterImage, record.twitterImage),
    },
  ]);
}

async function generateHomepage() {
  const rows = await db
    .select()
    .from(homepageSections)
    .where(eq(homepageSections.enabled, true))
    .orderBy(asc(homepageSections.displayOrder));
  if (rows.length === 0) return null;
  const output: Record<string, unknown>[] = [];
  for (const row of rows) {
    const content = (row.content ?? {}) as Record<string, unknown>;
    const imageKey = typeof content.image === "string" ? content.image : null;
    if (!imageKey) {
      output.push(serializeOne(row) as unknown as Record<string, unknown>);
      continue;
    }
    const group: AssetGroup = row.sectionKey === "hero" ? "hero" : row.sectionKey === "manufacturing" ? "services" : "about";
    const cached = await asset(group, `homepage-${row.sectionKey}`, imageKey, `homepage:${row.sectionKey}`);
    const image = pickAsset(cached, imageKey) ?? localOrNull(imageKey);
    output.push(
      serializeOne({ ...row, content: image ? { ...content, image } : { ...content, image: null } }) as unknown as Record<
        string,
        unknown
      >,
    );
  }
  return output;
}

async function generateSliders() {
  const now = new Date();
  const rows = await db
    .select()
    .from(homeSliders)
    .where(
      and(
        eq(homeSliders.status, "PUBLISHED"),
        or(isNull(homeSliders.startAt), lte(homeSliders.startAt, now)),
        or(isNull(homeSliders.endAt), gte(homeSliders.endAt, now)),
      ),
    )
    .orderBy(asc(homeSliders.sortOrder));
  if (rows.length === 0) return null;
  const output: Record<string, unknown>[] = [];
  for (const row of rows) {
    const desktop = await asset("hero", `slide-${row.sortOrder}`, row.imageUrl, `slider:${row.id}`);
    const mobile = row.mobileImageUrl
      ? await asset("hero", `slide-${row.sortOrder}-mobile`, row.mobileImageUrl, `slider:${row.id}:mobile`)
      : null;
    output.push(
      serializeOne({
        ...row,
        imageUrl: pickAsset(desktop, row.imageUrl),
        mobileImageUrl: pickAsset(mobile, row.mobileImageUrl) ?? pickAsset(desktop, row.imageUrl),
      }) as unknown as Record<string, unknown>,
    );
  }
  return output;
}

type Child = { productId: number };

/** Collapses the same record joined through several pivot rows. */
function dedupeById<T extends { id: number }>(rows: T[]) {
  const seen = new Map<number, T>();
  for (const row of rows) if (!seen.has(row.id)) seen.set(row.id, row);
  return [...seen.values()];
}

function groupByProductId<T extends Child>(rows: T[]) {
  const grouped = new Map<number, T[]>();
  for (const row of rows) {
    const bucket = grouped.get(row.productId);
    if (bucket) bucket.push(row);
    else grouped.set(row.productId, [row]);
  }
  return grouped;
}

/** Publishes fully expanded product records so a product page never has to query Neon. */
export async function generateProducts() {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.status, "PUBLISHED"), isNull(products.deletedAt)))
    .orderBy(asc(products.displayOrder));
  if (rows.length === 0) return null;

  const ids = rows.map((row) => row.id);
  const order = <T>(column: T) => asc(column as never);
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
    globalFaqs,
    relatedRows,
    industryRows,
    projectRows,
  ] = await Promise.all([
    db.select().from(productFeatures).where(inArray(productFeatures.productId, ids)).orderBy(order(productFeatures.displayOrder)),
    db.select().from(productSpecifications).where(inArray(productSpecifications.productId, ids)).orderBy(order(productSpecifications.displayOrder)),
    db.select().from(productApplications).where(inArray(productApplications.productId, ids)).orderBy(order(productApplications.displayOrder)),
    db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(order(productImages.displayOrder)),
    db.select().from(productBenefits).where(inArray(productBenefits.productId, ids)).orderBy(order(productBenefits.displayOrder)),
    db.select().from(productComponents).where(inArray(productComponents.productId, ids)).orderBy(order(productComponents.displayOrder)),
    db.select().from(productConfigurations).where(inArray(productConfigurations.productId, ids)).orderBy(order(productConfigurations.displayOrder)),
    db.select().from(productStoredMaterials).where(inArray(productStoredMaterials.productId, ids)).orderBy(order(productStoredMaterials.displayOrder)),
    db.select().from(productStories).where(inArray(productStories.productId, ids)).orderBy(order(productStories.displayOrder)),
    db.select().from(productWorkflows).where(inArray(productWorkflows.productId, ids)).orderBy(order(productWorkflows.displayOrder)),
    db
      .select()
      .from(faqs)
      .where(and(eq(faqs.status, "PUBLISHED"), eq(faqs.entityType, "PRODUCT"), inArray(faqs.entityId, ids)))
      .orderBy(order(faqs.displayOrder)),
    db.select().from(faqs).where(and(eq(faqs.status, "PUBLISHED"), eq(faqs.entityType, "GLOBAL"))).orderBy(order(faqs.displayOrder)),
    db
      .select({ productId: productRelatedProducts.productId, item: products })
      .from(productRelatedProducts)
      .innerJoin(products, eq(productRelatedProducts.relatedProductId, products.id))
      .where(
        and(
          inArray(productRelatedProducts.productId, ids),
          eq(products.status, "PUBLISHED"),
          isNull(products.deletedAt),
        ),
      )
      .orderBy(order(productRelatedProducts.displayOrder)),
    db
      .select({ productId: productIndustries.productId, item: industries })
      .from(productIndustries)
      .innerJoin(industries, eq(productIndustries.industryId, industries.id))
      .where(and(inArray(productIndustries.productId, ids), eq(industries.status, "PUBLISHED")))
      .orderBy(order(productIndustries.displayOrder)),
    db
      .select({ productId: productProjects.productId, item: projects })
      .from(productProjects)
      .innerJoin(projects, eq(productProjects.projectId, projects.id))
      .where(and(inArray(productProjects.productId, ids), eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt)))
      .orderBy(order(productProjects.displayOrder)),
  ]);

  const byFeature = groupByProductId(features);
  const bySpecification = groupByProductId(specifications);
  const byApplication = groupByProductId(applications);
  const byImage = groupByProductId(images);
  const byBenefit = groupByProductId(benefits);
  const byComponent = groupByProductId(components);
  const byConfiguration = groupByProductId(configurations);
  const byStoredMaterial = groupByProductId(storedMaterials);
  const byStory = groupByProductId(stories);
  const byWorkflow = groupByProductId(workflows);
  const byRelated = groupByProductId(relatedRows);
  const byIndustry = groupByProductId(industryRows);
  const byProject = groupByProductId(projectRows);

  const faqGroups = new Map<number | null, typeof productFaqs>();
  for (const faq of productFaqs) {
    const bucket = faqGroups.get(faq.entityId);
    if (bucket) bucket.push(faq);
    else faqGroups.set(faq.entityId, [faq]);
  }
  const sharedFaqs = globalFaqs;

  const cachedImages = await mapImageColumns(images, [
    { key: "imageUrl", group: "products", name: (row) => `${slugifySegment(row.altText)}-${row.id}`, entityKey: (row) => `product-image:${row.id}` },
  ]);
  const cachedImageById = new Map(cachedImages.map((row) => [row.id, row]));

  const base = await mapImageColumns(rows, [
    { key: "heroImage", group: "products", name: (row) => `${row.slug}-hero`, entityKey: (row) => `product:${row.id}` },
    { key: "thumbnail", group: "products", name: (row) => `${row.slug}-thumb`, entityKey: (row) => `product:${row.id}` },
    { key: "technicalImage", group: "products", name: (row) => `${row.slug}-technical`, entityKey: (row) => `product:${row.id}` },
    { key: "ogImage", group: "products", name: (row) => `${row.slug}-og`, entityKey: (row) => `product:${row.id}` },
  ]);

  // Nested cards reuse the parent rows verbatim, so they must read the already
  // localized records instead of the raw joins, otherwise related/industry
  // cards keep pointing at the remote CMS URL.
  const localizedProductById = new Map(base.map((row) => [row.id, row]));
  const nestedIndustries = await mapImageColumns(
    dedupeById(industryRows.map((entry) => entry.item)),
    [{ key: "heroImage", group: "industries", name: (row) => `${row.slug}-hero`, entityKey: (row) => `industry:${row.id}` }],
  );
  const localizedIndustryById = new Map(nestedIndustries.map((row) => [row.id, row]));
  const nestedProjects = await mapImageColumns(dedupeById(projectRows.map((entry) => entry.item)), [
    { key: "coverImage", group: "projects", name: (row) => `${row.slug}-cover`, entityKey: (row) => `project:${row.id}` },
  ]);
  const localizedProjectById = new Map(nestedProjects.map((row) => [row.id, row]));

  const output = base.map((row) => {
    const related = (byRelated.get(row.id) ?? []).map((entry) => localizedProductById.get(entry.item.id) ?? entry.item);
    const sameCategory = base.filter((item) => item.id !== row.id && item.category === row.category).slice(0, 3);
    return {
      ...row,
      features: byFeature.get(row.id) ?? [],
      specifications: bySpecification.get(row.id) ?? [],
      applications: byApplication.get(row.id) ?? [],
      images: (byImage.get(row.id) ?? []).map((entry) => cachedImageById.get(entry.id) ?? entry),
      benefits: byBenefit.get(row.id) ?? [],
      components: byComponent.get(row.id) ?? [],
      configurations: byConfiguration.get(row.id) ?? [],
      storedMaterials: byStoredMaterial.get(row.id) ?? [],
      stories: byStory.get(row.id) ?? [],
      workflows: byWorkflow.get(row.id) ?? [],
      faqs: [...sharedFaqs, ...(faqGroups.get(row.id) ?? [])],
      related: related.length > 0 ? related : sameCategory,
      industries: (byIndustry.get(row.id) ?? []).map((entry) => localizedIndustryById.get(entry.item.id) ?? entry.item),
      projects: (byProject.get(row.id) ?? []).map((entry) => localizedProjectById.get(entry.item.id) ?? entry.item),
    };
  });

  return serialize(output);
}

export async function generateServices() {
  const rows = await db
    .select()
    .from(services)
    .where(and(eq(services.status, "PUBLISHED"), isNull(services.deletedAt)))
    .orderBy(asc(services.displayOrder));
  if (rows.length === 0) return null;

  const ids = rows.map((row) => row.id);
  const order = <T>(column: T) => asc(column as never);
  const [features, serviceFaqs, globalFaqs, industryRows, projectRows] = await Promise.all([
    db.select().from(serviceFeatures).where(inArray(serviceFeatures.serviceId, ids)).orderBy(order(serviceFeatures.displayOrder)),
    db
      .select()
      .from(faqs)
      .where(and(eq(faqs.status, "PUBLISHED"), eq(faqs.entityType, "SERVICE"), inArray(faqs.entityId, ids)))
      .orderBy(order(faqs.displayOrder)),
    db.select().from(faqs).where(and(eq(faqs.status, "PUBLISHED"), eq(faqs.entityType, "GLOBAL"))).orderBy(order(faqs.displayOrder)),
    db
      .select({ serviceId: serviceIndustries.serviceId, item: industries })
      .from(serviceIndustries)
      .innerJoin(industries, eq(serviceIndustries.industryId, industries.id))
      .where(and(inArray(serviceIndustries.serviceId, ids), eq(industries.status, "PUBLISHED"))),
    db
      .select({ serviceId: serviceProjects.serviceId, item: projects })
      .from(serviceProjects)
      .innerJoin(projects, eq(serviceProjects.projectId, projects.id))
      .where(and(inArray(serviceProjects.serviceId, ids), eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt))),
  ]);

  const byFeature = new Map<number, typeof features>();
  for (const row of features) {
    const bucket = byFeature.get(row.serviceId);
    if (bucket) bucket.push(row);
    else byFeature.set(row.serviceId, [row]);
  }
  const faqGroups = new Map<number, typeof serviceFaqs>();
  for (const faq of serviceFaqs) {
    const bucket = faqGroups.get(faq.entityId ?? 0);
    if (bucket) bucket.push(faq);
    else faqGroups.set(faq.entityId ?? 0, [faq]);
  }
  const byIndustry = new Map<number, typeof industryRows>();
  for (const row of industryRows) {
    const bucket = byIndustry.get(row.serviceId);
    if (bucket) bucket.push(row);
    else byIndustry.set(row.serviceId, [row]);
  }
  const byProject = new Map<number, typeof projectRows>();
  for (const row of projectRows) {
    const bucket = byProject.get(row.serviceId);
    if (bucket) bucket.push(row);
    else byProject.set(row.serviceId, [row]);
  }

  const base = await mapImageColumns(rows, [
    { key: "heroImage", group: "services", name: (row) => `${row.slug}-hero`, entityKey: (row) => `service:${row.id}` },
    { key: "ogImage", group: "services", name: (row) => `${row.slug}-og`, entityKey: (row) => `service:${row.id}` },
  ]);

  const nestedIndustries = await mapImageColumns(
    dedupeById(industryRows.map((entry) => entry.item)),
    [{ key: "heroImage", group: "industries", name: (row) => `${row.slug}-hero`, entityKey: (row) => `industry:${row.id}` }],
  );
  const localizedIndustryById = new Map(nestedIndustries.map((row) => [row.id, row]));
  const nestedProjects = await mapImageColumns(dedupeById(projectRows.map((entry) => entry.item)), [
    { key: "coverImage", group: "projects", name: (row) => `${row.slug}-cover`, entityKey: (row) => `project:${row.id}` },
  ]);
  const localizedProjectById = new Map(nestedProjects.map((row) => [row.id, row]));

  return serialize(
    base.map((row) => ({
      ...row,
      features: byFeature.get(row.id) ?? [],
      faqs: [...globalFaqs, ...(faqGroups.get(row.id) ?? [])],
      industries: (byIndustry.get(row.id) ?? []).map((entry) => localizedIndustryById.get(entry.item.id) ?? entry.item),
      projects: (byProject.get(row.id) ?? []).map((entry) => localizedProjectById.get(entry.item.id) ?? entry.item),
    })),
  );
}

export async function generateProjects() {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.status, "PUBLISHED"), isNull(projects.deletedAt)))
    .orderBy(desc(projects.projectDate));
  if (rows.length === 0) return null;

  const ids = rows.map((row) => row.id);
  const [images, productRows] = await Promise.all([
    db.select().from(projectImages).where(inArray(projectImages.projectId, ids)).orderBy(asc(projectImages.displayOrder)),
    db
      .select({ projectId: productProjects.projectId, item: products })
      .from(productProjects)
      .innerJoin(products, eq(productProjects.productId, products.id))
      .where(and(inArray(productProjects.projectId, ids), eq(products.status, "PUBLISHED"), isNull(products.deletedAt)))
      .orderBy(asc(productProjects.displayOrder)),
  ]);

  const byImage = new Map<number, typeof images>();
  for (const row of images) {
    const bucket = byImage.get(row.projectId);
    if (bucket) bucket.push(row);
    else byImage.set(row.projectId, [row]);
  }
  const byProduct = new Map<number, typeof productRows>();
  for (const row of productRows) {
    const bucket = byProduct.get(row.projectId);
    if (bucket) bucket.push(row);
    else byProduct.set(row.projectId, [row]);
  }

  const cachedImages = await mapImageColumns(images, [
    { key: "imageUrl", group: "projects", name: (row) => `${slugifySegment(row.altText)}-${row.id}`, entityKey: (row) => `project-image:${row.id}` },
  ]);
  const cachedImageById = new Map(cachedImages.map((row) => [row.id, row]));

  const base = await mapImageColumns(rows, [
    { key: "coverImage", group: "projects", name: (row) => `${row.slug}-cover`, entityKey: (row) => `project:${row.id}` },
  ]);

  const nestedProducts = await mapImageColumns(dedupeById(productRows.map((entry) => entry.item)), [
    { key: "heroImage", group: "products", name: (row) => `${row.slug}-hero`, entityKey: (row) => `product:${row.id}` },
    { key: "thumbnail", group: "products", name: (row) => `${row.slug}-thumb`, entityKey: (row) => `product:${row.id}` },
  ]);
  const localizedProductById = new Map(nestedProducts.map((row) => [row.id, row]));

  return serialize(
    base.map((row) => ({
      ...row,
      images: (byImage.get(row.id) ?? []).map((entry) => cachedImageById.get(entry.id) ?? entry),
      products: (byProduct.get(row.id) ?? []).map((entry) => localizedProductById.get(entry.item.id) ?? entry.item),
    })),
  );
}

export async function generateClients() {
  const rows = await db.select().from(clients).where(isNull(clients.deletedAt)).orderBy(asc(clients.displayOrder));
  if (rows.length === 0) return null;
  return serialize(
    await mapImageColumns(rows, [
      { key: "logo", group: "clients", name: (row) => row.name, entityKey: (row) => `client:${row.id}` },
    ]),
  );
}

export async function generateClientLogos() {
  const rows = await db
    .select()
    .from(clientLogos)
    .where(eq(clientLogos.isActive, true))
    .orderBy(asc(clientLogos.sortOrder), asc(clientLogos.id));
  if (rows.length === 0) return null;
  return serialize(
    await mapImageColumns(rows, [
      { key: "imageUrl", group: "clients", name: (row) => row.name, entityKey: (row) => `client-logo:${row.id}` },
    ]),
  );
}

export async function generateIndustries() {
  const rows = await db.select().from(industries).where(eq(industries.status, "PUBLISHED")).orderBy(asc(industries.displayOrder));
  if (rows.length === 0) return null;

  const ids = rows.map((row) => row.id);
  const [assignedProducts, assignedServices, allProducts, allServices] = await Promise.all([
    db
      .select({ industryId: productIndustries.industryId, item: products })
      .from(productIndustries)
      .innerJoin(products, eq(productIndustries.productId, products.id))
      .where(and(inArray(productIndustries.industryId, ids), eq(products.status, "PUBLISHED"), isNull(products.deletedAt)))
      .orderBy(asc(productIndustries.displayOrder)),
    db
      .select({ industryId: serviceIndustries.industryId, item: services })
      .from(serviceIndustries)
      .innerJoin(services, eq(serviceIndustries.serviceId, services.id))
      .where(and(inArray(serviceIndustries.industryId, ids), eq(services.status, "PUBLISHED"), isNull(services.deletedAt))),
    db.select().from(products).where(and(eq(products.status, "PUBLISHED"), isNull(products.deletedAt))).orderBy(asc(products.displayOrder)),
    db.select().from(services).where(and(eq(services.status, "PUBLISHED"), isNull(services.deletedAt))).orderBy(asc(services.displayOrder)),
  ]);

  const byProduct = new Map<number, typeof assignedProducts>();
  for (const row of assignedProducts) {
    const bucket = byProduct.get(row.industryId);
    if (bucket) bucket.push(row);
    else byProduct.set(row.industryId, [row]);
  }
  const byService = new Map<number, typeof assignedServices>();
  for (const row of assignedServices) {
    const bucket = byService.get(row.industryId);
    if (bucket) bucket.push(row);
    else byService.set(row.industryId, [row]);
  }

  const base = await mapImageColumns(rows, [
    { key: "heroImage", group: "industries", name: (row) => `${row.slug}-hero`, entityKey: (row) => `industry:${row.id}` },
  ]);

  const productFields = [
    { key: "heroImage" as const, group: "products" as const, name: (row: (typeof allProducts)[number]) => `${row.slug}-hero`, entityKey: (row: (typeof allProducts)[number]) => `product:${row.id}` },
    { key: "thumbnail" as const, group: "products" as const, name: (row: (typeof allProducts)[number]) => `${row.slug}-thumb`, entityKey: (row: (typeof allProducts)[number]) => `product:${row.id}` },
  ];
  const serviceFields = [
    { key: "heroImage" as const, group: "services" as const, name: (row: (typeof allServices)[number]) => `${row.slug}-hero`, entityKey: (row: (typeof allServices)[number]) => `service:${row.id}` },
  ];

  // One pass over the full product/service tables localizes every card the
  // industry page can render, whether it is linked or the fallback selection.
  const [localizedProducts, localizedServices] = await Promise.all([
    mapImageColumns(allProducts, productFields),
    mapImageColumns(allServices, serviceFields),
  ]);
  const productById = new Map(localizedProducts.map((row) => [row.id, row]));
  const serviceById = new Map(localizedServices.map((row) => [row.id, row]));

  return serialize(
    base.map((row) => {
      const linkedProducts = (byProduct.get(row.id) ?? []).map((entry) => productById.get(entry.item.id) ?? entry.item);
      const linkedServices = (byService.get(row.id) ?? []).map((entry) => serviceById.get(entry.item.id) ?? entry.item);
      return {
        ...row,
        products: linkedProducts.length > 0 ? linkedProducts : localizedProducts.slice(0, 4),
        services: linkedServices.length > 0 ? linkedServices.slice(0, 4) : localizedServices.slice(0, 3),
      };
    }),
  );
}

export async function generateGallery() {
  const rows = await db.select().from(gallery).where(eq(gallery.status, "PUBLISHED")).orderBy(asc(gallery.displayOrder));
  if (rows.length === 0) return null;
  return serialize(
    await mapImageColumns(rows, [
      { key: "imageUrl", group: "gallery", name: (row) => row.title, entityKey: (row) => `gallery:${row.id}` },
    ]),
  );
}

export async function generateTestimonials() {
  const rows = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.status, "PUBLISHED"))
    .orderBy(asc(testimonials.displayOrder));
  if (rows.length === 0) return null;
  return serialize(
    await mapImageColumns(rows, [
      { key: "image", group: "misc", name: (row) => row.clientName, entityKey: (row) => `testimonial:${row.id}` },
    ]),
  );
}

export async function generateBlogPosts() {
  const posts = await db
    .select({ post: blogPosts, category: blogCategories })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .where(and(eq(blogPosts.status, "PUBLISHED"), isNull(blogPosts.deletedAt)))
    .orderBy(desc(blogPosts.publishedAt));
  if (posts.length === 0) return null;
  const output: Record<string, unknown>[] = [];
  for (const entry of posts) {
    const featured = await asset("blog", entry.post.slug, entry.post.featuredImage, `blog:${entry.post.id}`);
    output.push({
      post: serializeOne({
        ...entry.post,
        featuredImage: pickAsset(featured, entry.post.featuredImage),
      }),
      category: entry.category ? serializeOne(entry.category) : null,
    });
  }
  return output;
}

export async function generateBlogCategories() {
  const rows = await db.select().from(blogCategories).orderBy(asc(blogCategories.id));
  if (rows.length === 0) return null;
  return serialize(rows);
}

export async function generateFaqs() {
  const rows = await db.select().from(faqs).where(eq(faqs.status, "PUBLISHED")).orderBy(asc(faqs.displayOrder));
  if (rows.length === 0) return null;
  return serialize(rows);
}

export async function generatePages() {
  const rows = await db.select().from(pages).where(and(eq(pages.status, "PUBLISHED"), isNull(pages.deletedAt)));
  if (rows.length === 0) return null;
  return serialize(
    await mapImageColumns(rows, [
      { key: "heroImage", group: "misc", name: (row) => row.slug, entityKey: (row) => `page:${row.id}` },
    ]),
  );
}

export async function generateRedirects() {
  const rows = await db.select().from(redirects).orderBy(asc(redirects.sourcePath));
  if (rows.length === 0) return null;
  return serialize(rows);
}

/**
 * Publishes short vertical videos.
 *
 * Only the poster frame is treated as an image and pushed through the local
 * media cache. The video file itself is never downloaded or rewritten: it is
 * streamed from Cloudinary through the delivery transforms in `lib/reel-video`,
 * so a phone never receives the multi-hundred-megabyte original.
 *
 * Relations are denormalised to slugs so a published payload stays valid after
 * a product or service is renamed, and so a page can filter without a second
 * database round trip.
 */
async function generateVideos() {
  const rows = await db
    .select()
    .from(videos)
    // A reel has to be published *and* switched on. `status` is the editorial
    // state and `isActive` is the live toggle, and requiring both means an
    // editor can pull a finished reel off the site without reopening it.
    .where(
      and(
        eq(videos.status, "PUBLISHED"),
        eq(videos.isActive, true),
        isNull(videos.deletedAt),
      ),
    )
    .orderBy(asc(videos.displayOrder));
  if (rows.length === 0) return null;

  const [productLinks, serviceLinks] = await Promise.all([
    db
      .select({ videoId: videoProducts.videoId, slug: products.slug })
      .from(videoProducts)
      .innerJoin(products, eq(videoProducts.productId, products.id))
      .where(and(eq(products.status, "PUBLISHED"), isNull(products.deletedAt))),
    db
      .select({ videoId: videoServices.videoId, slug: services.slug })
      .from(videoServices)
      .innerJoin(services, eq(videoServices.serviceId, services.id))
      .where(and(eq(services.status, "PUBLISHED"), isNull(services.deletedAt))),
  ]);

  const productsByVideo = new Map<number, string[]>();
  for (const link of productLinks) {
    const list = productsByVideo.get(link.videoId) ?? [];
    list.push(link.slug);
    productsByVideo.set(link.videoId, list);
  }
  const servicesByVideo = new Map<number, string[]>();
  for (const link of serviceLinks) {
    const list = servicesByVideo.get(link.videoId) ?? [];
    list.push(link.slug);
    servicesByVideo.set(link.videoId, list);
  }

  const localized = await mapImageColumns(rows, [
    // Only a hosted file has a poster frame to cache. An Instagram reel's
    // artwork lives behind Instagram's own API, which this project deliberately
    // does not call, so there is nothing here to fetch.
    { key: "posterUrl", group: "misc", name: (row) => row.title, entityKey: (row) => `video:${row.id}` },
  ]);

  return serialize(
    localized.map((row) => ({
      ...row,
      productSlugs: productsByVideo.get(row.id) ?? [],
      serviceSlugs: servicesByVideo.get(row.id) ?? [],
    })),
  );
}

/** Raw relational data used to build expanded detail records for a single entity. */
export async function loadProductDetail(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), isNull(products.deletedAt)))
    .limit(1);
  if (!product) return null;
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
  return { product, features, specifications, applications, images, benefits, components, configurations, storedMaterials, stories, workflows, faqs: productFaqs, related: relatedRows.map((row) => row.item), industries: industryRows.map((row) => row.item), projects: projectRows.map((row) => row.item) };
}

export async function loadServiceDetail(slug: string) {
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.slug, slug), isNull(services.deletedAt)))
    .limit(1);
  if (!service) return null;
  return buildServiceDetail(service);
}

async function buildServiceDetail(service: typeof services.$inferSelect) {
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
  return { service, features, faqs: serviceFaqs, industries: industryRows.map((row) => row.item), projects: projectRows.map((row) => row.item) };
}


export async function loadProjectDetail(slug: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, slug), isNull(projects.deletedAt)))
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
  return { project, images, products: productRows.map((row) => row.item) };
}

export async function loadIndustryDetail(slug: string) {
  const [industry] = await db
    .select()
    .from(industries)
    .where(and(eq(industries.slug, slug), eq(industries.status, "PUBLISHED")))
    .limit(1);
  if (!industry) return null;
  const [productRows, serviceRows] = await Promise.all([
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
  ]);
  return { industry, products: productRows.map((row) => row.item), services: serviceRows.map((row) => row.item) };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

const generators: Partial<Record<CollectionKey, () => Promise<unknown>>> = {
  site: generateSettings,
  seo: generateSeo,
  homepage: generateHomepage,
  sliders: generateSliders,
  products: generateProducts,
  services: generateServices,
  projects: generateProjects,
  clients: generateClients,
  clientLogos: generateClientLogos,
  industries: generateIndustries,
  gallery: generateGallery,
  testimonials: generateTestimonials,
  faqs: generateFaqs,
  pages: generatePages,
  redirects: generateRedirects,
  blogPosts: generateBlogPosts,
  blogCategories: generateBlogCategories,
  videos: generateVideos,
};

const scopeCollections: Record<PublishScope, CollectionKey[]> = {
  all: [
    "site",
    "seo",
    "homepage",
    "sliders",
    "products",
    "services",
    "projects",
    "clients",
    "clientLogos",
    "industries",
    "gallery",
    "testimonials",
    "blogPosts",
    "blogCategories",
    "faqs",
    "pages",
    "redirects",
    "videos",
    "routes",
  ],
  settings: ["site", "routes"],
  seo: ["seo", "routes"],
  homepage: ["homepage", "routes"],
  sliders: ["sliders", "routes"],
  products: ["products", "routes"],
  product: ["products", "routes"],
  services: ["services", "routes"],
  service: ["services", "routes"],
  projects: ["projects", "routes"],
  project: ["projects", "routes"],
  clients: ["clients", "routes"],
  "client-logos": ["clientLogos", "clients", "routes"],
  industries: ["industries", "routes"],
  industry: ["industries", "routes"],
  gallery: ["gallery", "routes"],
  testimonials: ["testimonials", "routes"],
  blog: ["blogPosts", "blogCategories", "routes"],
  faqs: ["faqs", "routes"],
  pages: ["pages", "routes"],
  redirects: ["redirects", "routes"],
  videos: ["videos", "routes"],
};

export function collectionsForScope(scope: PublishScope): CollectionKey[] {
  return scopeCollections[scope] ?? scopeCollections.all;
}

/** Resolves the scope(s) that must be regenerated for an admin entity change. */
export function scopeForAdminEntity(entity: string): PublishScope {
  switch (entity) {
    case "products":
      return "products";
    case "services":
      return "services";
    case "projects":
      return "projects";
    case "clients":
      return "clients";
    case "client-logos":
      return "client-logos";
    case "testimonials":
      return "testimonials";
    case "gallery":
      return "gallery";
    case "pages":
      return "pages";
    case "industries":
      return "industries";
    case "faqs":
      return "faqs";
    case "blog":
      return "blog";
    case "homepage":
      return "homepage";
    case "home-slider":
      return "sliders";
    case "videos":
      return "videos";
    case "settings":
      return "settings";
    case "seo":
      return "seo";
    default:
      return "all";
  }
}

async function generateRoutes(): Promise<StaticRoutes> {
  const [products, services, projects, industries, blogPosts, pages, galleryRows, clientLogos] = await Promise.all([
    readPublished<Array<{ slug: string }>>("products"),
    readPublished<Array<{ slug: string }>>("services"),
    readPublished<Array<{ slug: string }>>("projects"),
    readPublished<Array<{ slug: string }>>("industries"),
    readPublished<Array<{ post: { slug: string } }>>("blogPosts"),
    readPublished<Array<{ slug: string }>>("pages"),
    readPublished<unknown[]>("gallery"),
    readPublished<unknown[]>("clientLogos"),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    products: products.map((row) => row.slug),
    services: services.map((row) => row.slug),
    projects: projects.map((row) => row.slug),
    industries: industries.map((row) => row.slug),
    blog: blogPosts.map((row) => row.post.slug),
    pages: pages.map((row) => row.slug),
    gallery: galleryRows.length,
    clients: clientLogos.length,
  };
}

async function readPublished<T>(key: CollectionKey): Promise<T> {
  return ((await readCollection<T>(key)) ?? []) as T;
}

/**
 * Regenerates the static content layer from Neon + Cloudinary.
 * Only collections affected by `scope` are rebuilt; a collection whose generated
 * payload is unchanged is not rewritten, and unchanged media is reused from
 * public/assets/media-manifest.json instead of being downloaded again.
 */
export async function publish(scope: PublishScope = "all", options: { force?: boolean } = {}): Promise<PublishResult> {
  const started = Date.now();
  const counters: Counters = { cached: 0, reused: 0, failed: 0, unresolved: 0 };
  const collections = collectionsForScope(scope);
  const written: CollectionKey[] = [];

  if (!dbConfigured) {
    return {
      scope,
      collections: [] as CollectionKey[],
      assetsCached: 0,
      assetsReused: 0,
      assetsFailed: 0,
      durationMs: Date.now() - started,
      skipped: true,
      error: "DATABASE_URL is not configured",
    };
  }

  // Scopes run concurrently, so every counter read/write below happens inside
  // this run's own storage rather than on a shared module-level object.
  return runStorage.run(counters, () => publishWithinScope(scope, options, counters, started, collections, written));
}

async function publishWithinScope(
  scope: PublishScope,
  options: { force?: boolean },
  counters: Counters,
  started: number,
  collections: CollectionKey[],
  written: CollectionKey[],
): Promise<PublishResult> {
  const commit = async (key: CollectionKey, value: unknown) => {
    const localized = await localizeSerialized(value);
    const hash = fingerprint(localized);
    const manifest = await readManifest();
    if (!options.force && manifest.collections[key]?.hash === hash) return;
    await writeCollection(key, localized);
    await updateManifest((draft) => {
      draft.collections[key] = {
        hash,
        generatedAt: new Date().toISOString(),
        count: Array.isArray(localized) ? localized.length : 1,
      };
    });
    written.push(key);
  };

  for (const key of collections) {
    if (key === "routes") continue;
    const generator = generators[key];
    if (!generator) continue;
    const value = await generator();
    if (value === null) continue;
    await commit(key, value);
  }

  if (collections.includes("routes")) {
    await commit("routes", await generateRoutes());
  }

  await flushWrites();
  await flushMediaManifest();

  if (written.length > 0) {
    try {
      revalidatePath("/", "layout");
    } catch {
      // Outside a request scope (CLI publish) there is nothing to revalidate.
    }
    logServer("info", "publish.completed", {
      scope,
      collections: written.join(","),
      assetsCached: counters.cached,
      assetsReused: counters.reused,
      assetsUnresolved: counters.unresolved,
      durationMs: Date.now() - started,
    });
  }

  return {
    scope,
    collections: written,
    assetsCached: counters.cached,
    assetsReused: counters.reused,
    assetsFailed: counters.failed,
    durationMs: Date.now() - started,
    skipped: written.length === 0,
  };
}

/**
 * One queue per scope.
 *
 * A single global promise meant that a `client-logos` save arriving while a
 * `products` publish was running was handed the `products` result: the logos
 * collection was never rebuilt and the admin was told the wrong thing
 * succeeded. Keying by scope lets unrelated scopes run in parallel, because
 * they touch disjoint collections and now keep per-run counters.
 *
 * Same-scope saves are chained rather than coalesced. Sharing one promise would
 * be cheaper, but a second save that reaches the database after the first run
 * has already read its rows would be silently dropped from the generated JSON;
 * chaining guarantees each save is followed by a run that observes its write.
 * The fingerprint check in `publish` makes the extra run a no-op when the
 * content is genuinely unchanged.
 */
const queuesByScope = new Map<PublishScope, Promise<unknown>>();

/**
 * Builds a per-scope publish queue around a runner.
 *
 * Exported so the ordering guarantees can be verified directly: same-scope
 * requests must run one after another and in order, different scopes must be
 * able to overlap, and a failure must not poison the queue behind it.
 */
export function createPublishQueue(run: (scope: PublishScope, options: { force?: boolean }) => Promise<PublishResult>) {
  return function enqueue(scope: PublishScope = "all", options: { force?: boolean } = {}): Promise<PublishResult> {
    const previous = queuesByScope.get(scope) ?? Promise.resolve();
    const attempt = previous
      .catch(() => undefined)
      .then(() =>
        run(scope, options).catch((error) => {
          const message = error instanceof Error ? error.message : "unknown";
          logServer("error", "publish.failed", { scope, message });
          return {
            scope,
            collections: [] as CollectionKey[],
            assetsCached: 0,
            assetsReused: 0,
            assetsFailed: 0,
            durationMs: 0,
            skipped: true,
            error: message,
          } satisfies PublishResult;
        }),
      );
    // Keep the queue alive but never let it surface as an unhandled rejection.
    const tail = attempt.catch(() => undefined);
    queuesByScope.set(scope, tail);
    void tail.then(() => {
      if (queuesByScope.get(scope) === tail) queuesByScope.delete(scope);
    });
    return attempt;
  };
}

/** Serializes concurrent publish requests so two admin saves cannot interleave writes. */
export const publishSerialized = createPublishQueue((scope, options) => publish(scope, options));

export type { CachedAsset };
