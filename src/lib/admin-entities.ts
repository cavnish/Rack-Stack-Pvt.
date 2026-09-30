import "server-only";
import { db } from "@/db";
import {
  activityLogs, blogPosts, clientLogos, clients, contactMessages, faqs, gallery, homeOfferCards, homeSliders, homepageSections, industries, inquiries,
  media, pages, productApplications, productBenefits, productComponents, productConfigurations, productFeatures, productGalleryImages, productImages, productIndustries, productProjects,
  productRelatedProducts, productSections, productSpecifications, productStoredMaterials, productStories, productWorkflows, products, projects, redirects, seoSettings,
  serviceFeatures, services, siteSettings, testimonials, users, videoProducts, videos, videoServices,
} from "@/db/schema";
import { hash } from "bcryptjs";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { productAdminSchema, clientLogoAdminSchema, homeOfferCardSchema, UserFacingError } from "./validation";
import { requireInstagramUrl } from "./instagram";
import { getPrimaryGalleryImageUrl, isDeletableUpload, normalizeGalleryPrimaries } from "./product-primary-image";
import { isRemoteImageUrl } from "./public-asset-paths";

export const adminEntities = ["products", "services", "projects", "clients", "client-logos", "testimonials", "gallery", "pages", "industries", "faqs", "blog", "homepage", "home-offer-cards", "home-slider", "inquiries", "contact-messages", "media", "videos", "seo", "settings", "users", "activity"] as const;

export type AdminEntity = typeof adminEntities[number];
export function isAdminEntity(value: string): value is AdminEntity { return (adminEntities as readonly string[]).includes(value); }
const bool = (v: unknown) => v === true || v === "true" || v === 1;
const num = (v: unknown, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const text = (v: unknown) => typeof v === "string" ? v.trim() : "";
const nullable = (v: unknown) => text(v) || null;
const status = (v: unknown): "DRAFT" | "PUBLISHED" | "ARCHIVED" => ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(String(v)) ? v as "DRAFT" | "PUBLISHED" | "ARCHIVED" : "DRAFT";

/**
 * The "Recommended systems" rows to write for a product, in editor order.
 *
 * Three things happen here, each of which used to be a bug or a lost feature:
 *
 * - A product is never recommended on its own page. Self-referencing a row
 *   renders the product you are already looking at, and it is a click that goes
 *   nowhere, so it is dropped rather than stored.
 * - Duplicates collapse to the first occurrence. The table has no unique
 *   constraint on the pair, so without this a double-clicked "add" saves two
 *   identical rows and the product appears twice in the section.
 * - A missing `relatedProducts` array falls back to the legacy id list, all
 *   active. That is what keeps an older admin client, or the import script,
 *   working: it still says "these products are related" and gets exactly that,
 *   instead of quietly saving no recommendations at all.
 */
function recommendedProductRows(data: { relatedProducts?: Array<{ productId: number; isActive: boolean }>; relatedProductIds?: number[] }, productId: number) {
  const explicit = data.relatedProducts;
  const rows: Array<{ productId: number; isActive: boolean }> =
    explicit && explicit.length ? explicit : (data.relatedProductIds ?? []).map((id) => ({ productId: id, isActive: true }));
  const seen = new Set<number>();
  return rows.filter((row) => {
    if (row.productId === productId || seen.has(row.productId)) return false;
    seen.add(row.productId);
    return true;
  });
}

/**
 * Writes an image URL and the Cloudinary public id that belongs to it as one unit.
 *
 * The two are only meaningful together: the public id is what the save handler
 * destroys once the record stops pointing at that asset. Stored independently,
 * a cleared image keeps the id of the file it used to show, and the next save
 * that touches either column can delete an original the record is still using —
 * leaving a row whose URL 404s, which is exactly how a replaced hero slide ends
 * up blank. A local `/assets/...` path has no original to own, so it never
 * carries a public id.
 */
function managedImagePair(url: unknown, publicId: unknown) {
  const imageUrl = nullable(url);
  return { imageUrl, imagePublicId: isRemoteImageUrl(imageUrl ?? "") ? nullable(publicId) : null };
}

/** The same rule as `managedImagePair`, for the second image column on a slider row. */
function managedMobileImagePair(url: unknown, publicId: unknown) {
  const imageUrl = nullable(url);
  return { mobileImageUrl: imageUrl, mobileImagePublicId: isRemoteImageUrl(imageUrl ?? "") ? nullable(publicId) : null };
}

/**
 * Slide duration. The admin number input submits `0` for an empty field, which
 * would otherwise be clamped up to the 2s floor and make the slider race; a
 * missing or non-positive value keeps the authored default instead.
 */
function slideDuration(v: unknown) {
  const parsed = Number(v);
  if (!Number.isFinite(parsed) || parsed <= 0) return 3500;
  return Math.max(2000, Math.round(parsed));
}

export async function listEntity(entity: AdminEntity) {
  switch (entity) {
    case "products": return db.select().from(products).where(isNull(products.deletedAt)).orderBy(asc(products.displayOrder), desc(products.updatedAt));
    case "services": return db.select().from(services).where(isNull(services.deletedAt)).orderBy(asc(services.displayOrder));
    case "projects": return db.select().from(projects).where(isNull(projects.deletedAt)).orderBy(desc(projects.createdAt));
    case "clients": return db.select().from(clients).where(isNull(clients.deletedAt)).orderBy(asc(clients.displayOrder));
    case "client-logos": return db.select().from(clientLogos).orderBy(asc(clientLogos.sortOrder), asc(clientLogos.id));
    case "testimonials": return db.select().from(testimonials).orderBy(asc(testimonials.displayOrder));
    case "gallery": return db.select().from(gallery).orderBy(asc(gallery.displayOrder));
    case "home-slider": return db.select().from(homeSliders).orderBy(asc(homeSliders.sortOrder));
    case "pages": return db.select().from(pages).where(isNull(pages.deletedAt)).orderBy(asc(pages.title));
    case "industries": return db.select().from(industries).orderBy(asc(industries.displayOrder));
    case "faqs": return db.select().from(faqs).orderBy(asc(faqs.entityType), asc(faqs.displayOrder));
    case "blog": return db.select().from(blogPosts).where(isNull(blogPosts.deletedAt)).orderBy(desc(blogPosts.createdAt));
    case "homepage": return db.select().from(homepageSections).orderBy(asc(homepageSections.displayOrder));
    case "home-offer-cards": return db.select().from(homeOfferCards).orderBy(asc(homeOfferCards.displayOrder), asc(homeOfferCards.id));
    case "inquiries": return db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
    case "contact-messages": return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
    case "media": return db.select().from(media).orderBy(desc(media.createdAt));
    case "videos": return db.select().from(videos).where(isNull(videos.deletedAt)).orderBy(asc(videos.displayOrder), desc(videos.updatedAt));
    case "seo": return db.select().from(seoSettings).orderBy(asc(seoSettings.id));
    case "settings": return db.select().from(siteSettings).orderBy(asc(siteSettings.id));
    case "users": return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive, lastLogin: users.lastLogin, createdAt: users.createdAt, updatedAt: users.updatedAt }).from(users).orderBy(asc(users.name));
    case "activity": return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(250);
  }
}

