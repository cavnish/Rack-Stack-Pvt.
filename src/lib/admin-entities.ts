import "server-only";
import { db } from "@/db";
import {
  activityLogs, blogPosts, clientLogos, clients, contactMessages, faqs, gallery, homeSliders, homepageSections, industries, inquiries,
  media, pages, productApplications, productBenefits, productComponents, productConfigurations, productFeatures, productImages, productIndustries, productProjects,
  productRelatedProducts, productSpecifications, productStoredMaterials, productStories, productWorkflows, products, projects, redirects, seoSettings,
  serviceFeatures, services, siteSettings, testimonials, users,
} from "@/db/schema";
import { hash } from "bcryptjs";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { clientLogoAdminSchema, productAdminSchema } from "./validation";

export const adminEntities = ["products", "services", "projects", "clients", "client-logos", "testimonials", "gallery", "pages", "industries", "faqs", "blog", "homepage", "home-slider", "inquiries", "contact-messages", "media", "seo", "settings", "users", "activity"] as const;
export type AdminEntity = typeof adminEntities[number];
export function isAdminEntity(value: string): value is AdminEntity { return (adminEntities as readonly string[]).includes(value); }
const bool = (v: unknown) => v === true || v === "true" || v === 1;
const num = (v: unknown, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const text = (v: unknown) => typeof v === "string" ? v.trim() : "";
const nullable = (v: unknown) => text(v) || null;
const status = (v: unknown): "DRAFT" | "PUBLISHED" | "ARCHIVED" => ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(String(v)) ? v as "DRAFT" | "PUBLISHED" | "ARCHIVED" : "DRAFT";

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
    case "inquiries": return db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
    case "contact-messages": return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
    case "media": return db.select().from(media).orderBy(desc(media.createdAt));
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
    const [features, specifications, applications, images, benefits, components, configurations, storedMaterials, stories, workflows, relatedRows, industryRows, projectRows, productFaqs] = await Promise.all([
      db.select().from(productFeatures).where(eq(productFeatures.productId, id)).orderBy(asc(productFeatures.displayOrder)),
      db.select().from(productSpecifications).where(eq(productSpecifications.productId, id)).orderBy(asc(productSpecifications.displayOrder)),
      db.select().from(productApplications).where(eq(productApplications.productId, id)).orderBy(asc(productApplications.displayOrder)),
      db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.displayOrder)),
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
    ]);
    return { ...item, features, specifications, applications, images, benefits, components, configurations, storedMaterials, stories, workflows, relatedProductIds: relatedRows.map((row) => row.relatedProductId), industryIds: industryRows.map((row) => row.industryId), projectIds: projectRows.map((row) => row.projectId), faqs: productFaqs };
  }
  if (entity === "services") {
    const item = (await db.select().from(services).where(eq(services.id, id)).limit(1))[0];
    if (!item) return null;
    return { ...item, features: await db.select().from(serviceFeatures).where(eq(serviceFeatures.serviceId, id)).orderBy(asc(serviceFeatures.displayOrder)) };
  }
  const rows = await listEntity(entity);
  return (rows as Array<{ id: number }>).find((row) => row.id === id) ?? null;
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
        heroImage: data.heroImage || null, heroImagePublicId: data.heroImagePublicId || null, thumbnail: data.thumbnail || null, thumbnailPublicId: data.thumbnailPublicId || null,
        heroTitle: data.heroTitle || null, heroDescription: data.heroDescription || null, specHighlights: data.specHighlights,
        technicalImage: data.technicalImage || null, technicalImagePublicId: data.technicalImagePublicId || null, technicalDescription: data.technicalDescription || null, technicalEnabled: data.technicalEnabled,
        showGallery: data.showGallery, showFeatures: data.showFeatures, showSpecifications: data.showSpecifications, showConfigurations: data.showConfigurations, showApplications: data.showApplications, showStoredMaterials: data.showStoredMaterials, showStories: data.showStories, showWorkflow: data.showWorkflow, showBenefits: data.showBenefits, showComponents: data.showComponents, showFaq: data.showFaq, showRelated: data.showRelated,
        metaTitle: data.metaTitle || null, metaDescription: data.metaDescription || null, keywords: data.keywords || null, focusKeyword: data.focusKeyword || null, ogTitle: data.ogTitle || null, ogDescription: data.ogDescription || null, ogImage: data.ogImage || null, canonicalUrl: data.canonicalUrl || null, robotsIndex: data.robotsIndex,
      }).returning();
      const productId = item.id;
      if (data.features.length) await tx.insert(productFeatures).values(data.features.map((x, i) => ({ productId, title: x.title, description: x.description, icon: x.icon || "CheckCircle2", displayOrder: i })));
      if (data.specifications.length) await tx.insert(productSpecifications).values(data.specifications.map((x, i) => ({ productId, ...x, displayOrder: i })));
      if (data.applications.length) await tx.insert(productApplications).values(data.applications.map((x, i) => ({ productId, application: x.title, title: x.title || null, description: x.description || null, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.images.length) await tx.insert(productImages).values(data.images.map((x, i) => ({ productId, imageUrl: x.imageUrl, altText: x.altText, caption: x.caption || null, displayOrder: i })));
      if (data.benefits.length) await tx.insert(productBenefits).values(data.benefits.map((x, i) => ({ productId, title: x.title, description: x.description, displayOrder: i })));
      if (data.components.length) await tx.insert(productComponents).values(data.components.map((x, i) => ({ productId, title: x.title, description: x.description, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.configurations.length) await tx.insert(productConfigurations).values(data.configurations.map((x, i) => ({ productId, title: x.title, description: x.description, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.storedMaterials.length) await tx.insert(productStoredMaterials).values(data.storedMaterials.map((x, i) => ({ productId, title: x.title, description: x.description, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.stories.length) await tx.insert(productStories).values(data.stories.map((x, i) => ({ productId, title: x.title || null, description: x.description, image: x.image, imagePublicId: x.imagePublicId || null, altText: x.altText || `${item.name} in operation`, displayOrder: i })));
      if (data.workflows.length) await tx.insert(productWorkflows).values(data.workflows.map((x, i) => ({ productId, title: x.title, description: x.description, displayOrder: i })));
      const relatedIds = Array.from(new Set(data.relatedProductIds)).filter((relatedId) => relatedId !== item.id);
      if (relatedIds.length) await tx.insert(productRelatedProducts).values(relatedIds.map((relatedProductId, displayOrder) => ({ productId: item.id, relatedProductId, displayOrder })));
      if (data.industryIds.length) await tx.insert(productIndustries).values(Array.from(new Set(data.industryIds)).map((industryId, displayOrder) => ({ productId: item.id, industryId, displayOrder })));
      if (data.projectIds.length) await tx.insert(productProjects).values(Array.from(new Set(data.projectIds)).map((projectId, displayOrder) => ({ productId: item.id, projectId, displayOrder })));
      if (data.faqs.length) await tx.insert(faqs).values(data.faqs.map((x, displayOrder) => ({ question: x.question, answer: x.answer, entityType: "PRODUCT", entityId: item.id, displayOrder, status: "PUBLISHED" as const })));
      return item;
    });
  }
  if (entity === "services") return (await db.insert(services).values({ name: text(input.name), slug: text(input.slug), shortDescription: text(input.shortDescription), description: text(input.description), heroImage: nullable(input.heroImage), icon: text(input.icon) || "DraftingCompass", featured: bool(input.featured), status: status(input.status), displayOrder: num(input.displayOrder), metaTitle: nullable(input.metaTitle), metaDescription: nullable(input.metaDescription) }).returning())[0];
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
  if (entity === "home-slider") {
    if (input.duplicateId) {
      const source = (await listEntity("home-slider")).find((slide) => slide.id === num(input.duplicateId)) as typeof homeSliders.$inferSelect | undefined;
      if (!source) throw new Error("Slide not found");
      const { id: _ignored, createdAt: _igna, updatedAt: _ignb, startAt: _ignc, endAt: _ignd, ...rest } = source;
      input = { ...rest, title: rest.title ? `${rest.title} (Copy)` : rest.title, status: "DRAFT", startAt: null, endAt: null, sortOrder: num(input.sortOrder, source.sortOrder + 1) as unknown };
    }
    return (await db.insert(homeSliders).values({ eyebrow: nullable(input.eyebrow), title: nullable(input.title), highlightedText: nullable(input.highlightedText), description: nullable(input.description), imageUrl: nullable(input.imageUrl), imagePublicId: nullable(input.imagePublicId), mobileImageUrl: nullable(input.mobileImageUrl), mobileImagePublicId: nullable(input.mobileImagePublicId), imageAlt: nullable(input.imageAlt), primaryButtonText: nullable(input.primaryButtonText) ?? "Explore Solutions", primaryButtonUrl: nullable(input.primaryButtonUrl), secondaryButtonText: nullable(input.secondaryButtonText) ?? "Request a Quote", secondaryButtonUrl: nullable(input.secondaryButtonUrl), status: status(input.status), sortOrder: num(input.sortOrder), overlayOpacity: Math.max(0, Math.min(100, num(input.overlayOpacity, 72))), textAlignment: ["left", "center", "right"].includes(String(input.textAlignment)) ? input.textAlignment as "left" | "center" | "right" : "left", autoplay: bool(input.autoplay), duration: Math.max(2000, num(input.duration, 7000)), startAt: input.startAt ? new Date(String(input.startAt)) : null, endAt: input.endAt ? new Date(String(input.endAt)) : null }).returning())[0];
  }
  if (entity === "users") { const password = text(input.password); if (password.length < 12) throw new Error("Password must be at least 12 characters"); return (await db.insert(users).values({ name: text(input.name), email: text(input.email).toLowerCase(), passwordHash: await hash(password, 12), role: ["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(String(input.role)) ? input.role as "SUPER_ADMIN" | "ADMIN" | "EDITOR" : "EDITOR", isActive: true }).returning({ id: users.id, name: users.name, email: users.email }))[0]; }
  throw new Error(`Creating ${entity} is not supported`);
}

export async function updateEntity(entity: AdminEntity, id: number, input: Record<string, unknown>, currentUserId: number) {
  if (entity === "products") {
    const data = productAdminSchema.parse(input);
    return db.transaction(async (tx) => {
      const previous = (await tx.select({ slug: products.slug }).from(products).where(eq(products.id, id)))[0];
      const [item] = await tx.update(products).set({
        name: data.name, slug: data.slug, shortDescription: data.shortDescription, description: data.description, longDescription: data.longDescription, category: data.category, featured: data.featured, status: data.status, displayOrder: data.displayOrder,
        heroImage: data.heroImage || null, heroImagePublicId: data.heroImagePublicId || null, thumbnail: data.thumbnail || null, thumbnailPublicId: data.thumbnailPublicId || null,
        heroTitle: data.heroTitle || null, heroDescription: data.heroDescription || null, specHighlights: data.specHighlights,
        technicalImage: data.technicalImage || null, technicalImagePublicId: data.technicalImagePublicId || null, technicalDescription: data.technicalDescription || null, technicalEnabled: data.technicalEnabled,
        showGallery: data.showGallery, showFeatures: data.showFeatures, showSpecifications: data.showSpecifications, showConfigurations: data.showConfigurations, showApplications: data.showApplications, showStoredMaterials: data.showStoredMaterials, showStories: data.showStories, showWorkflow: data.showWorkflow, showBenefits: data.showBenefits, showComponents: data.showComponents, showFaq: data.showFaq, showRelated: data.showRelated,
        metaTitle: data.metaTitle || null, metaDescription: data.metaDescription || null, keywords: data.keywords || null, focusKeyword: data.focusKeyword || null, ogTitle: data.ogTitle || null, ogDescription: data.ogDescription || null, ogImage: data.ogImage || null, canonicalUrl: data.canonicalUrl || null, robotsIndex: data.robotsIndex, updatedAt: new Date(),
      }).where(eq(products.id, id)).returning();
      if (!item) throw new Error("Product not found");
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
      if (data.features.length) await tx.insert(productFeatures).values(data.features.map((x, i) => ({ productId: id, title: x.title, description: x.description, icon: x.icon || "CheckCircle2", displayOrder: i })));
      if (data.specifications.length) await tx.insert(productSpecifications).values(data.specifications.map((x, i) => ({ productId: id, ...x, displayOrder: i })));
      if (data.applications.length) await tx.insert(productApplications).values(data.applications.map((x, i) => ({ productId: id, application: x.title, title: x.title || null, description: x.description || null, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.images.length) await tx.insert(productImages).values(data.images.map((x, i) => ({ productId: id, imageUrl: x.imageUrl, altText: x.altText, caption: x.caption || null, displayOrder: i })));
      if (data.benefits.length) await tx.insert(productBenefits).values(data.benefits.map((x, i) => ({ productId: id, title: x.title, description: x.description, displayOrder: i })));
      if (data.components.length) await tx.insert(productComponents).values(data.components.map((x, i) => ({ productId: id, title: x.title, description: x.description, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.configurations.length) await tx.insert(productConfigurations).values(data.configurations.map((x, i) => ({ productId: id, title: x.title, description: x.description, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.storedMaterials.length) await tx.insert(productStoredMaterials).values(data.storedMaterials.map((x, i) => ({ productId: id, title: x.title, description: x.description, image: x.image || null, imagePublicId: x.imagePublicId || null, altText: x.altText || null, displayOrder: i })));
      if (data.stories.length) await tx.insert(productStories).values(data.stories.map((x, i) => ({ productId: id, title: x.title || null, description: x.description, image: x.image, imagePublicId: x.imagePublicId || null, altText: x.altText || `${data.name} in operation`, displayOrder: i })));
      if (data.workflows.length) await tx.insert(productWorkflows).values(data.workflows.map((x, i) => ({ productId: id, title: x.title, description: x.description, displayOrder: i })));
      const relatedIds = Array.from(new Set(data.relatedProductIds)).filter((relatedId) => relatedId !== id);
      if (relatedIds.length) await tx.insert(productRelatedProducts).values(relatedIds.map((relatedProductId, displayOrder) => ({ productId: id, relatedProductId, displayOrder })));
      if (data.industryIds.length) await tx.insert(productIndustries).values(Array.from(new Set(data.industryIds)).map((industryId, displayOrder) => ({ productId: id, industryId, displayOrder })));
      if (data.projectIds.length) await tx.insert(productProjects).values(Array.from(new Set(data.projectIds)).map((projectId, displayOrder) => ({ productId: id, projectId, displayOrder })));
      if (data.faqs.length) await tx.insert(faqs).values(data.faqs.map((x, displayOrder) => ({ question: x.question, answer: x.answer, entityType: "PRODUCT", entityId: id, displayOrder, status: "PUBLISHED" as const })));
      if (previous && previous.slug !== data.slug) await tx.insert(redirects).values({ sourcePath: `/products/${previous.slug}`, destinationPath: `/products/${data.slug}` }).onConflictDoUpdate({ target: redirects.sourcePath, set: { destinationPath: `/products/${data.slug}` } });
      return item;
    });
  }
  if (entity === "services") return (await db.update(services).set({ name: text(input.name), slug: text(input.slug), shortDescription: text(input.shortDescription), description: text(input.description), heroImage: nullable(input.heroImage), icon: text(input.icon) || "DraftingCompass", featured: bool(input.featured), status: status(input.status), displayOrder: num(input.displayOrder), metaTitle: nullable(input.metaTitle), metaDescription: nullable(input.metaDescription), updatedAt: new Date() }).where(eq(services.id, id)).returning())[0];
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
  if (entity === "home-slider") return (await db.update(homeSliders).set({ eyebrow: nullable(input.eyebrow), title: nullable(input.title), highlightedText: nullable(input.highlightedText), description: nullable(input.description), imageUrl: nullable(input.imageUrl), imagePublicId: nullable(input.imagePublicId), mobileImageUrl: nullable(input.mobileImageUrl), mobileImagePublicId: nullable(input.mobileImagePublicId), imageAlt: nullable(input.imageAlt), primaryButtonText: nullable(input.primaryButtonText) ?? "Explore Solutions", primaryButtonUrl: nullable(input.primaryButtonUrl), secondaryButtonText: nullable(input.secondaryButtonText) ?? "Request a Quote", secondaryButtonUrl: nullable(input.secondaryButtonUrl), status: status(input.status), sortOrder: num(input.sortOrder), overlayOpacity: Math.max(0, Math.min(100, num(input.overlayOpacity, 72))), textAlignment: ["left", "center", "right"].includes(String(input.textAlignment)) ? input.textAlignment as "left" | "center" | "right" : "left", autoplay: bool(input.autoplay), duration: Math.max(2000, num(input.duration, 7000)), startAt: input.startAt ? new Date(String(input.startAt)) : null, endAt: input.endAt ? new Date(String(input.endAt)) : null, updatedAt: new Date() }).where(eq(homeSliders.id, id)).returning())[0];
  if (entity === "inquiries") return (await db.update(inquiries).set({ status: ["NEW", "CONTACTED", "QUALIFIED", "QUOTATION_SENT", "WON", "LOST", "SPAM"].includes(String(input.status)) ? input.status as "NEW" | "CONTACTED" | "QUALIFIED" | "QUOTATION_SENT" | "WON" | "LOST" | "SPAM" : "NEW", notes: nullable(input.notes), assignedTo: input.assignedTo ? num(input.assignedTo) : null, updatedAt: new Date() }).where(eq(inquiries.id, id)).returning())[0];
  if (entity === "contact-messages") return (await db.update(contactMessages).set({ status: ["NEW", "READ", "REPLIED", "ARCHIVED", "SPAM"].includes(String(input.status)) ? input.status as "NEW" | "READ" | "REPLIED" | "ARCHIVED" | "SPAM" : "NEW", updatedAt: new Date() }).where(eq(contactMessages.id, id)).returning())[0];
  if (entity === "seo") return (await db.update(seoSettings).set({ siteTitle: text(input.siteTitle), defaultMetaDescription: text(input.defaultMetaDescription), keywords: nullable(input.keywords), ogImage: nullable(input.ogImage), twitterImage: nullable(input.twitterImage), robotsSettings: nullable(input.robotsSettings), googleVerification: nullable(input.googleVerification), canonicalBaseUrl: nullable(input.canonicalBaseUrl), organizationSchema: typeof input.organizationSchema === "object" ? input.organizationSchema as Record<string, unknown> : {}, socialLinks: typeof input.socialLinks === "object" ? input.socialLinks as Record<string, string> : {}, updatedAt: new Date() }).where(eq(seoSettings.id, id)).returning())[0];
  if (entity === "settings") return (await db.update(siteSettings).set({ companyName: text(input.companyName), logo: nullable(input.logo), favicon: nullable(input.favicon), primaryPhone: text(input.primaryPhone), secondaryPhone: nullable(input.secondaryPhone), whatsapp: text(input.whatsapp), email: text(input.email), address: text(input.address), workingHours: text(input.workingHours), footerContent: nullable(input.footerContent), copyright: nullable(input.copyright), googleMapsEmbed: nullable(input.googleMapsEmbed), brochureUrl: nullable(input.brochureUrl), catalogTitle: text(input.catalogTitle) || "Rack & Stack Product Catalog", catalogDescription: text(input.catalogDescription) || "Review our storage system categories and discuss the right configuration for your operation.", catalogLeadGated: bool(input.catalogLeadGated), updatedAt: new Date() }).where(eq(siteSettings.id, id)).returning())[0];
  if (entity === "users") { const current = (await db.select().from(users).where(eq(users.id, id)))[0]; if (!current) throw new Error("User not found"); const role = ["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(String(input.role)) ? input.role as "SUPER_ADMIN" | "ADMIN" | "EDITOR" : current.role; const passwordHash = text(input.password).length >= 12 ? await hash(text(input.password), 12) : current.passwordHash; return (await db.update(users).set({ name: text(input.name), email: text(input.email).toLowerCase(), role, isActive: bool(input.isActive), passwordHash, updatedAt: new Date() }).where(eq(users.id, id)).returning({ id: users.id, name: users.name, email: users.email }))[0]; }
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
  if (entity === "home-slider") return db.delete(homeSliders).where(eq(homeSliders.id, id));
  if (entity === "media") return db.delete(media).where(eq(media.id, id));
  throw new Error(`Deleting ${entity} is disabled to protect business records`);
}
