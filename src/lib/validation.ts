import { z } from "zod";
import { isValidPhone } from "./contact-format";
import { productGallerySlotKeys } from "./product-gallery-slots";

/**
 * A failure whose message was written for the person filling in the admin form.
 *
 * The admin API returns these verbatim and collapses every other error into a
 * generic one, so a thrown message is only ever safe to surface when the type
 * says so. Keep internal detail — column names, stack context, driver output —
 * out of it.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

/**
 * Phone number rules.
 *
 * The shape and digit-count checks are imported from `contact-format` so the
 * browser form and this schema cannot disagree. Shape and digit count are
 * combined in a single `refine` on purpose: split across a `regex` and a
 * `refine`, Zod runs both when the first fails and reports the same message
 * twice, so the API returned `["Enter a valid phone number", "Enter a valid
 * phone number"]` for a single mistake.
 */
const phone = z
  .string()
  .trim()
  .min(1, "Enter your phone number")
  .max(40, "Phone number is too long")
  .refine(
    (value) => {
      // An empty value is already reported by `min(1)`. Zod keeps running later
      // checks after an earlier one fails, so short-circuiting here is what
      // stops an empty phone field reporting "Enter a valid phone number" too.
      return value.length === 0 || isValidPhone(value);
    },
    "Enter a valid phone number",
  );

export const loginSchema = z.object({ email: z.email().transform((v) => v.toLowerCase()), password: z.string().min(8).max(128) });
export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters").max(100, "Enter at most 100 characters"), company: z.string().trim().min(2, "Enter at least 2 characters").max(150), email: z.email("Enter a valid email address"), phone,
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")), city: z.string().trim().max(100).optional(), state: z.string().trim().max(100).optional(),
  productId: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)), productSlug: z.string().trim().max(160).optional(), productName: z.string().trim().max(200).optional(), serviceId: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  quantity: z.string().trim().max(80).optional(), location: z.string().trim().max(160).optional(),
  /**
   * `requirement` is the short admin-facing summary and `message` is the
   * visitor's own words. Both arrive from the form, but `requirement` stays
   * optional so a caller that only sends `message` is not rejected with a raw
   * Zod "expected string, received undefined" — the route derives it instead.
   */
  requirement: z.string().trim().max(200).optional(), warehouseSize: z.string().trim().max(100).optional(), loadRequirement: z.string().trim().max(200).optional(),
  message: z.string().trim().min(3, "Tell us about your requirement").max(3000), sourcePage: z.string().trim().max(300).optional(), website: z.string().max(0).optional(),
});
export const contactSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.email(), phone: z.string().trim().max(30).optional(), company: z.string().trim().max(150).optional(), subject: z.string().trim().min(3).max(200), message: z.string().trim().min(10).max(3000), website: z.string().max(0).optional() });
export const newsletterSchema = z.object({ email: z.email(), website: z.string().max(0).optional() });
export const productAdminSchema = z.object({ name: z.string().min(2).max(160), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), shortDescription: z.string().min(10).max(500), description: z.string().min(20), longDescription: z.string().nullable().optional(), category: z.string().min(2), featured: z.boolean().default(false), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]), displayOrder: z.coerce.number().int().default(0), heroImage: z.url().nullable().optional().or(z.literal("")), heroImagePublicId: z.string().nullable().optional().or(z.literal("")), thumbnail: z.url().nullable().optional().or(z.literal("")), thumbnailPublicId: z.string().nullable().optional().or(z.literal("")), heroTitle: z.string().nullable().optional(), heroDescription: z.string().nullable().optional(), specHighlights: z.array(z.string()).default([]), technicalImage: z.url().nullable().optional().or(z.literal("")), technicalImagePublicId: z.string().nullable().optional().or(z.literal("")), technicalDescription: z.string().nullable().optional(), technicalEnabled: z.boolean().default(false),
  showGallery: z.boolean().default(true), showFeatures: z.boolean().default(true), showSpecifications: z.boolean().default(true), showConfigurations: z.boolean().default(true), showApplications: z.boolean().default(true), showStoredMaterials: z.boolean().default(true), showStories: z.boolean().default(true), showWorkflow: z.boolean().default(true), showBenefits: z.boolean().default(true), showComponents: z.boolean().default(true), showFaq: z.boolean().default(true), showRelated: z.boolean().default(true),
  metaTitle: z.string().max(70).nullable().optional(), metaDescription: z.string().max(180).nullable().optional(), keywords: z.string().nullable().optional(), focusKeyword: z.string().nullable().optional(), ogTitle: z.string().nullable().optional(), ogDescription: z.string().nullable().optional(), ogImage: z.url().nullable().optional().or(z.literal("")), canonicalUrl: z.string().nullable().optional(), robotsIndex: z.boolean().default(true),
  galleryHeading: z.string().max(160).nullable().optional(), featuresHeading: z.string().max(160).nullable().optional(), overviewHeading: z.string().max(160).nullable().optional(), overviewBody: z.string().max(4000).nullable().optional(), applicationsHeading: z.string().max(160).nullable().optional(), applicationsIntro: z.string().max(600).nullable().optional(),
  ctaTitle: z.string().max(160).nullable().optional(), ctaSubtitle: z.string().max(600).nullable().optional(),
  primaryCtaLabel: z.string().max(80).nullable().optional(), primaryCtaHref: z.string().max(300).nullable().optional(), secondaryCtaLabel: z.string().max(80).nullable().optional(), secondaryCtaHref: z.string().max(300).nullable().optional(),
  /**
   * The six-slot gallery. Slots are validated against the shared definition so
   * an unknown or duplicated slot is rejected here rather than silently dropped
   * by the database unique index, and a slot is only kept when it actually has
   * an image — an empty slot means "no photo for this view", not "no image".
   */
  gallery: z.array(z.object({ slot: z.enum(productGallerySlotKeys as [string, ...string[]]), imageUrl: z.url(), label: z.string().max(120).nullable().optional(), altText: z.string().min(2).max(240), caption: z.string().max(240).nullable().optional(), cloudinaryPublicId: z.string().max(300).nullable().optional(), width: z.coerce.number().int().positive().nullable().optional(), height: z.coerce.number().int().positive().nullable().optional() })).default([]).refine((items) => new Set(items.map((item) => item.slot)).size === items.length, { message: "Each gallery slot can only be used once." }),
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

