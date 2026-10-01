import { z } from "zod";
import { isValidPhone } from "./contact-format";
import { isStorableImageUrl } from "./public-asset-paths";
import { ABOUT_SECTION_KINDS } from "@/db/schema";

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
/**
 * A client logo's image, as the admin editor submits it.
 *
 * `z.url()` alone is wrong here. It rejects a site-relative `public/` path, and
 * every logo already on the site is stored exactly that way
 * (`/rack-and-stack-clients/<file>`) so the photograph never needs a CDN and
 * keeps rendering with the database switched off. The same rule the product
 * images use applies here, so an editor can upload through Cloudinary or point
 * at a file in the repository.
 */
const clientLogoImageUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((value) => value === "" || isStorableImageUrl(value), {
    message: "Enter a full image URL or a path such as /rack-and-stack-clients/logo.png",
  });

export const clientLogoAdminSchema = z.object({
  name: z.string().trim().min(2).max(160),
  imageUrl: clientLogoImageUrl,
  imagePublicId: z.string().trim().max(300).regex(/^[a-zA-Z0-9_\-/.]*$/).nullable().optional(),
  altText: z.string().trim().min(2).max(200),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  width: z.coerce.number().int().positive().nullable().optional(),
  height: z.coerce.number().int().positive().nullable().optional(),
});
export type ClientLogoAdminInput = z.infer<typeof clientLogoAdminSchema>;

/**
 * A client testimonial, as the admin editor submits it.
 *
 * This collection had no schema at all: every field went through a bare
 * `String(value).trim()` on the way to the database, so a testimonial could be
 * saved with a blank name, an empty quote, a rating of `-3` or `99`, and a
 * `javascript:` URL in the image field. The last one is the reason this exists —
 * `image` is rendered straight into the homepage carousel, so a crafted value
 * is a script injection into the front page. Everything below is bounded at the
 * door instead of being trusted because it came from a form.
 *
 * `content` has a real minimum because the card is built around the quote: a
 * three-word testimonial renders as a single line in the middle of a card sized
 * for a paragraph, which reads as a rendering fault rather than a short review.
 *
 * `rating` is a 1–5 integer. It is the input to the average shown in the
 * review summary, so an out-of-range value would not just draw the wrong number
 * of stars — it would shift the average for every other testimonial too. An
 * absent or empty rating means five, which is what the admin form's star picker
 * sends before an editor has touched it.
 */
const testimonialRating = z.preprocess(
  (value) => (value === undefined || value === null || value === "" ? 5 : value),
  z.coerce.number().int("Rating must be a whole number").min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
);
export const testimonialAdminSchema = z.object({
  clientName: z.string().trim().min(2, "Enter the client's name").max(120, "Name is too long"),
  company: z.string().trim().max(160, "Company name is too long").nullable().optional(),
  designation: z.string().trim().max(120, "Designation is too long").nullable().optional(),
  content: z.string().trim().min(20, "Enter the testimonial text (at least 20 characters)").max(1500, "Testimonial is too long"),
  rating: testimonialRating,
  image: z
    .string()
    .trim()
    .refine((value) => value === "" || isStorableImageUrl(value), {
      message: "Enter a full image URL or a path such as /assets/images/client.webp",
    })
    .nullable()
    .optional(),
  featured: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  displayOrder: z.coerce.number().int().default(0),
});
export type TestimonialAdminInput = z.infer<typeof testimonialAdminSchema>;

/**
 * Runs a schema and turns a failure into a message written for the editor.
 *
 * `.parse()` throws a `ZodError`, which the admin API deliberately does not
 * surface — it collapses anything that is not a `UserFacingError` into one
 * generic sentence, because a raw Zod error is a list of internal paths and
 * types rather than anything a person can act on. That is right for a
 * constraint violation, but it means an editor who typed a one-character client
 * name is told only that "required fields and unique values" need checking.
 *
 * So the first issue is re-thrown as a `UserFacingError` naming the field in
 * plain words. One issue is reported rather than all of them: the form shows a
 * single error line, and a list of nine would be truncated anyway.
 */