export async function getEntity(entity: AdminEntity, id: number) {
  if (entity === "products") {
    const item = (await db.select().from(products).where(eq(products.id, id)).limit(1))[0];
    if (!item) return null;
    const [features, specifications, applications, images, galleryRows, benefits, components, configurations, storedMaterials, stories, workflows, relatedRows, industryRows, projectRows, productFaqs, sectionRows] = await Promise.all([
      db.select().from(productFeatures).where(eq(productFeatures.productId, id)).orderBy(asc(productFeatures.displayOrder)),
      db.select().from(productSpecifications).where(eq(productSpecifications.productId, id)).orderBy(asc(productSpecifications.displayOrder)),
      db.select().from(productApplications).where(eq(productApplications.productId, id)).orderBy(asc(productApplications.displayOrder)),
      db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.displayOrder)),
      db.select().from(productGalleryImages).where(eq(productGalleryImages.productId, id)).orderBy(asc(productGalleryImages.displayOrder)),
      db.select().from(productBenefits).where(eq(productBenefits.productId, id)).orderBy(asc(productBenefits.displayOrder)),
      db.select().from(productComponents).where(eq(productComponents.productId, id)).orderBy(asc(productComponents.displayOrder)),
      db.select().from(productConfigurations).where(eq(productConfigurations.productId, id)).orderBy(asc(productConfigurations.displayOrder)),
      db.select().from(productStoredMaterials).where(eq(productStoredMaterials.productId, id)).orderBy(asc(productStoredMaterials.displayOrder)),
      db.select().from(productStories).where(eq(productStories.productId, id)).orderBy(asc(productStories.displayOrder)),
      db.select().from(productWorkflows).where(eq(productWorkflows.productId, id)).orderBy(asc(productWorkflows.displayOrder)),
      db.select().from(productRelatedProducts).where(eq(productRelatedProducts.productId, id)).orderBy(asc(productRelatedProducts.displayOrder)),
      db.select().from(productIndustries).where(eq(productIndustries.productId, id)).orderBy(asc(productIndustries.displayOrder)),
      db.select().from(productProjects).where(eq(productProjects.productId, id)).orderBy(asc(productProjects.displayOrder)),
      db.select().from(faqs).where(and(eq(faqs.entityType, "PRODUCT"), eq(faqs.entityId, id))).orderBy(asc(faqs.displayOrder)),
      db.select().from(productSections).where(eq(productSections.productId, id)).orderBy(asc(productSections.displayOrder)),
    ]);
    return { ...item, features, specifications, applications, images, gallery: galleryRows, sections: sectionRows, benefits, components, configurations, storedMaterials, stories, workflows, relatedProducts: relatedRows.map((row) => ({ productId: row.relatedProductId, isActive: row.isActive })), relatedProductIds: relatedRows.map((row) => row.relatedProductId), industryIds: industryRows.map((row) => row.industryId), projectIds: projectRows.map((row) => row.projectId), faqs: productFaqs };
  }
  if (entity === "services") {
    const item = (await db.select().from(services).where(eq(services.id, id)).limit(1))[0];
    if (!item) return null;
    return { ...item, features: await db.select().from(serviceFeatures).where(eq(serviceFeatures.serviceId, id)).orderBy(asc(serviceFeatures.displayOrder)) };
  }
  if (entity === "videos") {
    const item = (await db.select().from(videos).where(eq(videos.id, id)).limit(1))[0];
    if (!item) return null;
    const [productRows, serviceRows] = await Promise.all([
      db.select({ productId: videoProducts.productId }).from(videoProducts).where(eq(videoProducts.videoId, id)),
      db.select({ serviceId: videoServices.serviceId }).from(videoServices).where(eq(videoServices.videoId, id)),
    ]);
    return {
      ...item,
      productIds: productRows.map((row) => row.productId),
      serviceIds: serviceRows.map((row) => row.serviceId),
    };
  }
  const rows = await listEntity(entity);
  return (rows as Array<{ id: number }>).find((row) => row.id === id) ?? null;
}

/**
 * Shared column mapping so create and update cannot drift apart.
 *
 * This is the server-side half of the Instagram URL contract. The admin form
 * validates for immediate feedback, but a request can be crafted by hand, so
 * the permalink is re-parsed here and anything that is not a genuine Instagram
 * Reel is rejected before it can reach the database.
 */
function videoValues(input: Record<string, unknown>, current?: Record<string, unknown>) {
  const title = text(input.title) || text(current?.title);
  if (!title) throw new UserFacingError("Enter a Reel name.");

  // Instagram's official embed is the only delivery mechanism, so the
  // permalink is the one value that has to be right. It is re-validated on
  // every write — the admin form validates for immediate feedback, but a
  // request can be crafted by hand and must not be able to store a link the
  // renderer would then have to sanitise.
  const permalink = requireInstagramUrl(text(input.instagramUrl) || text(current?.instagramUrl));

  // Fields the Reel editor does not expose are carried over from the stored
  // row rather than blanked, so editing a Reel can never silently discard
  // content that another part of the site still reads.
  const keep = (key: string) => nullable(input[key]) ?? nullable(current?.[key]);
  const keepFlag = (key: string, fallback: boolean) =>
    input[key] === undefined ? (current ? bool(current[key]) : fallback) : bool(input[key]);

  return {
    source: "INSTAGRAM" as const,
    title,
    category: text(input.category) || text(current?.category) || "WAREHOUSE",
    description: keep("description"),
    instagramUrl: permalink,
    // `videoUrl` is NOT NULL, so an Instagram entry keeps its canonical
    // permalink there too, giving one "where does this play" value for sorting,
    // search and any consumer not yet taught about `source`.
    videoUrl: permalink,
    // Playback is Instagram's, and so is every derived media field. They are
    // forced rather than left as misleading switches in the admin UI.
    cloudinaryPublicId: null,
    posterUrl: null,
    posterPublicId: null,
    durationSeconds: null,
    width: null,
    height: null,
    ctaText: keep("ctaText"),
    ctaUrl: keep("ctaUrl"),
    href: keep("href"),
    showOnHome: keepFlag("showOnHome", true),
    showOnProducts: keepFlag("showOnProducts", false),
    showOnServices: keepFlag("showOnServices", false),
    isActive: keepFlag("isActive", true),
    autoplay: true,
    muted: true,
    loop: false,
    // A Reel is either shown or it is not. The old draft-by-default status is
    // what made a freshly added Reel invisible on a site that looked configured
    // correctly, so "Enabled" is now the only live switch an editor needs.
    status: "PUBLISHED" as const,
    displayOrder: input.displayOrder === undefined ? num(current?.displayOrder) : num(input.displayOrder),
    metaTitle: keep("metaTitle"),
    metaDescription: keep("metaDescription"),
    updatedAt: new Date(),
  };
}

/**
 * Replaces the many-to-many relations for a video with the submitted selection.
 *
 * A request that mentions neither list is treated as "leave the relations
 * alone" rather than "delete them all", so an API call that does not know about
 * relations cannot wipe them.
 */
async function syncVideoRelations(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  videoId: number,
  input: Record<string, unknown>,
) {
  const touchesProducts = Array.isArray(input.productIds);
  const touchesServices = Array.isArray(input.serviceIds);
  if (!touchesProducts && !touchesServices) return;

  if (touchesProducts) await tx.delete(videoProducts).where(eq(videoProducts.videoId, videoId));
  if (touchesServices) await tx.delete(videoServices).where(eq(videoServices.videoId, videoId));

  const productIds = touchesProducts
    ? Array.from(new Set((input.productIds as unknown[]).map(num).filter(Boolean)))
    : [];
  const serviceIds = touchesServices
    ? Array.from(new Set((input.serviceIds as unknown[]).map(num).filter(Boolean)))
    : [];

  if (productIds.length) await tx.insert(videoProducts).values(productIds.map((productId) => ({ videoId, productId })));
  if (serviceIds.length) await tx.insert(videoServices).values(serviceIds.map((serviceId) => ({ videoId, serviceId })));
}