/**
 * A homepage "What We Offer" card.
 *
 * A card points at an existing product; it does not duplicate one. `productId`
 * is the link for CMS products and `slug` covers the code-defined catalogue
 * products, so at least one of the two is required — a card that references
 * nothing would render as a blank tile on the homepage.
 *
 * `title`, `description`, `imageUrl` and `category` are all *overrides*. They
 * are optional by design: an empty value means "use the product's own", so
 * renaming a product or swapping its photo updates the homepage with no second
 * edit. A card with no overrides follows its product completely.
 *
 * `href` is constrained to a site-relative path on purpose. The card is a link
 * rendered on the homepage, and a CMS-authored `https://…` or `javascript:`
 * value would turn an editorial field into a way to send visitors off-site or
 * execute script, so the validator rejects it at the door rather than the
 * renderer sanitising it later.
 */
export const homeOfferCardSchema = z
  .object({
    productId: z.coerce.number().int().positive().nullable().optional(),
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).nullable().optional().or(z.literal("")),
    title: z.string().trim().max(160).nullable().optional(),
    description: z.string().trim().max(400).nullable().optional(),
    imageUrl: z.url().nullable().optional().or(z.literal("")),
    imagePublicId: z.string().trim().max(300).nullable().optional(),
    altText: z.string().trim().max(200).nullable().optional(),
    category: z.string().trim().max(80).nullable().optional(),
    href: z
      .string()
      .trim()
      .max(300)
      .refine((value) => value === "" || value.startsWith("/") || value.startsWith("#"), {
        message: "Use a site-relative link such as /products/my-product",
      })
      .nullable()
      .optional(),
    ctaLabel: z.string().trim().max(60).nullable().optional(),
    showQuoteButton: z.boolean().default(true),
    displayOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
  })
  .refine((value) => value.productId != null || Boolean(value.slug), {
    message: "Choose a product for this card",
    path: ["slug"],
  });
export type HomeOfferCardAdminInput = z.infer<typeof homeOfferCardSchema>;