export function parseForEditor<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const field = issue?.path.join(".").replace(/([A-Z])/g, " $1").trim() ?? "";
  const label = field ? field.charAt(0).toUpperCase() + field.slice(1) : "This record";
  throw new UserFacingError(`${label}: ${issue?.message || "is not valid."}`);
}

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
    // Not `z.url()`. That accepts any absolute scheme, so a `blob:` URL pasted
    // into the field would be stored, published, and then fail to resolve for
    // every real visitor — the uploader itself never produces one, but a pasted
    // value survives the save and reports success. This is the same rule product
    // images use: a real remote URL, or a site-relative asset path.
    imageUrl: z
      .string()
      .trim()
      .refine((value) => value === "" || isStorableImageUrl(value), {
        message: "Enter a full image URL or a path such as /assets/images/card.webp",
      })
      .nullable()
      .optional(),
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

/**
 * One line of a capability list on the About page.
 *
 * `slug` points at a real product or category so the line links to something
 * genuine. It is optional because several lines — cable trays, for one — have no
 * page of their own, and a line with no page is still part of what the company
 * makes, so it is shown as plain text rather than dropped or linked to somewhere
 * unrelated.
 */
const aboutCapabilitySchema = z.object({
  label: z.string().trim().min(1, "Add a name").max(160),
  slug: z.string().trim().max(160).nullable().optional(),
});

/**
 * One section of the About page.
 *
 * The page-specific content lives in `body` rather than in a column per list,
 * because each band has a genuinely different shape. The individual lists are
 * validated here — including the images carried on each pillar — so a malformed
 * body is rejected at the edge rather than reaching a renderer that expects a
 * string and finds an object.
 */
export const aboutSectionSchema = z
  .object({
    sectionKey: z
      .string()
      .trim()
      .min(1, "Add a section key")
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens"),
    label: z.string().trim().min(1, "Add a name for this section").max(120),
    kind: z.enum(ABOUT_SECTION_KINDS),
    eyebrow: z.string().trim().max(160).nullable().optional(),
    title: z.string().trim().max(300).nullable().optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    caption: z.string().trim().max(200).nullable().optional(),
    imageUrl: z.url().nullable().optional().or(z.literal("")),
    imagePublicId: z.string().trim().max(300).nullable().optional(),
    imageAlt: z.string().trim().max(300).nullable().optional(),
    ctaPrimaryLabel: z.string().trim().max(80).nullable().optional(),
    ctaPrimaryHref: z
      .string()
      .trim()
      .max(300)
      .refine((value) => value === "" || value.startsWith("/") || value.startsWith("#"), {
        message: "Use a site-relative link such as /products",
      })
      .nullable()
      .optional(),
    ctaSecondaryLabel: z.string().trim().max(80).nullable().optional(),
    ctaSecondaryHref: z
      .string()
      .trim()
      .max(300)
      .refine((value) => value === "" || value.startsWith("/") || value.startsWith("#"), {
        message: "Use a site-relative link such as /contact",
      })
      .nullable()
      .optional(),
    theme: z.enum(["light", "surface", "dark", "bordered"]).default("light"),
    body: z
      .object({
        paragraphs: z.array(z.string().trim().max(4000)).default([]),
        listLabel: z.string().trim().max(200).nullable().optional(),
        items: z.array(aboutCapabilitySchema).default([]),
        steps: z
          .array(z.object({ title: z.string().trim().min(1, "Add a step title").max(200), detail: z.string().trim().max(2000) }))
          .default([]),
        strengths: z
          .array(z.object({ title: z.string().trim().min(1, "Add a title").max(200), detail: z.string().trim().max(2000) }))
          .default([]),
        pillars: z
          .array(
            z.object({
              label: z.string().trim().min(1, "Add a label").max(120),
              statement: z.string().trim().min(1, "Add the statement").max(2000),
              image: z.url().nullable().optional().or(z.literal("")),
              imagePublicId: z.string().trim().max(300).nullable().optional(),
              imageAlt: z.string().trim().max(300).nullable().optional(),
            }),
          )
          .default([]),
      })
      .default({ paragraphs: [], items: [], steps: [], strengths: [], pillars: [] }),
    isActive: z.boolean().default(true),
    displayOrder: z.coerce.number().int().default(0),
  })
  // A section is switched off, reordered or saved as a draft, and a band with no
  // heading is only a problem once it is actually on the page. Requiring the
  // title here would make it impossible to park a section without inventing copy.
  .refine((value) => !value.isActive || Boolean(value.title) || value.kind === "pillars", {
    message: "Add a heading, or switch the section off",
    path: ["title"],
  });