/**
 * The required `application` value for a product application row.
 *
 * `product_applications.application` is `notNull` while `title` is a nullable
 * display label, and rows seeded before the title field existed carry only
 * `application`. Preferring `title` and falling back to `application` — in that
 * order — means an edited row keeps its own label while a legacy row survives a
 * save it would otherwise be unable to complete.
 */
function applicationLabel(row: { application?: string | null; title?: string | null }): string {
  return (row.title ?? "").trim() || (row.application ?? "").trim();
}

/**
 * The editorial copy columns shared by product create and update.
 *
 * Kept in one function so the two writes cannot drift: a field added to the
 * product form but only to `create` would appear in the database, vanish on the
 * next edit, and be very hard to trace back.
 */
function productContentValues(data: ReturnType<typeof productAdminSchema.parse>) {
  return {
    galleryHeading: nullable(data.galleryHeading),
    featuresHeading: nullable(data.featuresHeading),
    overviewHeading: nullable(data.overviewHeading),
    overviewBody: nullable(data.overviewBody),
    applicationsHeading: nullable(data.applicationsHeading),
    applicationsIntro: nullable(data.applicationsIntro),
    ctaTitle: nullable(data.ctaTitle),
    ctaSubtitle: nullable(data.ctaSubtitle),
    primaryCtaLabel: nullable(data.primaryCtaLabel),
    primaryCtaHref: nullable(data.primaryCtaHref),
    secondaryCtaLabel: nullable(data.secondaryCtaLabel),
    secondaryCtaHref: nullable(data.secondaryCtaHref),
  };
}

/**
 * Replaces a product's gallery with the submitted list.
 *
 * Order is the position in the submitted array, full stop. This used to re-sort
 * every row through the canonical six-slot order, which meant an editor could
 * never choose where a photo sat — and, because the table had a unique index on
 * `(productId, slot)`, could never hold more than six in the first place.
 *
 * Rows are rewritten rather than diffed because the editor sends the whole list
 * on every save. That is safe: `pruneProductGallery` in the route handler diffs
 * the previous and submitted `imageUrl` values first and destroys the remote
 * originals of anything dropped, so a save can never leak an orphaned asset.
 * Local `public/` files are exempt from that pruning, because a file in the
 * repository is not the CMS's to delete.
 *
 * A row with no `isActive` is treated as active, so a payload written before
 * this field existed does not blank out an entire gallery on its first save.
 * Alt text falls back to the row's own title, and then to the product name,
 * because an image with no alt text is an accessibility defect rather than a
 * blank the renderer should paper over.
 *
 * The `isPrimary` flag is normalised rather than trusted: whatever the client
 * sent, exactly one active row ends up flagged, and when the client flagged
 * nothing the row the page would lead with is flagged instead. That keeps the
 * admin badge, the hero, the cards and the social image showing one photograph
 * instead of four different ones.
 */
async function syncProductGallery(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  productId: number,
  productName: string,
  gallery: ReturnType<typeof productAdminSchema.parse>["gallery"],
) {
  await tx.delete(productGalleryImages).where(eq(productGalleryImages.productId, productId));
  if (!gallery.length) return;
  // The position in the array is the order; the flag is decided from it.
  const ordered = gallery.map((item, index) => ({ ...item, displayOrder: index }));
  const normalized = normalizeGalleryPrimaries(ordered);
  await tx.insert(productGalleryImages).values(
    normalized.map((item) => ({
      productId,
      // Retained when the client still sends one, so provenance from the
      // six-slot release survives. Never used to order or validate anything.
      slot: item.slot ?? null,
      label: item.label || null,
      imageUrl: item.imageUrl,
      // Never carries a public id for a `public/` path: that flag is what tells
      // the upload pruner this row does not own a removable remote file.
      cloudinaryPublicId: isDeletableUpload(item.imageUrl, item.cloudinaryPublicId) ? item.cloudinaryPublicId : null,
      altText: item.altText || (item.label ? `${productName}: ${item.label}` : productName),
      caption: item.caption || null,
      width: item.width ?? null,
      height: item.height ?? null,
      isActive: item.isActive ?? true,
      isPrimary: Boolean(item.isPrimary),
      displayOrder: item.displayOrder ?? 0,
    })),
  );
}

/**
 * Replaces a product's free-form content sections with the submitted list.
 *
 * Mirrors `syncProductGallery`: whole-list replace, position is the array index,
 * and a blank `key` is derived from the heading so an editor who never touches
 * the field still gets a working `#anchor`. Keys are de-duplicated rather than
 * trusted, because the column is unique per product and a repeated key would
 * otherwise fail the whole save with a constraint error the editor cannot act on.
 */
async function syncProductSections(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  productId: number,
  sections: ReturnType<typeof productAdminSchema.parse>["sections"],
) {
  await tx.delete(productSections).where(eq(productSections.productId, productId));
  if (!sections.length) return;
  const used = new Set<string>();
  const rows = sections.flatMap((section, displayOrder) => {
    const key = slugifySectionKey(section.key || section.title);
    if (!key || used.has(key)) return [];
    used.add(key);
    return [{
      productId,
      key,
      eyebrow: section.eyebrow || null,
      title: section.title,
      body: section.body || null,
      layout: section.layout || "text",
      imageUrl: section.imageUrl || null,
      imagePublicId: isDeletableUpload(section.imageUrl, section.imagePublicId) ? section.imagePublicId : null,
      altText: section.altText || null,
      ctaLabel: section.ctaLabel || null,
      ctaHref: section.ctaHref || null,
      isActive: section.isActive ?? true,
      displayOrder,
    }];
  });
  if (rows.length) await tx.insert(productSections).values(rows);
}

/** A heading turned into a URL fragment, or an empty string if nothing survives. */
function slugifySectionKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * The product's hero image and thumbnail, taken from the chosen primary.
 *
 * These two columns are what the homepage tile, the related-product cards and
 * the schema.org markup read, and they used to be maintained by hand — which is
 * how a product ended up with a Pexels placeholder in its card while its gallery
 * held the real photograph. Deriving them from the primary keeps a single
 * choice in the admin in charge of the whole page.
 *
 * An explicit value is only a fallback for a product with no gallery at all.
 *
 * Preferring the submitted column here was wrong in a way the admin UI could not
 * work around: the product form always posts `heroImage` and `thumbnail`, because
 * they are inputs on the product carrying whatever was loaded into the form. So
 * choosing a different main image updated the gallery flag and the hero row but
 * left the column pointing at the old photograph — and the product page, the
 * card and the social share image all read the column, so "Set as main image"
 * appeared to do nothing.
 *
 * The gallery is settled to a single primary by `normalizeGalleryPrimaries`
 * before this runs, so its first active row is the whole answer.
 */
function productImageValues(
  gallery: ReturnType<typeof productAdminSchema.parse>["gallery"],
  // The schema types these as `string | null | undefined`: an omitted field and
  // a field explicitly cleared both reach here, and the `||` below already
  // treats them the same, so the parameter has to say so too.
  heroImage: string | null | undefined,
  thumbnail: string | null | undefined,
) {
  const primary = getPrimaryGalleryImageUrl(gallery);
  return {
    heroImage: primary || heroImage || null,
    thumbnail: primary || thumbnail || null,
  };
}

