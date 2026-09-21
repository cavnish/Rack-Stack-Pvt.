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
export const productAdminSchema = z.object({ name: z.string().min(2).max(160), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), shortDescription: z.string().min(10).max(500), description: z.string().min(20), longDescription: z.string().optional(), category: z.string().min(2), featured: z.boolean().default(false), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]), displayOrder: z.coerce.number().int().default(0), heroImage: z.url().optional().or(z.literal("")), thumbnail: z.url().optional().or(z.literal("")), metaTitle: z.string().max(70).optional(), metaDescription: z.string().max(180).optional(), keywords: z.string().optional(), focusKeyword: z.string().optional(), canonicalUrl: z.string().optional(),
  features: z.array(z.object({ title: z.string().min(1), description: z.string().min(1), icon: z.string().optional() })).default([]),
  specifications: z.array(z.object({ specificationName: z.string().min(1), specificationValue: z.string().min(1) })).default([]),
  applications: z.array(z.object({ application: z.string().min(1) })).default([]),
  images: z.array(z.object({ imageUrl: z.url(), altText: z.string().min(2), caption: z.string().optional() })).default([]),
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