export type AboutSectionAdminInput = z.infer<typeof aboutSectionSchema>;

/* ------------------------------------------------------------------ *
 * Homepage sections
 * ------------------------------------------------------------------ */

/** A trimmed string, or `null` when it is blank. Mirrors the entity helpers. */
function nullable(value: unknown): string | null {
  return (typeof value === "string" ? value.trim() : "") || null;
}

/** Reads a `Record<string, unknown>` out of the untyped JSONB column. */
function dict(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/**
 * An image a homepage band may point at: a real remote URL or a `public/` path.
 *
 * Both forms are accepted for the same reason `productImageUrl` accepts both — a
 * file already in the repository is stable and free to serve, and rejecting it
 * meant the shipped About photography could not be managed from the admin at all.
 */
const homepageImageUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((value) => value === "" || isStorableImageUrl(value), {
    message: "Enter a full image URL or a path such as /assets/images/photo.webp",
  })
  .nullable()
  .optional();

/**
 * A link a homepage band renders into an `href`.
 *
 * Every CTA on the homepage is rendered straight into an `href` on a public page,
 * so a CMS-authored `javascript:` or `data:` value would be script injection into
 * the front page. Constrained to a site-relative path or an in-page anchor;
 * anything else is refused at the door rather than sanitised at render.
 */
const homepageLink = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || value.startsWith("/") || value.startsWith("#"), {
    message: "Use a site-relative link such as /products",
  })
  .nullable()
  .optional();

const homepageFeature = z.object({
  title: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(400).nullable().optional(),
  /**
   * Length-bounded but not checked against an icon list.
   *
   * The renderer maps an unrecognised name to a neutral check mark rather than
   * failing, and the nine bands do not share one icon vocabulary — the About
   * grid has its own picker while the service chips use a longer list. An
   * allowlist here would reject a name a band is already storing and already
   * rendering, turning a working row into an unsaveable one.
   */
  icon: z.string().trim().max(60).nullable().optional(),
});

const homepageGallerySlot = z.object({
  image: homepageImageUrl,
  imagePublicId: z.string().trim().max(300).nullable().optional(),
  alt: z.string().trim().max(300).nullable().optional(),
});

