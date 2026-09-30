import { z } from "zod";
import { isValidPhone } from "./contact-format";
import { isStorableImageUrl } from "./public-asset-paths";

/**
 * An image field on a product.
 *
 * This accepts two things and rejects everything else:
 *
 *  - an absolute `https://` URL, which is what an upload to the media host
 *    returns, and
 *  - a site-relative path into `public/`, which is how the product photographs
 *    that already ship with the site are addressed — `/LOCKERS/abc.jpg`.
 *
 * The second form used to be rejected, which was the single reason the real
 * product photography could not be managed from the admin at all: the editor
 * could see the files on disk but every attempt to save one failed validation,
 * and the only way to get a product image into the CMS was to upload it again to
 * a CDN. A file that is already in the repository is stable, costs nothing to
 * serve and cannot expire, so it is a first-class way to point at an image.
 *
 * `javascript:` and protocol-relative values are excluded, and an empty value
 * is allowed on the optional fields so "no image" stays expressible.
 */
const productImageUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || isStorableImageUrl(value), {
    message: "Enter a full image URL or a path such as /products/racks/photo.jpg",
  });

/** The same rule for a field where an image is mandatory. */
const requiredProductImageUrl = z
  .string()
  .trim()
  .min(1, "Add an image")
  .refine((value) => isStorableImageUrl(value), {
    message: "Enter a full image URL or a path such as /products/racks/photo.jpg",
  });

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
export const productAdminSchema = z.object({ name: z.string().min(2).max(160), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), shortDescription: z.string().min(10).max(500), description: z.string().min(20), longDescription: z.string().nullable().optional(), category: z.string().min(2), featured: z.boolean().default(false), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]), displayOrder: z.coerce.number().int().default(0), heroImage: productImageUrl.nullable().optional().or(z.literal("")), heroImagePublicId: z.string().nullable().optional().or(z.literal("")), thumbnail: productImageUrl.nullable().optional().or(z.literal("")), thumbnailPublicId: z.string().nullable().optional().or(z.literal("")), heroTitle: z.string().nullable().optional(), heroDescription: z.string().nullable().optional(), specHighlights: z.array(z.string()).default([]), technicalImage: productImageUrl.nullable().optional().or(z.literal("")), technicalImagePublicId: z.string().nullable().optional().or(z.literal("")), technicalDescription: z.string().nullable().optional(), technicalEnabled: z.boolean().default(false),
  showGallery: z.boolean().default(true), showFeatures: z.boolean().default(true), showSpecifications: z.boolean().default(true), showConfigurations: z.boolean().default(true), showApplications: z.boolean().default(true), showStoredMaterials: z.boolean().default(true), showStories: z.boolean().default(true), showWorkflow: z.boolean().default(true), showBenefits: z.boolean().default(true), showComponents: z.boolean().default(true), showFaq: z.boolean().default(true), showRelated: z.boolean().default(true),
  metaTitle: z.string().max(70).nullable().optional(), metaDescription: z.string().max(180).nullable().optional(), keywords: z.string().nullable().optional(), focusKeyword: z.string().nullable().optional(), ogTitle: z.string().nullable().optional(), ogDescription: z.string().nullable().optional(), ogImage: productImageUrl.nullable().optional().or(z.literal("")), canonicalUrl: z.string().nullable().optional(), robotsIndex: z.boolean().default(true),
  galleryHeading: z.string().max(160).nullable().optional(), featuresHeading: z.string().max(160).nullable().optional(), overviewHeading: z.string().max(160).nullable().optional(), overviewBody: z.string().max(4000).nullable().optional(), applicationsHeading: z.string().max(160).nullable().optional(), applicationsIntro: z.string().max(600).nullable().optional(),
  ctaTitle: z.string().max(160).nullable().optional(), ctaSubtitle: z.string().max(600).nullable().optional(),
  primaryCtaLabel: z.string().max(80).nullable().optional(), primaryCtaHref: z.string().max(300).nullable().optional(), secondaryCtaLabel: z.string().max(80).nullable().optional(), secondaryCtaHref: z.string().max(300).nullable().optional(),
  /**
   * The product gallery, as a free ordered list.
   *
   * This used to be six named slots validated against a closed key set, with a
   * refinement rejecting a repeated slot. Both are gone: a product may have any
   * number of images, and the order is simply the order they appear in this
   * array. `slot` survives as optional legacy provenance so a row written by the
   * six-slot release still round-trips, but it no longer gates anything.
   *
   * `isActive` lets an editor hide an image without deleting it, so a parked
   * photo keeps its asset and its caption. `isPrimary` is the explicit choice
   * of which image leads the product: the first active row is used when no row
   * claims the flag, so a payload that predates the field still behaves.
   *
   * `imageUrl` may be a `public/` path, which is how the product photographs
   * that already ship with the site are stored. `cloudinaryPublicId` is only
   * ever set for a real upload, and the upload pruner skips any row without
   * one — a file in this repository must never be deleted because a row that
   * referenced it was removed from the CMS.
   */
  gallery: z.array(z.object({ slot: z.string().max(60).nullable().optional(), imageUrl: requiredProductImageUrl, label: z.string().max(120).nullable().optional(), altText: z.string().min(2).max(240), caption: z.string().max(240).nullable().optional(), cloudinaryPublicId: z.string().max(300).nullable().optional(), width: z.coerce.number().int().positive().nullable().optional(), height: z.coerce.number().int().positive().nullable().optional(), isActive: z.boolean().default(true), isPrimary: z.boolean().default(false) })).default([]).refine((items) => new Set(items.map((item) => item.imageUrl)).size === items.length, { message: "The same image cannot be added to a gallery twice." }),
  features: z.array(z.object({ title: z.string().min(1), description: z.string().min(1), icon: z.string().nullable().optional(), isActive: z.boolean().default(true) })).default([]),
  specifications: z.array(z.object({ specificationName: z.string().min(1), specificationValue: z.string().min(1) })).default([]),
  /**
   * A product application.
   *
   * The table's `application` column is the required one and `title` is a
   * nullable display label, so this accepts either. Validating `title` as the
   * required field made every product seeded with a bare application fail to
   * save: the API rejected its own stored data with a generic "check required
   * fields" error, which made those products impossible to edit at all until
   * the stray nulls were removed by hand.
   */
  applications: z.array(z.object({ application: z.string().min(1).optional(), title: z.string().min(1).nullable().optional(), description: z.string().nullable().optional(), image: z.string().nullable().optional(), imagePublicId: z.string().nullable().optional(), altText: z.string().nullable().optional(), isActive: z.boolean().default(true) }).refine((row) => Boolean((row.application ?? "").trim() || (row.title ?? "").trim()), { message: "Add an application name" })).default([]),
  images: z.array(z.object({ imageUrl: requiredProductImageUrl, altText: z.string().min(2), caption: z.string().nullable().optional() })).default([]),
  benefits: z.array(z.object({ title: z.string().min(1), description: z.string().min(1) })).default([]),
  components: z.array(z.object({ title: z.string().min(1), description: z.string().min(1), image: z.string().nullable().optional(), imagePublicId: z.string().nullable().optional(), altText: z.string().nullable().optional() })).default([]),
  configurations: z.array(z.object({ title: z.string().min(1), description: z.string().min(1), image: z.string().nullable().optional(), imagePublicId: z.string().nullable().optional(), altText: z.string().nullable().optional() })).default([]),
  storedMaterials: z.array(z.object({ title: z.string().min(1), description: z.string().min(1), image: z.string().nullable().optional(), imagePublicId: z.string().nullable().optional(), altText: z.string().nullable().optional() })).default([]),
  stories: z.array(z.object({ title: z.string().nullable().optional(), description: z.string().min(1), image: z.string().min(1), imagePublicId: z.string().nullable().optional(), altText: z.string().min(1).nullable().optional() })).default([]),
  workflows: z.array(z.object({ title: z.string().min(1), description: z.string().min(1) })).default([]),
  /**
   * Recommended systems, in editor order, with each row's own switch.
   *
   * `relatedProductIds` was a bare id list, which could only say "this product
   * is related". It could not say "this product is related but currently not
   * shown", so the `isActive` column on `productRelatedProducts` was never set
   * by the admin and never read by any query. Keeping the row and flipping the
   * flag is the difference between hiding a recommendation and deleting it: the
   * relationship, its place in the order, and the product's own wording all
   * survive, and re-enabling is one click.
   */
  relatedProducts: z.array(z.object({ productId: z.coerce.number().int().positive(), isActive: z.boolean().default(true) })).default([]),
  /**
   * Legacy related list, kept so an older client can still save a product.
   *
   * Saved as all-active `relatedProducts` rows, so an existing caller behaves
   * exactly as it did before rather than silently dropping its choices.
   */
  relatedProductIds: z.array(z.coerce.number().int().positive()).default([]),
  /**
   * Copy for the "Recommended systems" section, per product.
   *
   * All optional, and all defaulted at render time: an empty field means "use
   * the sensible default for this product's category", not "render an empty
   * heading". That is what lets a 40-product catalogue be correct without
   * anyone writing this out 40 times.
   */
  relatedHeading: z.string().nullable().optional(),
  relatedSubheading: z.string().nullable().optional(),
  relatedDescription: z.string().nullable().optional(),
  industryIds: z.array(z.coerce.number().int().positive()).default([]),
  projectIds: z.array(z.coerce.number().int().positive()).default([]),
  faqs: z.array(z.object({ question: z.string().min(3), answer: z.string().min(3) })).default([]),
  /**
   * Free-form content blocks, rendered after the structured sections.
   *
   * Everything above this list is a fixed, purpose-built section: a gallery, a
   * specification table, a benefits grid. Those are the right shape for the
   * things the business always needs, but they cannot express a one-off block —
   * an installation note, a compliance paragraph, a second call to action — so
   * those had nowhere to live and the only option was editing a fixed section
   * and hoping it still applied to every other product.
   *
   * A section is therefore an arbitrary number of ordered blocks with a heading,
   * a body, an optional image and a layout. `key` is a stable anchor derived
   * from the heading when the editor does not supply one, so a link to a section
   * survives a rename of the body copy. `isActive` parks a block without
   * deleting it. There is no upper limit, and the order is the order they appear
   * in this array.
   */
  sections: z
    .array(
      z.object({
        key: z.string().trim().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).nullable().optional(),
        eyebrow: z.string().trim().max(120).nullable().optional(),
        title: z.string().trim().min(1).max(200),
        body: z.string().trim().max(6000).nullable().optional(),
        layout: z.enum(["text", "image-left", "image-right", "image-top"]).default("text"),
        imageUrl: productImageUrl.nullable().optional().or(z.literal("")),
        imagePublicId: z.string().trim().max(300).nullable().optional(),
        altText: z.string().trim().max(240).nullable().optional(),
        ctaLabel: z.string().trim().max(80).nullable().optional(),
        ctaHref: z.string().trim().max(300).nullable().optional(),
        isActive: z.boolean().default(true),
      }),
    )
    .default([])
    .refine(
      (items) => new Set(items.map((item, index) => item.key || String(index))).size === items.length,
      { message: "Each content section needs its own key." },
    ),
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
