import { z } from "zod";

const phone = z.string().trim().min(7, "Enter a valid phone number").max(30);
export const loginSchema = z.object({ email: z.email().transform((v) => v.toLowerCase()), password: z.string().min(8).max(128) });
export const inquirySchema = z.object({
  name: z.string().trim().min(2).max(100), company: z.string().trim().min(2).max(150), email: z.email(), phone,
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")), city: z.string().trim().max(100).optional(), state: z.string().trim().max(100).optional(),
  productId: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)), serviceId: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  requirement: z.string().trim().min(3).max(200), warehouseSize: z.string().trim().max(100).optional(), loadRequirement: z.string().trim().max(200).optional(),
  message: z.string().trim().max(3000).optional(), sourcePage: z.string().trim().max(300).optional(), website: z.string().max(0).optional(),
});
export const contactSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.email(), phone: z.string().trim().max(30).optional(), company: z.string().trim().max(150).optional(), subject: z.string().trim().min(3).max(200), message: z.string().trim().min(10).max(3000), website: z.string().max(0).optional() });
export const newsletterSchema = z.object({ email: z.email(), website: z.string().max(0).optional() });
export const productAdminSchema = z.object({ name: z.string().min(2).max(160), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), shortDescription: z.string().min(10).max(500), description: z.string().min(20), longDescription: z.string().nullable().optional(), category: z.string().min(2), featured: z.boolean().default(false), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]), displayOrder: z.coerce.number().int().default(0), heroImage: z.url().nullable().optional().or(z.literal("")), heroImagePublicId: z.string().nullable().optional().or(z.literal("")), thumbnail: z.url().nullable().optional().or(z.literal("")), thumbnailPublicId: z.string().nullable().optional().or(z.literal("")), heroTitle: z.string().nullable().optional(), heroDescription: z.string().nullable().optional(), specHighlights: z.array(z.string()).default([]), technicalImage: z.url().nullable().optional().or(z.literal("")), technicalImagePublicId: z.string().nullable().optional().or(z.literal("")), technicalDescription: z.string().nullable().optional(), technicalEnabled: z.boolean().default(false),
  showGallery: z.boolean().default(true), showFeatures: z.boolean().default(true), showSpecifications: z.boolean().default(true), showConfigurations: z.boolean().default(true), showApplications: z.boolean().default(true), showStoredMaterials: z.boolean().default(true), showStories: z.boolean().default(true), showWorkflow: z.boolean().default(true), showBenefits: z.boolean().default(true), showComponents: z.boolean().default(true), showFaq: z.boolean().default(true), showRelated: z.boolean().default(true),
  metaTitle: z.string().max(70).nullable().optional(), metaDescription: z.string().max(180).nullable().optional(), keywords: z.string().nullable().optional(), focusKeyword: z.string().nullable().optional(), ogTitle: z.string().nullable().optional(), ogDescription: z.string().nullable().optional(), ogImage: z.url().nullable().optional().or(z.literal("")), canonicalUrl: z.string().nullable().optional(), robotsIndex: z.boolean().default(true),
  features: z.array(z.object({ title: z.string().min(1), description: z.string().min(1), icon: z.string().nullable().optional() })).default([]),
  specifications: z.array(z.object({ specificationName: z.string().min(1), specificationValue: z.string().min(1) })).default([]),
  applications: z.array(z.object({ title: z.string().min(1), description: z.string().nullable().optional(), image: z.string().nullable().optional(), imagePublicId: z.string().nullable().optional(), altText: z.string().nullable().optional() })).default([]),
  images: z.array(z.object({ imageUrl: z.url(), altText: z.string().min(2), caption: z.string().nullable().optional() })).default([]),
  benefits: z.array(z.object({ title: z.string().min(1), description: z.string().min(1) })).default([]),
  components: z.array(z.object({ title: z.string().min(1), description: z.string().min(1), image: z.string().nullable().optional(), imagePublicId: z.string().nullable().optional(), altText: z.string().nullable().optional() })).default([]),
  configurations: z.array(z.object({ title: z.string().min(1), description: z.string().min(1), image: z.string().nullable().optional(), imagePublicId: z.string().nullable().optional(), altText: z.string().nullable().optional() })).default([]),
  storedMaterials: z.array(z.object({ title: z.string().min(1), description: z.string().min(1), image: z.string().nullable().optional(), imagePublicId: z.string().nullable().optional(), altText: z.string().nullable().optional() })).default([]),
  stories: z.array(z.object({ title: z.string().nullable().optional(), description: z.string().min(1), image: z.string().min(1), imagePublicId: z.string().nullable().optional(), altText: z.string().min(1).nullable().optional() })).default([]),
  workflows: z.array(z.object({ title: z.string().min(1), description: z.string().min(1) })).default([]),
  relatedProductIds: z.array(z.coerce.number().int().positive()).default([]),
  industryIds: z.array(z.coerce.number().int().positive()).default([]),
  projectIds: z.array(z.coerce.number().int().positive()).default([]),
  faqs: z.array(z.object({ question: z.string().min(3), answer: z.string().min(3) })).default([]),
});
export const genericContentSchema = z.record(z.string(), z.unknown());
export const clientLogoAdminSchema = z.object({
  name: z.string().trim().min(2).max(160),
  imageUrl: z.url().or(z.literal("")),
  imagePublicId: z.string().trim().max(300).regex(/^[a-zA-Z0-9_\-/.]*$/).nullable().optional(),
  altText: z.string().trim().min(2).max(200),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  width: z.coerce.number().int().positive().nullable().optional(),
  height: z.coerce.number().int().positive().nullable().optional(),
});
export type ClientLogoAdminInput = z.infer<typeof clientLogoAdminSchema>;