const homepageContentSchema = z
  .object({
    // Hero
    eyebrow: z.string().trim().max(160).nullable().optional(),
    badge: z.string().trim().max(160).nullable().optional(),
    highlight: z.string().trim().max(160).nullable().optional(),
    image: homepageImageUrl,
    /** The Cloudinary asset `image` came from; see the save route's pruner. */
    imagePublicId: z.string().trim().max(300).nullable().optional(),
    imageAlt: z.string().trim().max(300).nullable().optional(),
    primaryCta: z.string().trim().max(80).nullable().optional(),
    primaryCtaHref: homepageLink,
    secondaryCta: z.string().trim().max(80).nullable().optional(),
    secondaryCtaHref: homepageLink,
    tertiaryCta: z.string().trim().max(80).nullable().optional(),
    tertiaryCtaHref: homepageLink,
    // About
    label: z.string().trim().max(160).nullable().optional(),
    cta: z.string().trim().max(80).nullable().optional(),
    ctaHref: homepageLink,
    ctaLabel: z.string().trim().max(80).nullable().optional(),
    features: z.array(homepageFeature).max(24).default([]),
    gallery: z.array(homepageGallerySlot).max(12).default([]),
    // Services
    kicker: z.string().trim().max(200).nullable().optional(),
    items: z.array(homepageFeature).max(12).default([]),
    // Why
    cards: z.array(homepageFeature).max(12).default([]),
    stats: z
      .array(
        z.object({
          value: z.string().trim().max(80).nullable().optional(),
          suffix: z.string().trim().max(8).nullable().optional(),
          label: z.string().trim().max(80).nullable().optional(),
        }),
      )
      .max(12)
      .default([]),
    // Process
    steps: z
      .array(
        z.object({
          number: z.string().trim().max(8).nullable().optional(),
          title: z.string().trim().max(200).nullable().optional(),
          description: z.string().trim().max(400).nullable().optional(),
        }),
      )
      .max(12)
      .default([]),
    // Closing CTA
    background: homepageImageUrl,
    backgroundPublicId: z.string().trim().max(300).nullable().optional(),
  })
  /**
   * Unknown keys survive.
   *
   * `.loose()` has to come before `.default()`: `.default()` returns a wrapper
   * that exposes no object methods, so the reverse order does not compile. This
   * order also matters at runtime — stripping unknown keys would delete a band
   * field added by a newer release the first time an editor touched an older
   * section, which is a silent data loss with no error anywhere.
   */
  .loose()
  .default({
    features: [],
    gallery: [],
    items: [],
    cards: [],
    stats: [],
    steps: [],
  });

/**
 * One homepage band, as the admin submits it.
 *
 * The `content` column is JSONB and was previously written by
 * `typeof input.content === "object"` and nothing else, so nothing about it was
 * checked: an image URL could be any string at all, a CTA could be
 * `javascript:alert(1)`, a feature list could hold a thousand rows, and a
 * duplicate `sectionKey` failed as a bare unique-constraint violation the editor
 * could not act on.
 */
export const homepageSectionSchema = z.object({
  sectionKey: z
    .string()
    .trim()
    .min(1, "Add a section key")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens"),
  title: z.string().trim().max(300).nullable().optional(),
  subtitle: z.string().trim().max(4000).nullable().optional(),
  content: homepageContentSchema,
  enabled: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});
export type HomepageSectionInput = z.infer<typeof homepageSectionSchema>;

/**
 * Normalised column values for a homepage band, shared by create and update.
 *
 * A create and an update that disagree here is how a field ends up saved by one
 * screen and silently dropped by the other, so both go through this.
 */
export function homepageSectionValues(
  input: Record<string, unknown>,
  current?: { enabled?: boolean; content?: unknown },
) {
  const data = parseForEditor(homepageSectionSchema, input);

  // `content` is replaced wholesale rather than merged key by key. Every admin
  // screen for this entity sends the whole object, and a partial merge is where a
  // cleared field survives: the third hero button was removed in the form, absent
  // from the payload, and therefore never overwritten. A payload with no
  // `content` at all is a caller managing only the flags, and that one leaves the
  // stored copy alone.
  const content = input.content === undefined && current ? dict(current.content) : data.content;

  // `enabled` only falls back to the stored value when the payload genuinely
  // omits it. `data.enabled` cannot be used on its own: the schema defaults the
  // field to `true`, so a caller that sent only a copy edit would switch a hidden
  // band back on — and a `bool(undefined)` wrote `false`, which took a live band
  // off the published site without anybody touching the switch.
  const enabled =
    input.enabled === undefined && current ? (current.enabled ?? true) : data.enabled;

  return {
    sectionKey: data.sectionKey,
    title: nullable(data.title),
    subtitle: nullable(data.subtitle),
    content,
    enabled,
    displayOrder: data.displayOrder,
  };
}