export async function createEntity(entity: AdminEntity, input: Record<string, unknown>, currentUserId: number) {
  if (entity === "products") {
    if (input.duplicateId) {
      const source = await getEntity("products", num(input.duplicateId)) as Awaited<ReturnType<typeof getEntity>> & { name: string; slug: string };
      if (!source) throw new Error("Product not found");
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = source as Record<string, unknown>;
      input = { ...rest, name: `${source.name} (Copy)`, slug: `${source.slug}-copy-${Date.now().toString().slice(-5)}`, status: "DRAFT", featured: false, heroImage: null, thumbnail: null };
    }
    const data = productAdminSchema.parse(input);
    return db.transaction(async (tx) => {
      const [item] = await tx.insert(products).values({
        name: data.name, slug: data.slug, shortDescription: data.shortDescription, description: data.description, longDescription: data.longDescription, category: data.category, featured: data.featured, status: data.status, displayOrder: data.displayOrder,
        ...productImageValues(data.gallery, data.heroImage, data.thumbnail),
        heroImagePublicId: data.heroImagePublicId || null, thumbnailPublicId: data.thumbnailPublicId || null,
        heroTitle: data.heroTitle || null, heroDescription: data.heroDescription || null, specHighlights: data.specHighlights,
        technicalImage: data.technicalImage || null, technicalImagePublicId: data.technicalImagePublicId || null, technicalDescription: data.technicalDescription || null, technicalEnabled: data.technicalEnabled,
        showGallery: data.showGallery, showFeatures: data.showFeatures, showSpecifications: data.showSpecifications, showConfigurations: data.showConfigurations, showApplications: data.showApplications, showStoredMaterials: data.showStoredMaterials, showStories: data.showStories, showWorkflow: data.showWorkflow, showBenefits: data.showBenefits, showComponents: data.showComponents, showFaq: data.showFaq, showRelated: data.showRelated, relatedHeading: nullable(data.relatedHeading), relatedSubheading: nullable(data.relatedSubheading), relatedDescription: nullable(data.relatedDescription),
        ...productContentValues(data),
        metaTitle: data.metaTitle || null, metaDescription: data.metaDescription || null, keywords: data.keywords || null, focusKeyword: data.focusKeyword || null, ogTitle: data.ogTitle || null, ogDescription: data.ogDescription || null, ogImage: data.ogImage || null, canonicalUrl: data.canonicalUrl || null, robotsIndex: data.robotsIndex,
      }).returning();
      const productId = item.id;
      await syncProductGallery(tx, productId, data.name, data.gallery);
      await syncProductSections(tx, productId, data.sections);
      if (data.features.length) await tx.insert(productFeatures).values(data.features.map((x, i) => ({ productId, title: x.title, description: x.description, icon: x.icon || "CheckCircle2", isActive: x.isActive ?? true, displayOrder: i })));
      if (data.specifications.length) await tx.insert(productSpecifications).values(data.specifications.map((x, i) => ({ productId, ...x, displayOrder: i })));
      if (data.applications.length) await tx.insert(productApplications).values(data.applications.map((x, i) => ({ productId, application: applicationLabel(x), title: x.title || null, description: x.description || null, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, isActive: x.isActive ?? true, displayOrder: i })));
      if (data.images.length) await tx.insert(productImages).values(data.images.map((x, i) => ({ productId, imageUrl: x.imageUrl, altText: x.altText, caption: x.caption || null, displayOrder: i })));
      if (data.benefits.length) await tx.insert(productBenefits).values(data.benefits.map((x, i) => ({ productId, title: x.title, description: x.description, displayOrder: i })));
      if (data.components.length) await tx.insert(productComponents).values(data.components.map((x, i) => ({ productId, title: x.title, description: x.description, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.configurations.length) await tx.insert(productConfigurations).values(data.configurations.map((x, i) => ({ productId, title: x.title, description: x.description, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.storedMaterials.length) await tx.insert(productStoredMaterials).values(data.storedMaterials.map((x, i) => ({ productId, title: x.title, description: x.description, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.stories.length) await tx.insert(productStories).values(data.stories.map((x, i) => ({ productId, title: x.title || null, description: x.description, image: x.image, imagePublicId: x.imagePublicId || null, altText: x.altText || `${item.name} in operation`, displayOrder: i })));
      if (data.workflows.length) await tx.insert(productWorkflows).values(data.workflows.map((x, i) => ({ productId, title: x.title, description: x.description, displayOrder: i })));
      const relatedRows = recommendedProductRows(data, item.id);
      if (relatedRows.length) await tx.insert(productRelatedProducts).values(relatedRows.map((related, displayOrder) => ({ productId: item.id, relatedProductId: related.productId, isActive: related.isActive, displayOrder })));
      if (data.industryIds.length) await tx.insert(productIndustries).values(Array.from(new Set(data.industryIds)).map((industryId, displayOrder) => ({ productId: item.id, industryId, displayOrder })));
      if (data.projectIds.length) await tx.insert(productProjects).values(Array.from(new Set(data.projectIds)).map((projectId, displayOrder) => ({ productId: item.id, projectId, displayOrder })));
      if (data.faqs.length) await tx.insert(faqs).values(data.faqs.map((x, displayOrder) => ({ question: x.question, answer: x.answer, entityType: "PRODUCT", entityId: item.id, displayOrder, status: "PUBLISHED" as const })));
      return item;
    });
  }
  if (entity === "services") {
    return db.transaction(async (tx) => {
      const [item] = await tx.insert(services).values({
        name: text(input.name), slug: text(input.slug), shortDescription: text(input.shortDescription), description: text(input.description),
        heroImage: nullable(input.heroImage), heroImagePublicId: nullable(input.heroImagePublicId), icon: text(input.icon) || "DraftingCompass",
        featured: bool(input.featured), status: status(input.status), displayOrder: num(input.displayOrder),
        heroHeading: nullable(input.heroHeading), introHeading: nullable(input.introHeading), introDescription: nullable(input.introDescription),
        introBullets: Array.isArray(input.introBullets) ? input.introBullets.map(String) : [],
        capabilities: Array.isArray(input.capabilities) ? input.capabilities.map(String) : [],
        process: Array.isArray(input.process) ? input.process as Array<{ title: string; description: string }> : [],
        deliverables: Array.isArray(input.deliverables) ? input.deliverables.map(String) : [],
        applications: Array.isArray(input.applications) ? input.applications as Array<{ title: string; description?: string }> : [],
        whyChoosePoints: Array.isArray(input.whyChoosePoints) ? input.whyChoosePoints as Array<{ title: string; description: string }> : [],
        locationCoverage: typeof input.locationCoverage === "object" && input.locationCoverage ? input.locationCoverage as { mumbaiMaharashtra: string[]; panIndia: string[] } : [],
        relatedProductSlugs: Array.isArray(input.relatedProductSlugs) ? input.relatedProductSlugs.map(String) : [],
        galleryImageIds: Array.isArray(input.galleryImageIds) ? (input.galleryImageIds as unknown[]).map(num).filter(Boolean) : [],
        metaTitle: nullable(input.metaTitle), metaDescription: nullable(input.metaDescription), keywords: nullable(input.keywords),
        focusKeyword: nullable(input.focusKeyword), ogTitle: nullable(input.ogTitle), ogDescription: nullable(input.ogDescription),
        ogImage: nullable(input.ogImage), canonicalUrl: nullable(input.canonicalUrl), robotsIndex: input.robotsIndex === undefined ? true : bool(input.robotsIndex),
      }).returning();
      const serviceId = item.id;
      const feats = Array.isArray(input.features) ? input.features as Array<Record<string, unknown>> : [];
      if (feats.length) await tx.insert(serviceFeatures).values(feats.map((f, i) => ({ serviceId, title: text(f.title), description: text(f.description), icon: text(f.icon) || "CheckCircle2", displayOrder: i })));
      return item;
    });
  }
  if (entity === "projects") return (await db.insert(projects).values({ title: text(input.title), slug: text(input.slug), clientName: nullable(input.clientName), location: nullable(input.location), industry: nullable(input.industry), solution: nullable(input.solution), description: text(input.description), challenge: nullable(input.challenge), solutionDescription: nullable(input.solutionDescription), result: nullable(input.result), execution: nullable(input.execution), featured: bool(input.featured), coverImage: nullable(input.coverImage), status: status(input.status), projectDate: input.projectDate ? new Date(String(input.projectDate)) : null, metaTitle: nullable(input.metaTitle), metaDescription: nullable(input.metaDescription) }).returning())[0];
  if (entity === "clients") return (await db.insert(clients).values({ name: text(input.name), logo: nullable(input.logo), cloudinaryPublicId: nullable(input.cloudinaryPublicId), website: nullable(input.website), industry: nullable(input.industry), featured: bool(input.featured), displayOrder: num(input.displayOrder) }).returning())[0];
  if (entity === "client-logos") { const data = clientLogoAdminSchema.parse(input); return (await db.insert(clientLogos).values({ name: data.name, imageUrl: data.imageUrl, imagePublicId: nullable(data.imagePublicId), altText: data.altText, sortOrder: data.sortOrder, isActive: data.isActive, width: data.width ?? null, height: data.height ?? null }).returning())[0]; }
  if (entity === "testimonials") return (await db.insert(testimonials).values({ clientName: text(input.clientName), company: nullable(input.company), designation: nullable(input.designation), content: text(input.content), rating: num(input.rating, 5), image: nullable(input.image), featured: bool(input.featured), status: status(input.status), displayOrder: num(input.displayOrder) }).returning())[0];
  if (entity === "gallery") return (await db.insert(gallery).values({ title: text(input.title), category: text(input.category), imageUrl: text(input.imageUrl), cloudinaryPublicId: nullable(input.cloudinaryPublicId), altText: text(input.altText), description: nullable(input.description), displayOrder: num(input.displayOrder), status: status(input.status) }).returning())[0];
  if (entity === "pages") return (await db.insert(pages).values({ title: text(input.title), slug: text(input.slug), content: text(input.content), heroTitle: nullable(input.heroTitle), heroDescription: nullable(input.heroDescription), heroImage: nullable(input.heroImage), metaTitle: nullable(input.metaTitle), metaDescription: nullable(input.metaDescription), canonicalUrl: nullable(input.canonicalUrl), status: status(input.status) }).returning())[0];
  if (entity === "industries") return (await db.insert(industries).values({ name: text(input.name), slug: text(input.slug), shortDescription: text(input.shortDescription), description: text(input.description), challenges: Array.isArray(input.challenges) ? input.challenges.map(String) : [], benefits: Array.isArray(input.benefits) ? input.benefits.map(String) : [], heroImage: nullable(input.heroImage), icon: text(input.icon) || "Factory", status: status(input.status), featured: bool(input.featured), displayOrder: num(input.displayOrder), metaTitle: nullable(input.metaTitle), metaDescription: nullable(input.metaDescription) }).returning())[0];
  if (entity === "faqs") return (await db.insert(faqs).values({ question: text(input.question), answer: text(input.answer), entityType: text(input.entityType) || "GLOBAL", entityId: input.entityId ? num(input.entityId) : null, displayOrder: num(input.displayOrder), status: status(input.status) }).returning())[0];
  if (entity === "blog") return (await db.insert(blogPosts).values({ title: text(input.title), slug: text(input.slug), excerpt: text(input.excerpt), content: text(input.content), featuredImage: nullable(input.featuredImage), status: status(input.status), featured: bool(input.featured), publishedAt: status(input.status) === "PUBLISHED" ? new Date() : null, metaTitle: nullable(input.metaTitle), metaDescription: nullable(input.metaDescription), keywords: nullable(input.keywords), canonicalUrl: nullable(input.canonicalUrl), authorId: currentUserId }).returning())[0];
  if (entity === "homepage") return (await db.insert(homepageSections).values({ sectionKey: text(input.sectionKey), title: nullable(input.title), subtitle: nullable(input.subtitle), content: typeof input.content === "object" && input.content ? input.content as Record<string, unknown> : {}, enabled: input.enabled === undefined ? true : bool(input.enabled), displayOrder: num(input.displayOrder) }).returning())[0];
  if (entity === "home-offer-cards") {
    const data = homeOfferCardSchema.parse(input);
    return (await db.insert(homeOfferCards).values({
      productId: data.productId ?? null, slug: data.slug || null,
      title: nullable(data.title), description: nullable(data.description),
      imageUrl: nullable(data.imageUrl), imagePublicId: nullable(data.imagePublicId), altText: nullable(data.altText),
      category: nullable(data.category), href: nullable(data.href), ctaLabel: nullable(data.ctaLabel),
      showQuoteButton: data.showQuoteButton,
      displayOrder: data.displayOrder, isActive: data.isActive,
    }).returning())[0];
  }
  if (entity === "home-slider") {
    if (input.duplicateId) {
      const source = (await listEntity("home-slider")).find((slide) => slide.id === num(input.duplicateId)) as typeof homeSliders.$inferSelect | undefined;
      if (!source) throw new Error("Slide not found");
      const { id: _ignored, createdAt: _igna, updatedAt: _ignb, startAt: _ignc, endAt: _ignd, ...rest } = source;
      input = { ...rest, title: rest.title ? `${rest.title} (Copy)` : rest.title, status: "DRAFT", startAt: null, endAt: null, sortOrder: num(input.sortOrder, source.sortOrder + 1) as unknown };
    }
    return (await db.insert(homeSliders).values({ eyebrow: nullable(input.eyebrow), title: nullable(input.title), highlightedText: nullable(input.highlightedText), description: nullable(input.description), ...managedImagePair(input.imageUrl, input.imagePublicId), ...managedMobileImagePair(input.mobileImageUrl, input.mobileImagePublicId), videoUrl: nullable(input.videoUrl), imageAlt: nullable(input.imageAlt), primaryButtonText: nullable(input.primaryButtonText) ?? "Explore Solutions", primaryButtonUrl: nullable(input.primaryButtonUrl), secondaryButtonText: nullable(input.secondaryButtonText) ?? "Request a Quote", secondaryButtonUrl: nullable(input.secondaryButtonUrl), tertiaryButtonText: nullable(input.tertiaryButtonText), tertiaryButtonUrl: nullable(input.tertiaryButtonUrl), trustPoints: Array.isArray(input.trustPoints) ? input.trustPoints.map((point) => String(point).trim()).filter(Boolean) : [], status: status(input.status), sortOrder: num(input.sortOrder), overlayOpacity: Math.max(0, Math.min(100, num(input.overlayOpacity, 72))), textAlignment: ["left", "center", "right"].includes(String(input.textAlignment)) ? input.textAlignment as "left" | "center" | "right" : "left", autoplay: bool(input.autoplay), duration: slideDuration(input.duration), startAt: input.startAt ? new Date(String(input.startAt)) : null, endAt: input.endAt ? new Date(String(input.endAt)) : null }).returning())[0];
  }
  if (entity === "users") { const password = text(input.password); if (password.length < 12) throw new Error("Password must be at least 12 characters"); return (await db.insert(users).values({ name: text(input.name), email: text(input.email).toLowerCase(), passwordHash: await hash(password, 12), role: ["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(String(input.role)) ? input.role as "SUPER_ADMIN" | "ADMIN" | "EDITOR" : "EDITOR", isActive: true }).returning({ id: users.id, name: users.name, email: users.email }))[0]; }
  if (entity === "videos") {
    return db.transaction(async (tx) => {
      const [item] = await tx.insert(videos).values(videoValues(input)).returning();
      await syncVideoRelations(tx, item.id, input);
      return item;
    });
  }
  throw new Error(`Creating ${entity} is not supported`);
}

export async function updateEntity(entity: AdminEntity, id: number, input: Record<string, unknown>, currentUserId: number) {
  if (entity === "products") {
    const data = productAdminSchema.parse(input);
    return db.transaction(async (tx) => {
      const previous = (await tx.select({ slug: products.slug }).from(products).where(eq(products.id, id)))[0];
      const [item] = await tx.update(products).set({
        name: data.name, slug: data.slug, shortDescription: data.shortDescription, description: data.description, longDescription: data.longDescription, category: data.category, featured: data.featured, status: data.status, displayOrder: data.displayOrder,
        ...productImageValues(data.gallery, data.heroImage, data.thumbnail),
        heroImagePublicId: data.heroImagePublicId || null, thumbnailPublicId: data.thumbnailPublicId || null,
        heroTitle: data.heroTitle || null, heroDescription: data.heroDescription || null, specHighlights: data.specHighlights,
        technicalImage: data.technicalImage || null, technicalImagePublicId: data.technicalImagePublicId || null, technicalDescription: data.technicalDescription || null, technicalEnabled: data.technicalEnabled,
        showGallery: data.showGallery, showFeatures: data.showFeatures, showSpecifications: data.showSpecifications, showConfigurations: data.showConfigurations, showApplications: data.showApplications, showStoredMaterials: data.showStoredMaterials, showStories: data.showStories, showWorkflow: data.showWorkflow, showBenefits: data.showBenefits, showComponents: data.showComponents, showFaq: data.showFaq, showRelated: data.showRelated, relatedHeading: nullable(data.relatedHeading), relatedSubheading: nullable(data.relatedSubheading), relatedDescription: nullable(data.relatedDescription),
        ...productContentValues(data),
        metaTitle: data.metaTitle || null, metaDescription: data.metaDescription || null, keywords: data.keywords || null, focusKeyword: data.focusKeyword || null, ogTitle: data.ogTitle || null, ogDescription: data.ogDescription || null, ogImage: data.ogImage || null, canonicalUrl: data.canonicalUrl || null, robotsIndex: data.robotsIndex, updatedAt: new Date(),
      }).where(eq(products.id, id)).returning();
      if (!item) throw new Error("Product not found");
      await syncProductGallery(tx, id, data.name, data.gallery);
      await syncProductSections(tx, id, data.sections);
      await Promise.all([
        tx.delete(productFeatures).where(eq(productFeatures.productId, id)),
        tx.delete(productSpecifications).where(eq(productSpecifications.productId, id)),
        tx.delete(productApplications).where(eq(productApplications.productId, id)),
        tx.delete(productImages).where(eq(productImages.productId, id)),
        tx.delete(productBenefits).where(eq(productBenefits.productId, id)),
        tx.delete(productComponents).where(eq(productComponents.productId, id)),
        tx.delete(productConfigurations).where(eq(productConfigurations.productId, id)),
        tx.delete(productStoredMaterials).where(eq(productStoredMaterials.productId, id)),
        tx.delete(productStories).where(eq(productStories.productId, id)),
        tx.delete(productWorkflows).where(eq(productWorkflows.productId, id)),
        tx.delete(productRelatedProducts).where(eq(productRelatedProducts.productId, id)),
        tx.delete(productIndustries).where(eq(productIndustries.productId, id)),
        tx.delete(productProjects).where(eq(productProjects.productId, id)),
        tx.delete(faqs).where(and(eq(faqs.entityType, "PRODUCT"), eq(faqs.entityId, id))),
      ]);
      if (data.features.length) await tx.insert(productFeatures).values(data.features.map((x, i) => ({ productId: id, title: x.title, description: x.description, icon: x.icon || "CheckCircle2", isActive: x.isActive ?? true, displayOrder: i })));
      if (data.specifications.length) await tx.insert(productSpecifications).values(data.specifications.map((x, i) => ({ productId: id, ...x, displayOrder: i })));
      if (data.applications.length) await tx.insert(productApplications).values(data.applications.map((x, i) => ({ productId: id, application: applicationLabel(x), title: x.title || null, description: x.description || null, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, isActive: x.isActive ?? true, displayOrder: i })));
      if (data.images.length) await tx.insert(productImages).values(data.images.map((x, i) => ({ productId: id, imageUrl: x.imageUrl, altText: x.altText, caption: x.caption || null, displayOrder: i })));
      if (data.benefits.length) await tx.insert(productBenefits).values(data.benefits.map((x, i) => ({ productId: id, title: x.title, description: x.description, displayOrder: i })));
      if (data.components.length) await tx.insert(productComponents).values(data.components.map((x, i) => ({ productId: id, title: x.title, description: x.description, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.configurations.length) await tx.insert(productConfigurations).values(data.configurations.map((x, i) => ({ productId: id, title: x.title, description: x.description, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.storedMaterials.length) await tx.insert(productStoredMaterials).values(data.storedMaterials.map((x, i) => ({ productId: id, title: x.title, description: x.description, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.stories.length) await tx.insert(productStories).values(data.stories.map((x, i) => ({ productId: id, title: x.title || null, description: x.description, image: x.image, imagePublicId: x.imagePublicId || null, altText: x.altText || `${data.name} in operation`, displayOrder: i })));
      if (data.workflows.length) await tx.insert(productWorkflows).values(data.workflows.map((x, i) => ({ productId: id, title: x.title, description: x.description, displayOrder: i })));
      const relatedRows = recommendedProductRows(data, id);
      if (relatedRows.length) await tx.insert(productRelatedProducts).values(relatedRows.map((related, displayOrder) => ({ productId: id, relatedProductId: related.productId, isActive: related.isActive, displayOrder })));
      if (data.industryIds.length) await tx.insert(productIndustries).values(Array.from(new Set(data.industryIds)).map((industryId, displayOrder) => ({ productId: id, industryId, displayOrder })));
      if (data.projectIds.length) await tx.insert(productProjects).values(Array.from(new Set(data.projectIds)).map((projectId, displayOrder) => ({ productId: id, projectId, displayOrder })));
      if (data.faqs.length) await tx.insert(faqs).values(data.faqs.map((x, displayOrder) => ({ question: x.question, answer: x.answer, entityType: "PRODUCT", entityId: id, displayOrder, status: "PUBLISHED" as const })));
      if (previous && previous.slug !== data.slug) await tx.insert(redirects).values({ sourcePath: `/products/${previous.slug}`, destinationPath: `/products/${data.slug}` }).onConflictDoUpdate({ target: redirects.sourcePath, set: { destinationPath: `/products/${data.slug}` } });
      return item;
    });
  }
  if (entity === "services") {
    return db.transaction(async (tx) => {
      const [item] = await tx.update(services).set({
        name: text(input.name), slug: text(input.slug), shortDescription: text(input.shortDescription), description: text(input.description),
        heroImage: nullable(input.heroImage), heroImagePublicId: nullable(input.heroImagePublicId), icon: text(input.icon) || "DraftingCompass",
        featured: bool(input.featured), status: status(input.status), displayOrder: num(input.displayOrder),
        heroHeading: nullable(input.heroHeading), introHeading: nullable(input.introHeading), introDescription: nullable(input.introDescription),
        introBullets: Array.isArray(input.introBullets) ? input.introBullets.map(String) : [],
        capabilities: Array.isArray(input.capabilities) ? input.capabilities.map(String) : [],
        process: Array.isArray(input.process) ? input.process as Array<{ title: string; description: string }> : [],
        deliverables: Array.isArray(input.deliverables) ? input.deliverables.map(String) : [],
        applications: Array.isArray(input.applications) ? input.applications as Array<{ title: string; description?: string }> : [],
        whyChoosePoints: Array.isArray(input.whyChoosePoints) ? input.whyChoosePoints as Array<{ title: string; description: string }> : [],
        locationCoverage: typeof input.locationCoverage === "object" && input.locationCoverage ? input.locationCoverage as { mumbaiMaharashtra: string[]; panIndia: string[] } : [],
        relatedProductSlugs: Array.isArray(input.relatedProductSlugs) ? input.relatedProductSlugs.map(String) : [],
        galleryImageIds: Array.isArray(input.galleryImageIds) ? (input.galleryImageIds as unknown[]).map(num).filter(Boolean) : [],
        metaTitle: nullable(input.metaTitle), metaDescription: nullable(input.metaDescription), keywords: nullable(input.keywords),
        focusKeyword: nullable(input.focusKeyword), ogTitle: nullable(input.ogTitle), ogDescription: nullable(input.ogDescription),
        ogImage: nullable(input.ogImage), canonicalUrl: nullable(input.canonicalUrl), robotsIndex: input.robotsIndex === undefined ? true : bool(input.robotsIndex),
        updatedAt: new Date(),
      }).where(eq(services.id, id)).returning();
      if (!item) throw new Error("Service not found");
      await tx.delete(serviceFeatures).where(eq(serviceFeatures.serviceId, id));
      const feats = Array.isArray(input.features) ? input.features as Array<Record<string, unknown>> : [];
      if (feats.length) await tx.insert(serviceFeatures).values(feats.map((f, i) => ({ serviceId: id, title: text(f.title), description: text(f.description), icon: text(f.icon) || "CheckCircle2", displayOrder: i })));
      return item;
    });
  }
  if (entity === "projects") return (await db.update(projects).set({ title: text(input.title), slug: text(input.slug), clientName: nullable(input.clientName), location: nullable(input.location), industry: nullable(input.industry), solution: nullable(input.solution), description: text(input.description), challenge: nullable(input.challenge), solutionDescription: nullable(input.solutionDescription), result: nullable(input.result), execution: nullable(input.execution), featured: bool(input.featured), coverImage: nullable(input.coverImage), status: status(input.status), projectDate: input.projectDate ? new Date(String(input.projectDate)) : null, metaTitle: nullable(input.metaTitle), metaDescription: nullable(input.metaDescription), updatedAt: new Date() }).where(eq(projects.id, id)).returning())[0];
  if (entity === "clients") return (await db.update(clients).set({ name: text(input.name), logo: nullable(input.logo), cloudinaryPublicId: nullable(input.cloudinaryPublicId), website: nullable(input.website), industry: nullable(input.industry), featured: bool(input.featured), displayOrder: num(input.displayOrder) }).where(eq(clients.id, id)).returning())[0];
  if (entity === "client-logos") { const data = clientLogoAdminSchema.parse(input); return (await db.update(clientLogos).set({ name: data.name, imageUrl: data.imageUrl, imagePublicId: nullable(data.imagePublicId), altText: data.altText, sortOrder: data.sortOrder, isActive: data.isActive, width: data.width ?? null, height: data.height ?? null, updatedAt: new Date() }).where(eq(clientLogos.id, id)).returning())[0]; }
  if (entity === "testimonials") return (await db.update(testimonials).set({ clientName: text(input.clientName), company: nullable(input.company), designation: nullable(input.designation), content: text(input.content), rating: num(input.rating, 5), image: nullable(input.image), featured: bool(input.featured), status: status(input.status), displayOrder: num(input.displayOrder), updatedAt: new Date() }).where(eq(testimonials.id, id)).returning())[0];
  if (entity === "gallery") return (await db.update(gallery).set({ title: text(input.title), category: text(input.category), imageUrl: text(input.imageUrl), cloudinaryPublicId: nullable(input.cloudinaryPublicId), altText: text(input.altText), description: nullable(input.description), displayOrder: num(input.displayOrder), status: status(input.status), updatedAt: new Date() }).where(eq(gallery.id, id)).returning())[0];
  if (entity === "pages") return (await db.update(pages).set({ title: text(input.title), slug: text(input.slug), content: text(input.content), heroTitle: nullable(input.heroTitle), heroDescription: nullable(input.heroDescription), heroImage: nullable(input.heroImage), metaTitle: nullable(input.metaTitle), metaDescription: nullable(input.metaDescription), canonicalUrl: nullable(input.canonicalUrl), status: status(input.status), updatedAt: new Date() }).where(eq(pages.id, id)).returning())[0];
  if (entity === "industries") return (await db.update(industries).set({ name: text(input.name), slug: text(input.slug), shortDescription: text(input.shortDescription), description: text(input.description), challenges: Array.isArray(input.challenges) ? input.challenges.map(String) : [], benefits: Array.isArray(input.benefits) ? input.benefits.map(String) : [], heroImage: nullable(input.heroImage), icon: text(input.icon) || "Factory", status: status(input.status), featured: bool(input.featured), displayOrder: num(input.displayOrder), metaTitle: nullable(input.metaTitle), metaDescription: nullable(input.metaDescription), updatedAt: new Date() }).where(eq(industries.id, id)).returning())[0];
  if (entity === "faqs") return (await db.update(faqs).set({ question: text(input.question), answer: text(input.answer), entityType: text(input.entityType) || "GLOBAL", entityId: input.entityId ? num(input.entityId) : null, displayOrder: num(input.displayOrder), status: status(input.status), updatedAt: new Date() }).where(eq(faqs.id, id)).returning())[0];
  if (entity === "blog") return (await db.update(blogPosts).set({ title: text(input.title), slug: text(input.slug), excerpt: text(input.excerpt), content: text(input.content), featuredImage: nullable(input.featuredImage), status: status(input.status), featured: bool(input.featured), publishedAt: status(input.status) === "PUBLISHED" ? new Date() : null, metaTitle: nullable(input.metaTitle), metaDescription: nullable(input.metaDescription), keywords: nullable(input.keywords), canonicalUrl: nullable(input.canonicalUrl), updatedAt: new Date() }).where(eq(blogPosts.id, id)).returning())[0];
  if (entity === "homepage") return (await db.update(homepageSections).set({ sectionKey: text(input.sectionKey), title: nullable(input.title), subtitle: nullable(input.subtitle), content: typeof input.content === "object" && input.content ? input.content as Record<string, unknown> : {}, enabled: bool(input.enabled), displayOrder: num(input.displayOrder), updatedAt: new Date() }).where(eq(homepageSections.id, id)).returning())[0];
  if (entity === "home-offer-cards") {
    const data = homeOfferCardSchema.parse(input);
    return (await db.update(homeOfferCards).set({
      productId: data.productId ?? null, slug: data.slug || null,
      title: nullable(data.title), description: nullable(data.description),
      imageUrl: nullable(data.imageUrl), imagePublicId: nullable(data.imagePublicId), altText: nullable(data.altText),
      category: nullable(data.category), href: nullable(data.href), ctaLabel: nullable(data.ctaLabel),
      showQuoteButton: data.showQuoteButton,
      displayOrder: data.displayOrder, isActive: data.isActive, updatedAt: new Date(),
    }).where(eq(homeOfferCards.id, id)).returning())[0];
  }
  if (entity === "home-slider") return (await db.update(homeSliders).set({ eyebrow: nullable(input.eyebrow), title: nullable(input.title), highlightedText: nullable(input.highlightedText), description: nullable(input.description), ...managedImagePair(input.imageUrl, input.imagePublicId), ...managedMobileImagePair(input.mobileImageUrl, input.mobileImagePublicId), videoUrl: nullable(input.videoUrl), imageAlt: nullable(input.imageAlt), primaryButtonText: nullable(input.primaryButtonText) ?? "Explore Solutions", primaryButtonUrl: nullable(input.primaryButtonUrl), secondaryButtonText: nullable(input.secondaryButtonText) ?? "Request a Quote", secondaryButtonUrl: nullable(input.secondaryButtonUrl), tertiaryButtonText: nullable(input.tertiaryButtonText), tertiaryButtonUrl: nullable(input.tertiaryButtonUrl), trustPoints: Array.isArray(input.trustPoints) ? input.trustPoints.map((point) => String(point).trim()).filter(Boolean) : [], status: status(input.status), sortOrder: num(input.sortOrder), overlayOpacity: Math.max(0, Math.min(100, num(input.overlayOpacity, 72))), textAlignment: ["left", "center", "right"].includes(String(input.textAlignment)) ? input.textAlignment as "left" | "center" | "right" : "left", autoplay: bool(input.autoplay), duration: slideDuration(input.duration), startAt: input.startAt ? new Date(String(input.startAt)) : null, endAt: input.endAt ? new Date(String(input.endAt)) : null, updatedAt: new Date() }).where(eq(homeSliders.id, id)).returning())[0];
  if (entity === "inquiries") return (await db.update(inquiries).set({ status: ["NEW", "CONTACTED", "QUALIFIED", "QUOTATION_SENT", "WON", "LOST", "SPAM"].includes(String(input.status)) ? input.status as "NEW" | "CONTACTED" | "QUALIFIED" | "QUOTATION_SENT" | "WON" | "LOST" | "SPAM" : "NEW", notes: nullable(input.notes), assignedTo: input.assignedTo ? num(input.assignedTo) : null, updatedAt: new Date() }).where(eq(inquiries.id, id)).returning())[0];
  if (entity === "contact-messages") return (await db.update(contactMessages).set({ status: ["NEW", "READ", "REPLIED", "ARCHIVED", "SPAM"].includes(String(input.status)) ? input.status as "NEW" | "READ" | "REPLIED" | "ARCHIVED" | "SPAM" : "NEW", updatedAt: new Date() }).where(eq(contactMessages.id, id)).returning())[0];
  if (entity === "seo") return (await db.update(seoSettings).set({ siteTitle: text(input.siteTitle), defaultMetaDescription: text(input.defaultMetaDescription), keywords: nullable(input.keywords), ogImage: nullable(input.ogImage), twitterImage: nullable(input.twitterImage), robotsSettings: nullable(input.robotsSettings), googleVerification: nullable(input.googleVerification), canonicalBaseUrl: nullable(input.canonicalBaseUrl), organizationSchema: typeof input.organizationSchema === "object" ? input.organizationSchema as Record<string, unknown> : {}, socialLinks: typeof input.socialLinks === "object" ? input.socialLinks as Record<string, string> : {}, updatedAt: new Date() }).where(eq(seoSettings.id, id)).returning())[0];
  if (entity === "settings") return (await db.update(siteSettings).set({ companyName: text(input.companyName), logo: nullable(input.logo), favicon: nullable(input.favicon), primaryPhone: text(input.primaryPhone), secondaryPhone: nullable(input.secondaryPhone), whatsapp: text(input.whatsapp), email: text(input.email), address: text(input.address), workingHours: text(input.workingHours), footerContent: nullable(input.footerContent), copyright: nullable(input.copyright), googleMapsEmbed: nullable(input.googleMapsEmbed), brochureUrl: nullable(input.brochureUrl), catalogTitle: text(input.catalogTitle) || "Rack & Stack Product Catalog", catalogDescription: text(input.catalogDescription) || "See our storage systems and talk to us about the right setup for your business.", catalogLeadGated: bool(input.catalogLeadGated), updatedAt: new Date() }).where(eq(siteSettings.id, id)).returning())[0];
  if (entity === "users") { const current = (await db.select().from(users).where(eq(users.id, id)))[0]; if (!current) throw new Error("User not found"); const role = ["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(String(input.role)) ? input.role as "SUPER_ADMIN" | "ADMIN" | "EDITOR" : current.role; const passwordHash = text(input.password).length >= 12 ? await hash(text(input.password), 12) : current.passwordHash; return (await db.update(users).set({ name: text(input.name), email: text(input.email).toLowerCase(), role, isActive: bool(input.isActive), passwordHash, updatedAt: new Date() }).where(eq(users.id, id)).returning({ id: users.id, name: users.name, email: users.email }))[0]; }
  if (entity === "videos") {
    const current = (await db.select().from(videos).where(eq(videos.id, id)).limit(1))[0];
    if (!current) throw new Error("Reel not found");
    return db.transaction(async (tx) => {
      const [item] = await tx.update(videos).set(videoValues(input, current)).where(eq(videos.id, id)).returning();
      if (!item) throw new Error("Reel not found");
      await syncVideoRelations(tx, id, input);
      return item;
    });
  }
  throw new Error(`Updating ${entity} is not supported`);
}

export async function deleteEntity(entity: AdminEntity, id: number) {
  const now = new Date();
  if (entity === "products") return db.update(products).set({ deletedAt: now, status: "ARCHIVED", updatedAt: now }).where(eq(products.id, id));
  if (entity === "services") return db.update(services).set({ deletedAt: now, status: "ARCHIVED", updatedAt: now }).where(eq(services.id, id));
  if (entity === "projects") return db.update(projects).set({ deletedAt: now, status: "ARCHIVED", updatedAt: now }).where(eq(projects.id, id));
  if (entity === "clients") return db.update(clients).set({ deletedAt: now }).where(eq(clients.id, id));
  if (entity === "client-logos") return db.delete(clientLogos).where(eq(clientLogos.id, id));
  if (entity === "pages") return db.update(pages).set({ deletedAt: now, status: "ARCHIVED", updatedAt: now }).where(eq(pages.id, id));
  if (entity === "blog") return db.update(blogPosts).set({ deletedAt: now, status: "ARCHIVED", updatedAt: now }).where(eq(blogPosts.id, id));
  if (entity === "testimonials") return db.delete(testimonials).where(eq(testimonials.id, id));
  if (entity === "gallery") return db.delete(gallery).where(eq(gallery.id, id));
  if (entity === "industries") return db.delete(industries).where(eq(industries.id, id));
  if (entity === "faqs") return db.delete(faqs).where(eq(faqs.id, id));
  if (entity === "homepage") return db.delete(homepageSections).where(eq(homepageSections.id, id));
  if (entity === "home-offer-cards") return db.delete(homeOfferCards).where(eq(homeOfferCards.id, id));
  if (entity === "home-slider") return db.delete(homeSliders).where(eq(homeSliders.id, id));
  if (entity === "media") return db.delete(media).where(eq(media.id, id));
  if (entity === "videos") return db.delete(videos).where(eq(videos.id, id));
  throw new Error(`Deleting ${entity} is disabled to protect business records`);
}
