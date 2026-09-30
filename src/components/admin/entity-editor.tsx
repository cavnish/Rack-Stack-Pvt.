"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { VideoEditor } from "@/components/admin/video-editor";
import { ImageUpload, type UploadResult } from "@/components/admin/image-upload";
import { ProductGalleryEditor, type GalleryRow } from "@/components/admin/product-gallery-editor";
import { ContentSectionsEditor, type SectionRow } from "@/components/admin/content-sections-editor";
import { RepeatableList, type ListColumn, type Row } from "@/components/admin/repeatable-list";
import { HomepageAboutEditor, HomepageOffersEditor } from "@/components/admin/homepage-section-editor";
import { slugify } from "@/lib/utils";
import { catalogueCategoryNames, catalogueCategorySlugs } from "@/lib/catalogue";
import { RECOMMENDED_DESCRIPTION, RECOMMENDED_HEADING } from "@/lib/recommendations";

/**
 * The nine product-editor sections, in the order an editor works through a
 * product. Named once so the tab bar, the field groups and the conditional
 * panels cannot drift apart.
 */
const TAB_GENERAL = "GENERAL";
const TAB_IMAGES = "IMAGES";
const TAB_SPECIFICATIONS = "SPECIFICATIONS";
const TAB_FEATURES = "FEATURES";
const TAB_APPLICATIONS = "WHERE IT'S USED";
const TAB_SECTIONS = "CONTENT SECTIONS";
const TAB_RELATED = "RELATED STORAGE SYSTEMS";
const TAB_SEO = "SEO";
const TAB_PUBLISH = "PUBLISH";

type Data = Record<string, unknown>;
type RelationOptions = {
  products: Array<{ id: number; name: string }>;
  industries: Array<{ id: number; name: string }>;
  projects: Array<{ id: number; title: string }>;
  services?: Array<{ id: number; name: string }>;
};
type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "url" | "number" | "checkbox" | "select" | "json" | "lines" | "date" | "password";
  required?: boolean;
  /**
   * Choices for a `select`.
   *
   * A bare string is both the stored value and the visible label. The object
   * form exists for values that must be a slug but should be read as something
   * else — a product's category is stored as `office-storage` and shown as
   * "Office Storage Systems", because the slug is what the URL and the menu are
   * built from and the label is what a person has to recognise.
   */
  options?: (string | { value: string; label: string })[];
  help?: string;
  folder?: string;
  publicIdKey?: string;
  widthKey?: string;
  heightKey?: string;
};
const STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const configs: Record<string, Field[]> = {
  // Services uses a dedicated ServiceEditor below — keep a minimal flat config
  // only for the list / table display labels; full editing goes through ServiceEditor.
  services: [
    { key: "name", label: "Service name", required: true },
    { key: "slug", label: "Slug", required: true },
    { key: "status", label: "Publishing status", type: "select", options: STATUS_OPTIONS },
    { key: "displayOrder", label: "Display order", type: "number" },
  ],
  projects: [
    { key: "title", label: "Project title", required: true },
    { key: "slug", label: "Slug", required: true },
    { key: "clientName", label: "Client name" },
    { key: "location", label: "Location" },
    { key: "industry", label: "Industry" },
    { key: "solution", label: "Solution" },
    { key: "description", label: "Summary", type: "textarea", required: true },
    { key: "challenge", label: "Challenge", type: "textarea" },
    { key: "solutionDescription", label: "Solution detail", type: "textarea" },
    { key: "execution", label: "Execution", type: "textarea" },
    { key: "result", label: "Result (verified only)", type: "textarea" },
    { key: "coverImage", label: "Cover image URL", type: "url", folder: "projects" },
    { key: "projectDate", label: "Project date", type: "date" },
    { key: "featured", label: "Featured", type: "checkbox" },
    { key: "status", label: "Publishing status", type: "select", options: STATUS_OPTIONS },
    { key: "metaTitle", label: "SEO title" },
    { key: "metaDescription", label: "SEO description", type: "textarea" },
  ],
  clients: [
    { key: "name", label: "Client name", required: true },
    { key: "logo", label: "Logo URL", type: "url", folder: "clients", publicIdKey: "cloudinaryPublicId" },
    { key: "website", label: "Website", type: "url" },
    { key: "industry", label: "Industry" },
    { key: "featured", label: "Featured", type: "checkbox" },
    { key: "displayOrder", label: "Display order", type: "number" },
  ],
  "client-logos": [
    { key: "name", label: "Client name", required: true },
    {
      key: "imageUrl",
      label: "Client logo",
      type: "url",
      required: true,
      folder: "client-logos",
      publicIdKey: "imagePublicId",
      widthKey: "width",
      heightKey: "height",
      help: "Upload a clean transparent logo (PNG/WebP/AVIF). Stored in rack-stack/client-logos.",
    },
    { key: "altText", label: "Alt text", required: true, help: "Describe the logo for accessibility and SEO." },
    { key: "sortOrder", label: "Sort order", type: "number" },
    { key: "isActive", label: "Show on homepage marquee", type: "checkbox" },
  ],
  testimonials: [
    { key: "clientName", label: "Client name", required: true },
    { key: "company", label: "Company" },
    { key: "designation", label: "Designation" },
    { key: "content", label: "Verified testimonial", type: "textarea", required: true },
    { key: "rating", label: "Rating", type: "number" },
    { key: "image", label: "Image URL", type: "url", folder: "testimonials" },
    { key: "featured", label: "Featured", type: "checkbox" },
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
    { key: "displayOrder", label: "Display order", type: "number" },
  ],
  gallery: [
    { key: "title", label: "Title", required: true },
    { key: "category", label: "Category", required: true },
    { key: "imageUrl", label: "Image URL", type: "url", required: true, folder: "gallery", publicIdKey: "cloudinaryPublicId" },
    { key: "altText", label: "Alternative text", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "displayOrder", label: "Display order", type: "number" },
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  ],
  pages: [
    { key: "title", label: "Page title", required: true },
    { key: "slug", label: "Slug", required: true },
    { key: "heroTitle", label: "Hero title" },
    { key: "heroDescription", label: "Hero description", type: "textarea" },
    { key: "heroImage", label: "Hero image URL", type: "url", folder: "pages" },
    { key: "content", label: "Page content", type: "textarea", required: true },
    { key: "metaTitle", label: "SEO title" },
    { key: "metaDescription", label: "SEO description", type: "textarea" },
    { key: "canonicalUrl", label: "Canonical URL" },
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  ],
  industries: [
    { key: "name", label: "Industry name", required: true },
    { key: "slug", label: "Slug", required: true },
    { key: "shortDescription", label: "Short description", type: "textarea", required: true },
    { key: "description", label: "Full description", type: "textarea", required: true },
    { key: "challenges", label: "Challenges (one per line)", type: "lines" },
    { key: "benefits", label: "Benefits (one per line)", type: "lines" },
    { key: "heroImage", label: "Hero image URL", type: "url", folder: "industries" },
    { key: "icon", label: "Lucide icon name" },
    { key: "featured", label: "Featured", type: "checkbox" },
    { key: "displayOrder", label: "Display order", type: "number" },
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
    { key: "metaTitle", label: "SEO title" },
    { key: "metaDescription", label: "SEO description", type: "textarea" },
  ],
  faqs: [
    { key: "question", label: "Question", required: true },
    { key: "answer", label: "Answer", type: "textarea", required: true },
    { key: "entityType", label: "Assignment", type: "select", options: ["GLOBAL", "PRODUCT", "SERVICE", "INDUSTRY"] },
    { key: "entityId", label: "Related entity ID", type: "number", help: "Leave empty for Global." },
    { key: "displayOrder", label: "Display order", type: "number" },
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  ],
  blog: [
    { key: "title", label: "Article title", required: true },
    { key: "slug", label: "Slug", required: true },
    { key: "excerpt", label: "Excerpt", type: "textarea", required: true },
    { key: "content", label: "Article content", type: "textarea", required: true },
    { key: "featuredImage", label: "Featured image URL", type: "url", folder: "blog" },
    { key: "featured", label: "Featured", type: "checkbox" },
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
    { key: "metaTitle", label: "SEO title" },
    { key: "metaDescription", label: "SEO description", type: "textarea" },
    { key: "keywords", label: "Keywords" },
    { key: "canonicalUrl", label: "Canonical URL" },
  ],
  homepage: [
    { key: "sectionKey", label: "Section key", required: true },
    { key: "title", label: "Heading" },
    { key: "subtitle", label: "Description", type: "textarea" },
    { key: "content", label: "Section configuration (JSON)", type: "json", required: true, help: "Controls CTA labels, image, cards, metrics or steps for this section." },
    { key: "enabled", label: "Visible on homepage", type: "checkbox" },
    { key: "displayOrder", label: "Display order", type: "number" },
  ],
  "home-slider": [
    { key: "eyebrow", label: "Eyebrow label" },
    { key: "title", label: "Slide title" },
    { key: "highlightedText", label: "Highlighted text" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "imageUrl", label: "Desktop image URL", type: "url", folder: "home-sliders", publicIdKey: "imagePublicId" },
    { key: "mobileImageUrl", label: "Mobile image URL", type: "url", folder: "home-sliders", publicIdKey: "mobileImagePublicId" },
    { key: "videoUrl", label: "Background video URL", type: "url", help: "Optional. If set, an MP4 plays behind the slide instead of the desktop image. Use the poster image for fallback." },
    { key: "imageAlt", label: "Image alt text" },
    { key: "primaryButtonText", label: "Primary button label" },
    { key: "primaryButtonUrl", label: "Primary button URL" },
    { key: "secondaryButtonText", label: "Secondary button label" },
    { key: "secondaryButtonUrl", label: "Secondary button URL" },
    { key: "tertiaryButtonText", label: "Tertiary button label", help: "Optional third CTA (e.g. Talk to Us). Hidden if empty." },
    { key: "tertiaryButtonUrl", label: "Tertiary button URL" },
    { key: "trustPoints", label: "Trust points (one per line)", type: "lines", help: "Short value points shown under the buttons, e.g. Site-based planning." },
    { key: "textAlignment", label: "Text alignment", type: "select", options: ["left", "center", "right"] },
    { key: "overlayOpacity", label: "Overlay opacity (0-100)", type: "number" },
    { key: "autoplay", label: "Autoplay", type: "checkbox" },
    { key: "duration", label: "Slide duration (ms)", type: "number" },
    { key: "startAt", label: "Show from", type: "date" },
    { key: "endAt", label: "Show until", type: "date" },
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
    { key: "sortOrder", label: "Sort order", type: "number" },
  ],
  "home-offer-cards": [
    { key: "productId", label: "Product ID", type: "number", help: "Optional. Links this card to a CMS product so it follows that product's edits. Leave empty for a catalogue product and set the slug below." },
    { key: "slug", label: "Product slug", help: "The product this card shows. Required unless a Product ID is set." },
    { key: "title", label: "Title override", help: "Optional. Leave empty to use the product's own name." },
    { key: "description", label: "Description override", type: "textarea", help: "Optional. Leave empty to use the product's own description." },
    { key: "imageUrl", label: "Image override", type: "url", folder: "home-offer-cards", publicIdKey: "imagePublicId", help: "Optional. Leave empty to use the product's own image." },
    { key: "altText", label: "Image alt text", help: "Optional. Defaults to the product name." },
    { key: "category", label: "Badge override", help: "Optional. Leave empty to use the product's category." },
    { key: "ctaLabel", label: "Quote button label", help: "Optional. Defaults to Get a Quote." },
    { key: "showQuoteButton", label: "Show Get a Quote button", type: "checkbox" },
    { key: "displayOrder", label: "Display order", type: "number" },
    { key: "isActive", label: "Show on homepage", type: "checkbox" },
  ],
  inquiries: [
    { key: "status", label: "Inquiry status", type: "select", options: ["NEW", "CONTACTED", "QUALIFIED", "QUOTATION_SENT", "WON", "LOST", "SPAM"] },
    { key: "notes", label: "Internal notes", type: "textarea" },
    { key: "assignedTo", label: "Assigned user ID", type: "number" },
  ],
  "contact-messages": [{ key: "status", label: "Message status", type: "select", options: ["NEW", "READ", "REPLIED", "ARCHIVED", "SPAM"] }],
  seo: [
    { key: "siteTitle", label: "Site title", required: true },
    { key: "defaultMetaDescription", label: "Default meta description", type: "textarea", required: true },
    { key: "keywords", label: "Default keywords" },
    { key: "ogImage", label: "Open Graph image URL", type: "url", folder: "branding" },
    { key: "twitterImage", label: "Twitter image URL", type: "url", folder: "branding" },
    { key: "robotsSettings", label: "Robots settings" },
    { key: "googleVerification", label: "Google verification token" },
    { key: "canonicalBaseUrl", label: "Canonical base URL", type: "url" },
    { key: "organizationSchema", label: "Organization schema (JSON)", type: "json" },
    { key: "socialLinks", label: "Social links (JSON)", type: "json" },
  ],
  settings: [
    { key: "companyName", label: "Company name", required: true },
    { key: "logo", label: "Logo URL", type: "url", folder: "branding" },
    { key: "favicon", label: "Favicon URL", type: "url", folder: "branding" },
    { key: "primaryPhone", label: "Primary phone", required: true },
    { key: "secondaryPhone", label: "Secondary phone" },
    { key: "whatsapp", label: "WhatsApp", required: true },
    { key: "email", label: "Email", required: true },
    { key: "address", label: "Address", type: "textarea", required: true },
    { key: "workingHours", label: "Working hours", required: true },
    { key: "footerContent", label: "Footer description", type: "textarea" },
    { key: "copyright", label: "Copyright text" },
    { key: "googleMapsEmbed", label: "Google Maps embed URL", type: "url" },
    { key: "brochureUrl", label: "Catalog PDF URL", type: "url", help: "Upload the PDF to Cloudinary or another approved HTTPS asset host." },
    { key: "catalogTitle", label: "Catalog title" },
    { key: "catalogDescription", label: "Catalog description", type: "textarea" },
    { key: "catalogLeadGated", label: "Require contact details before download", type: "checkbox" },
  ],
  users: [
    { key: "name", label: "Name", required: true },
    { key: "email", label: "Email", required: true },
    { key: "password", label: "Password / reset password", type: "password", help: "Minimum 12 characters. Leave blank while editing to keep unchanged." },
    { key: "role", label: "Role", type: "select", options: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
    { key: "isActive", label: "Active", type: "checkbox" },
  ],
};

function FieldInput({
  field,
  value,
  onChange,
  onMeta,
  onUploadBusy,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  onMeta?: (values: Record<string, unknown>) => void;
  onUploadBusy?: (busy: boolean) => void;
}) {
  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        <span className="text-sm font-semibold text-zinc-900">{field.label}</span>
      </label>
    );
  }
  const stringValue =
    field.type === "json"
      ? typeof value === "string"
        ? value
        : JSON.stringify(value ?? {}, null, 2)
      : field.type === "lines"
        ? Array.isArray(value)
          ? value.join("\n")
          : String(value ?? "")
        : field.type === "date" && value
          ? String(value).slice(0, 10)
          : String(value ?? "");
  const isImageField = field.type === "url" || /(imageurl|thumbnail|coverimage|featuredimage)/i.test(field.key);
  return (
    <div className={field.type === "textarea" || field.type === "json" || field.type === "lines" ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">
        {field.label}
        {field.required ? " *" : ""}
      </label>
      {field.type === "select" ? (
        <select className="admin-field" value={stringValue} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((option) => {
            const value = typeof option === "string" ? option : option.value;
            const label = typeof option === "string" ? option : option.label;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
      ) : field.type === "textarea" || field.type === "json" || field.type === "lines" ? (
        <textarea
          className={`admin-field resize-y ${field.type === "json" ? "min-h-52 font-mono text-xs" : "min-h-28"}`}
          value={stringValue}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="admin-field"
          value={stringValue}
          required={field.required}
          type={field.type === "password" ? "password" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
        />
      )}
      {isImageField ? (
        <div className="mt-2">
          <ImageUpload
            value={stringValue || undefined}
            folder={field.folder}
            onBusyChange={onUploadBusy}
            onUploaded={(result) => {
              onChange(result.imageUrl);
              if (!onMeta) return;
              const meta: Record<string, unknown> = {};
              if (field.publicIdKey) meta[field.publicIdKey] = result.cloudinaryPublicId ?? null;
              if (field.widthKey) meta[field.widthKey] = result.width ?? null;
              if (field.heightKey) meta[field.heightKey] = result.height ?? null;
              if (Object.keys(meta).length) onMeta(meta);
            }}
          />
        </div>
      ) : null}
      {field.help ? <p className="mt-1 text-[.65rem] text-zinc-500">{field.help}</p> : null}
    </div>
  );
}

function ProductEditor({
  initial,
  onSave,
  onPublish,
  saving,
  publishing,
  uploading,
  error,
  options,
  onUploadBusy,
}: {
  initial: Data;
  onSave: (d: Data) => void;
  onPublish: (d: Data) => void;
  saving: boolean;
  publishing: boolean;
  uploading: boolean;
  error: string;
  options: RelationOptions;
  onUploadBusy: (busy: boolean) => void;
}) {
  /**
   * Nine sections, in the order an editor actually works through a product.
   *
   * This used to be twenty-one tabs, one per visual region of the page, which
   * made the editor feel like a spreadsheet of the layout rather than a
   * description of a product. The page itself did not change: every field below
   * still writes the same column, and the lists that lost their own tab (benefits,
   * components, configurations, storage, story, workflow, FAQs) are still
   * published and still render — they are just edited in one place now instead
   * of eight.
   */
  const [tab, setTab] = useState(TAB_GENERAL);
  const [data, setData] = useState<Data>({
    ...initial,
    status: initial.status || "DRAFT",
    featured: Boolean(initial.featured),
    displayOrder: initial.displayOrder || 0,
    specHighlights: Array.isArray(initial.specHighlights)
      ? (initial.specHighlights as string[]).join("\n")
      : String(initial.specHighlights ?? ""),
    features: initial.features || [],
    specifications: initial.specifications || [],
    applications: initial.applications || [],
    images: initial.images || [],
    gallery: (initial.gallery as GalleryRow[] | undefined) || [],
    sections: (initial.sections as SectionRow[] | undefined) || [],
    benefits: initial.benefits || [],
    components: initial.components || [],
    configurations: initial.configurations || [],
    storedMaterials: initial.storedMaterials || [],
    stories: initial.stories || [],
    workflows: initial.workflows || [],
    faqs: initial.faqs || [],
    relatedProducts: initial.relatedProducts || ((initial.relatedProductIds as number[] | undefined) || []).map((productId) => ({ productId, isActive: true })),
    relatedHeading: initial.relatedHeading ?? "",
    relatedSubheading: initial.relatedSubheading ?? "",
    relatedDescription: initial.relatedDescription ?? "",
    industryIds: initial.industryIds || [],
    projectIds: initial.projectIds || [],
    robotsIndex: initial.robotsIndex ?? true,
    technicalEnabled: Boolean(initial.technicalEnabled),
    showGallery: initial.showGallery ?? true,
    showFeatures: initial.showFeatures ?? true,
    showSpecifications: initial.showSpecifications ?? true,
    showConfigurations: initial.showConfigurations ?? true,
    showApplications: initial.showApplications ?? true,
    showStoredMaterials: initial.showStoredMaterials ?? true,
    showStories: initial.showStories ?? true,
    showWorkflow: initial.showWorkflow ?? true,
    showBenefits: initial.showBenefits ?? true,
    showComponents: initial.showComponents ?? true,
    showFaq: initial.showFaq ?? true,
    showRelated: initial.showRelated ?? true,
  });

  const tabs = [
    TAB_GENERAL,
    TAB_IMAGES,
    TAB_SPECIFICATIONS,
    TAB_FEATURES,
    TAB_APPLICATIONS,
    TAB_SECTIONS,
    TAB_RELATED,
    TAB_SEO,
    TAB_PUBLISH,
  ];

  const productSlug = String(data.slug || "");

  function set(key: string, value: unknown) {
    setData((d) => ({ ...d, [key]: value }));
  }
  function setMeta(values: Record<string, unknown>) {
    setData((d) => ({ ...d, ...values }));
  }
  function toggleRelation(key: string, id: number) {
    const current = (data[key] as number[]) || [];
    set(key, current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  /** Scalar fields, grouped per section. */
  const groups: Record<string, Field[]> = {
    [TAB_GENERAL]: [
      { key: "name", label: "Product name", required: true },
      { key: "slug", label: "Slug", required: true, help: "The public URL. Changing it changes the page address." },
      {
        key: "category",
        label: "Category",
        type: "select",
        // The stored value is the category slug, because that is what the URL,
        // the mega menu and the category pages are built from. Any category
        // currently in use is offered, so one created in Admin stays selectable.
        options: [
          ...new Set([
            ...catalogueCategorySlugs,
            // A category filed under in Admin stays selectable even if it has
            // no registered name yet, so saving the record cannot silently
            // rewrite an editor's choice to the first option in the list.
            ...(typeof data.category === "string" && data.category ? [data.category] : []),
          ]),
        ].map((slug) => ({ value: slug, label: catalogueCategoryNames[slug] ?? slug })),
        help: "Decides the product's address and which shelf it appears under in the menu and catalogue.",
      },
      { key: "shortDescription", label: "Short description", type: "textarea", required: true, help: "One or two sentences. Used on cards and in search results." },
      { key: "description", label: "Full description", type: "textarea", required: true },
      { key: "longDescription", label: "Extended description", type: "textarea", help: "Optional longer copy shown under the gallery." },
      {
        key: "heroImage",
        label: "Primary image",
        type: "url",
        folder: "products",
        publicIdKey: "heroImagePublicId",
        help: "This follows whichever gallery image is set as primary. Change it from Images to keep the card, the hero and the social share image in agreement.",
      },
    ],
    [TAB_IMAGES]: [{ key: "galleryHeading", label: "Gallery heading", help: "Heading shown above the gallery." }],
    [TAB_FEATURES]: [{ key: "featuresHeading", label: "Features heading", help: "Heading shown above the feature list." }],
    [TAB_APPLICATIONS]: [
      { key: "applicationsHeading", label: "Section heading", help: "For example: Where It's Used" },
      { key: "applicationsIntro", label: "Section description", type: "textarea" },
    ],
    [TAB_SEO]: [
      { key: "metaTitle", label: "SEO title", help: "Shown as the page title in search results." },
      { key: "metaDescription", label: "SEO description", type: "textarea", help: "Shown as the snippet in search results." },
      { key: "ogImage", label: "Share image URL", type: "url", folder: "products", publicIdKey: "ogImagePublicId" },
      { key: "canonicalUrl", label: "Canonical URL", help: "Leave empty unless the same page lives at another address." },
    ],
    [TAB_PUBLISH]: [
      { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
      { key: "featured", label: "Featured product", type: "checkbox" },
      { key: "displayOrder", label: "Display order", type: "number", help: "Lower numbers appear first." },
      { key: "robotsIndex", label: "Allow search engines to index", type: "checkbox" },
    ],
  };

  /**
   * Page-chrome fields that are no longer worth a tab but are still rendered by
   * the public page, so they are still editable. Collapsed by default: they are
   * real settings, but they are not what makes a product good, and burying them
   * is the entire point of the simplification.
   */
  const advancedGroups: Record<string, Field[]> = {
    [TAB_GENERAL]: [
      { key: "heroTitle", label: "Positioning statement", help: "A short premium line shown above the product name." },
      { key: "heroDescription", label: "Hero description" },
      { key: "specHighlights", label: "Specification highlights (one per line)", type: "lines", help: "Short hero chips such as load capacity or finish." },
      { key: "overviewHeading", label: "Overview heading" },
      { key: "overviewBody", label: "Overview paragraph", type: "textarea" },
      { key: "ctaTitle", label: "Closing CTA heading", help: "The closing band is hidden when this is empty." },
      { key: "ctaSubtitle", label: "Closing CTA description", type: "textarea" },
      { key: "primaryCtaLabel", label: "Primary button label" },
      { key: "primaryCtaHref", label: "Primary button link" },
      { key: "secondaryCtaLabel", label: "Secondary button label" },
      { key: "secondaryCtaHref", label: "Secondary button link" },
    ],
    [TAB_IMAGES]: [
      { key: "thumbnail", label: "Thumbnail URL", type: "url", folder: "products", publicIdKey: "thumbnailPublicId" },
      { key: "technicalEnabled", label: "Show technical image block", type: "checkbox" },
      { key: "technicalImage", label: "Technical / dimension image URL", type: "url", folder: "products", publicIdKey: "technicalImagePublicId" },
      { key: "technicalDescription", label: "Technical caption", type: "textarea" },
    ],
    [TAB_RELATED]: [],
    [TAB_SEO]: [
      { key: "ogTitle", label: "Open Graph title" },
      { key: "ogDescription", label: "Open Graph description", type: "textarea" },
      { key: "keywords", label: "Keywords", type: "lines" },
      { key: "focusKeyword", label: "Focus keyword" },
    ],
  };

  /**
   * The per-region lists that no longer get a tab. They are still published and
   * still render on the public page, so dropping them from the editor entirely
   * would have meant freezing real content; they are edited together under
   * Content Sections instead of one tab each.
   */
  const legacyLists: Array<{ key: string; label: string; columns: ListColumn[]; supportsImage?: boolean }> = [
    {
      key: "benefits",
      label: "Benefits",
      columns: [
        { key: "title", label: "Title" },
        { key: "description", label: "Description", type: "textarea", wide: true },
      ],
    },
    {
      key: "configurations",
      label: "Configurations",
      columns: [
        { key: "title", label: "Title" },
        { key: "description", label: "Description", type: "textarea", wide: true },
        { key: "image", label: "Image", type: "image" },
        { key: "altText", label: "Alt text" },
      ],
      supportsImage: true,
    },
    {
      key: "components",
      label: "Components",
      columns: [
        { key: "title", label: "Title" },
        { key: "description", label: "Description", type: "textarea", wide: true },
        { key: "image", label: "Image", type: "image" },
        { key: "altText", label: "Alt text" },
      ],
      supportsImage: true,
    },
    {
      key: "storedMaterials",
      label: "What can be stored",
      columns: [
        { key: "title", label: "Material" },
        { key: "description", label: "Description", type: "textarea", wide: true },
        { key: "image", label: "Image", type: "image" },
        { key: "altText", label: "Alt text" },
      ],
      supportsImage: true,
    },
    {
      key: "stories",
      label: "In-operation story",
      columns: [
        { key: "title", label: "Caption" },
        { key: "description", label: "Description", type: "textarea", wide: true },
        { key: "image", label: "Image", type: "image" },
        { key: "altText", label: "Alt text" },
      ],
      supportsImage: true,
    },
    {
      key: "workflows",
      label: "Installation workflow",
      columns: [
        { key: "title", label: "Step" },
        { key: "description", label: "Description", type: "textarea", wide: true },
      ],
    },
    {
      key: "faqs",
      label: "FAQs",
      columns: [
        { key: "question", label: "Question" },
        { key: "answer", label: "Answer", type: "textarea", wide: true },
      ],
    },
  ];

  /** Page regions that can be switched off. Still honoured by the renderer. */
  const regionToggles: Array<[string, string]> = [
    ["showGallery", "Gallery"],
    ["showFeatures", "Features"],
    ["showSpecifications", "Specifications"],
    ["showApplications", "Where it's used"],
    ["showConfigurations", "Configurations"],
    ["showComponents", "Components"],
    ["showBenefits", "Benefits"],
    ["showStoredMaterials", "What can be stored"],
    ["showStories", "In-operation story"],
    ["showWorkflow", "Installation workflow"],
    ["showFaq", "FAQs"],
    ["showRelated", "Related systems"],
  ];

  const relationGroups = [
    { key: "industryIds", label: "Industries", rows: options.industries },
    { key: "projectIds", label: "Projects", rows: options.projects.map((item) => ({ id: item.id, name: item.title })) },
  ];

  const busy = saving || publishing || uploading;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload: Data = { ...data };
    if (typeof payload.specHighlights === "string") {
      payload.specHighlights = (payload.specHighlights as string)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    }
    onSave(payload);
  }

  function saveDraft(event: React.FormEvent) {
    event.preventDefault();
    const payload: Data = { ...data, status: "DRAFT" };
    if (typeof payload.specHighlights === "string") {
      payload.specHighlights = (payload.specHighlights as string)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    }
    onSave(payload);
  }

  function publishNow(event: React.FormEvent) {
    event.preventDefault();
    const payload: Data = { ...data, status: "PUBLISHED" };
    if (typeof payload.specHighlights === "string") {
      payload.specHighlights = (payload.specHighlights as string)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    }
    onPublish(payload);
  }

  const activeGroup = groups[tab] ?? [];
  const activeAdvanced = advancedGroups[tab] ?? [];

  return (
    <form onSubmit={submit}>
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-zinc-200 px-5 pt-3">
        {tabs.map((item) => (
          <button
            type="button"
            onClick={() => setTab(item)}
            key={item}
            className={`shrink-0 border-b-2 px-4 py-3 text-[.7rem] font-bold tracking-wide ${
              tab === item ? "border-red-600 text-red-600" : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-7">
        {tab === TAB_IMAGES ? (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {activeGroup.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={data[field.key]}
                  onChange={(v) => set(field.key, v)}
                  onMeta={setMeta}
                  onUploadBusy={onUploadBusy}
                />
              ))}
            </div>
            <ProductGalleryEditor
              gallery={(data.gallery as GalleryRow[]) || []}
              productName={String(data.name || "Product")}
              productSlug={productSlug}
              onUploadBusy={onUploadBusy}
              onChange={(rows) => set("gallery", rows)}
            />
          </div>
        ) : null}

        {tab === TAB_SPECIFICATIONS ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900">Specifications at a Glance</h3>
            <RepeatableList
              columns={[
                { key: "specificationName", label: "Label", required: true, placeholder: "System type" },
                { key: "specificationValue", label: "Value", required: true, wide: true, placeholder: "Standard shelving mounted on a mobile base" },
              ]}
              rows={(data.specifications as Row[]) || []}
              onChange={(rows) => set("specifications", rows)}
              addLabel="Add specification"
              emptyLabel="No specifications yet."
              help="Rows save in the order shown."
            />
          </div>
        ) : null}

        {tab === TAB_FEATURES ? (
          <div className="space-y-4">
            <div className="grid gap-5 sm:grid-cols-2">
              {activeGroup.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={data[field.key]}
                  onChange={(v) => set(field.key, v)}
                  onMeta={setMeta}
                  onUploadBusy={onUploadBusy}
                />
              ))}
            </div>
            <RepeatableList
              columns={[
                { key: "icon", label: "Icon", type: "icon", placeholder: "CheckCircle2" },
                { key: "title", label: "Title", required: true, wide: true },
                { key: "description", label: "Description", type: "textarea", wide: true },
              ]}
              rows={(data.features as Row[]) || []}
              onChange={(rows) => set("features", rows)}
              addLabel="Add feature"
              emptyLabel="No features yet."
              supportsActive
            />
          </div>
        ) : null}

        {tab === TAB_APPLICATIONS ? (
          <div className="space-y-4">
            <div className="grid gap-5 sm:grid-cols-2">
              {activeGroup.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={data[field.key]}
                  onChange={(v) => set(field.key, v)}
                  onMeta={setMeta}
                  onUploadBusy={onUploadBusy}
                />
              ))}
            </div>
            <p className="text-[.7rem] leading-5 text-zinc-600">
              Every card carries its own photograph. Pick a different image per row — an application with no
              image of its own is the one thing this section must not produce.
            </p>
            <RepeatableList
              columns={[
                { key: "title", label: "Title", required: true, placeholder: "Record storage" },
                { key: "description", label: "Description", type: "textarea", wide: true },
                { key: "image", label: "Image", type: "image" },
                { key: "altText", label: "Image alt text" },
              ]}
              rows={(data.applications as Row[]) || []}
              onChange={(rows) => set("applications", rows)}
              addLabel="Add application"
              emptyLabel="No applications yet."
              supportsActive
              supportsImage
              productSlug={productSlug}
            />
          </div>
        ) : null}

        {tab === TAB_SECTIONS ? (
          <div className="space-y-6">
            <ContentSectionsEditor
              sections={(data.sections as SectionRow[]) || []}
              onChange={(rows) => set("sections", rows)}
              productSlug={productSlug}
            />
            <Disclosure summary="Page sections kept from the old editor" defaultOpen={false}>
              <p className="mb-4 text-[.7rem] leading-5 text-zinc-600">
                These still render on the product page exactly as before. They no longer have a tab of their
                own, so they are edited together here.
              </p>
              <div className="space-y-6">
                {legacyLists.map((list) => (
                  <div key={list.key}>
                    <h4 className="mb-2 text-xs font-bold text-zinc-900">{list.label}</h4>
                    <RepeatableList
                      columns={list.columns}
                      rows={(data[list.key] as Row[]) || []}
                      onChange={(rows) => set(list.key, rows)}
                      addLabel={`Add ${list.label.toLowerCase()} row`}
                      emptyLabel="Nothing here yet."
                      supportsImage={list.supportsImage}
                      productSlug={productSlug}
                    />
                  </div>
                ))}
              </div>
            </Disclosure>
            <Disclosure summary="Page regions shown on the public page" defaultOpen={false}>
              <div className="grid gap-2 sm:grid-cols-2">
                {regionToggles.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-xs text-zinc-700">
                    <input type="checkbox" checked={Boolean(data[key])} onChange={(e) => set(key, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
            </Disclosure>
          </div>
        ) : null}

        {tab === TAB_RELATED ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Recommended systems</h3>
              <p className="mt-1 text-[.7rem] leading-5 text-zinc-600">
                The systems shown in the &ldquo;Recommended systems&rdquo; band at the foot of this product page.
                Order is the order they appear, and the page shows the first four enabled rows.
              </p>
            </div>
            <fieldset className="space-y-3 rounded-lg border border-zinc-200 p-4">
              <legend className="px-1 text-xs font-bold text-zinc-900">Section wording</legend>
              <p className="text-[.7rem] leading-5 text-zinc-600">
                Leave a field empty to use the default for this product&rsquo;s category, which names the
                category in the title. That is why most products need nothing here.
              </p>
              <label className="grid gap-1 text-xs font-bold text-zinc-700">
                Eyebrow
                <input
                  value={(data.relatedHeading as string) || ""}
                  onChange={(e) => set("relatedHeading", e.target.value)}
                  placeholder={RECOMMENDED_HEADING}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="grid gap-1 text-xs font-bold text-zinc-700">
                Title
                <input
                  value={(data.relatedSubheading as string) || ""}
                  onChange={(e) => set("relatedSubheading", e.target.value)}
                  placeholder={`Systems That Work for ${data.categoryLabel || "..."}.`}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="grid gap-1 text-xs font-bold text-zinc-700">
                Description
                <textarea
                  rows={2}
                  value={(data.relatedDescription as string) || ""}
                  onChange={(e) => set("relatedDescription", e.target.value)}
                  placeholder={RECOMMENDED_DESCRIPTION}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-normal"
                />
              </label>
            </fieldset>
            <RelatedPicker
              selected={(data.relatedProducts as RelatedProductRow[]) || []}
              rows={options.products.filter((item) => item.id !== Number(initial.id))}
              onToggle={(productId) => {
                const current = ((data.relatedProducts as RelatedProductRow[]) || []).slice();
                const at = current.findIndex((row) => row.productId === productId);
                if (at === -1) current.push({ productId, isActive: true });
                else current.splice(at, 1);
                set("relatedProducts", current);
              }}
              onReorder={(ids) =>
                set(
                  "relatedProducts",
                  // Reordering must not disturb each row's own switch, so it
                  // carries the existing rows across instead of rebuilding from
                  // bare ids and resetting everything to shown.
                  ((data.relatedProducts as RelatedProductRow[]) || [])
                    .filter((row) => ids.includes(row.productId))
                    .sort((a, b) => ids.indexOf(a.productId) - ids.indexOf(b.productId)),
                )
              }
              onSetActive={(productId, isActive) =>
                set(
                  "relatedProducts",
                  ((data.relatedProducts as RelatedProductRow[]) || []).map((row) =>
                    row.productId === productId ? { ...row, isActive } : row,
                  ),
                )
              }
            />
            <Disclosure summary="Industries and projects" defaultOpen={false}>
              <div className="grid gap-5 lg:grid-cols-2">
                {relationGroups.map((group) => (
                  <fieldset key={group.key} className="rounded-lg border border-zinc-200 p-4">
                    <legend className="px-1 text-xs font-bold text-zinc-900">{group.label}</legend>
                    <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                      {group.rows.map((item) => (
                        <label
                          key={item.id}
                          className="flex cursor-pointer items-center gap-3 rounded-md p-2 text-xs text-zinc-800 hover:bg-zinc-50"
                        >
                          <input
                            type="checkbox"
                            checked={((data[group.key] as number[]) || []).includes(item.id)}
                            onChange={() => toggleRelation(group.key, item.id)}
                          />
                          <span>{item.name}</span>
                        </label>
                      ))}
                      {group.rows.length === 0 ? <p className="p-2 text-xs text-zinc-500">No records available yet.</p> : null}
                    </div>
                  </fieldset>
                ))}
              </div>
            </Disclosure>
          </div>
        ) : null}

        {tab !== TAB_IMAGES && tab !== TAB_SPECIFICATIONS && tab !== TAB_FEATURES && tab !== TAB_APPLICATIONS && tab !== TAB_SECTIONS && tab !== TAB_RELATED ? (
          <div className="space-y-5">
            {activeGroup.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {activeGroup.map((field) => (
                  <FieldInput
                    key={field.key}
                    field={field}
                    value={data[field.key]}
                    onChange={(v) => set(field.key, v)}
                    onMeta={setMeta}
                    onUploadBusy={onUploadBusy}
                  />
                ))}
              </div>
            ) : null}

            {tab === TAB_PUBLISH ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <h3 className="text-xs font-bold text-zinc-900">Save, then publish</h3>
                <p className="mt-1 text-[.7rem] leading-5 text-zinc-600">
                  Publishing rewrites the static product data the public page reads. The live page then needs
                  no database at all.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={saveDraft}
                    className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-900 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save draft"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={publishNow}
                    className="flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                  >
                    <Save size={15} />
                    {publishing ? "Publishing…" : "Save & publish"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeAdvanced.length > 0 ? (
          <Disclosure summary="More options" defaultOpen={false} className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {activeAdvanced.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={data[field.key]}
                  onChange={(v) => set(field.key, v)}
                  onMeta={setMeta}
                  onUploadBusy={onUploadBusy}
                />
              ))}
            </div>
          </Disclosure>
        ) : null}

        {error ? <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      </div>

      <div className="flex justify-end border-t border-zinc-200 bg-zinc-50 p-4">
        <button
          disabled={busy}
          className="flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
        >
          <Save size={15} />
          {saving ? "Saving…" : uploading ? "Uploading…" : "Save product"}
        </button>
      </div>
    </form>
  );
}

/** A collapsed block, so settings that are real but secondary take no space. */
function Disclosure({
  summary,
  children,
  defaultOpen = false,
  className = "",
}: {
  summary: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-lg border border-zinc-200 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50"
      >
        {summary}
        <span className="text-zinc-400">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="border-t border-zinc-200 p-4">{children}</div> : null}
    </div>
  );
}

/**
 * Related systems: pick, order, remove.
 *
 * Order matters to the reader and used to be set by the order the boxes were
 * ticked, which meant deselecting and reselecting to move a card. Selected rows
 * are listed first, in their own order, with explicit move controls.
 */
type RelatedProductRow = { productId: number; isActive: boolean };

/**
 * Picks the products recommended on this page, in order, each with its own
 * show/hide switch.
 *
 * Show/hide is a switch rather than a delete on purpose. The relationship and
 * its position in the order are worth keeping — this is a product page, and
 * "recommend these three plus this one next quarter" is a normal edit, not a
 * rebuild. Deleting the row would also lose the flag entirely, because a plain
 * id list has nowhere to record "chosen but currently hidden"; that missing bit
 * of state is why the switch used to do nothing at all.
 */
function RelatedPicker({
  selected,
  rows,
  onToggle,
  onReorder,
  onSetActive,
}: {
  selected: RelatedProductRow[];
  rows: Array<{ id: number; name: string }>;
  onToggle: (id: number) => void;
  onReorder: (ids: number[]) => void;
  onSetActive: (id: number, isActive: boolean) => void;
}) {
  const byId = new Map(rows.map((row) => [row.id, row.name]));
  const chosen = selected.filter((row) => byId.has(row.productId));
  const ids = chosen.map((row) => row.productId);
  const available = rows.filter((row) => !ids.includes(row.id));
  const enabledCount = chosen.filter((row) => row.isActive).length;

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= chosen.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    onReorder(next);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-xs font-bold text-zinc-900">
          Selected ({chosen.length})
          <span className="ml-2 font-normal text-zinc-500">{enabledCount} shown on the page</span>
        </h4>
        {chosen.length === 0 ? <p className="text-xs text-zinc-500">No recommended systems chosen yet.</p> : null}
        <div className="space-y-2">
          {chosen.map((row, index) => (
            <div
              key={row.productId}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${row.isActive ? "border-zinc-200 bg-white" : "border-zinc-200 bg-zinc-50"}`}
            >
              <GripVertical size={14} className="text-zinc-300" aria-hidden />
              <span className={`flex-1 text-xs ${row.isActive ? "text-zinc-800" : "text-zinc-400 line-through"}`}>
                {byId.get(row.productId)}
              </span>
              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[.65rem] text-zinc-600">
                <input
                  type="checkbox"
                  checked={row.isActive}
                  onChange={(e) => onSetActive(row.productId, e.target.checked)}
                />
                {row.isActive ? "Shown" : "Hidden"}
              </label>
              <button
                type="button"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="grid h-7 w-7 place-items-center rounded text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={index === chosen.length - 1}
                onClick={() => move(index, 1)}
                className="grid h-7 w-7 place-items-center rounded text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                aria-label="Remove"
                onClick={() => onToggle(row.productId)}
                className="grid h-7 w-7 place-items-center rounded text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-bold text-zinc-900">Add a system</h4>
        {available.length === 0 ? <p className="text-xs text-zinc-500">Every system is already selected.</p> : null}
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {available.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => onToggle(row.id)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-xs text-zinc-800 hover:bg-zinc-50"
            >
              <Plus size={14} className="text-zinc-400" />
              {row.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Service Editor ────────────────────────────────────────────────────────────

function ServiceEditor({
  initial,
  onSave,
  saving,
  uploading,
  error,
  onUploadBusy,
}: {
  initial: Data;
  onSave: (d: Data) => void;
  saving: boolean;
  uploading: boolean;
  error: string;
  onUploadBusy: (busy: boolean) => void;
}) {
  const [tab, setTab] = useState("General");
  const [data, setData] = useState<Data>({
    ...initial,
    status: initial.status || "DRAFT",
    featured: Boolean(initial.featured),
    robotsIndex: initial.robotsIndex ?? true,
    displayOrder: initial.displayOrder || 0,
    features: initial.features || [],
    process: initial.process || [],
    deliverables: Array.isArray(initial.deliverables) ? initial.deliverables : [],
    introBullets: Array.isArray(initial.introBullets) ? initial.introBullets : [],
    capabilities: Array.isArray(initial.capabilities) ? initial.capabilities : [],
    applications: initial.applications || [],
    whyChoosePoints: initial.whyChoosePoints || [],
  });

  const tabs = ["General", "Hero", "Content", "Process", "Features", "Applications", "Capabilities", "Why Choose", "SEO", "Publishing"];

  function set(key: string, value: unknown) {
    setData((d) => ({ ...d, [key]: value }));
  }
  function setMeta(values: Record<string, unknown>) {
    setData((d) => ({ ...d, ...values }));
  }

  const groups: Record<string, Field[]> = {
    General: [
      { key: "name", label: "Service name", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "icon", label: "Lucide icon name", help: "e.g. Factory, Wrench, HardHat, Truck" },
      { key: "shortDescription", label: "Short description (card / listing)", type: "textarea", required: true },
      { key: "description", label: "Full description (detail page intro)", type: "textarea", required: true },
    ],
    Hero: [
      { key: "heroImage", label: "Hero image URL", type: "url", folder: "services", publicIdKey: "heroImagePublicId" },
      { key: "heroHeading", label: "Hero heading (large headline on page)", type: "textarea" },
    ],
    Content: [
      { key: "introHeading", label: "Intro section heading" },
      { key: "introDescription", label: "Intro section description", type: "textarea" },
      { key: "introBullets", label: "Intro bullet points (one per line)", type: "lines" },
      { key: "deliverables", label: "Deliverables / what you get (one per line)", type: "lines" },
      { key: "relatedProductSlugs", label: "Related product slugs (one per line)", type: "lines" },
    ],
    SEO: [
      { key: "metaTitle", label: "Meta title" },
      { key: "metaDescription", label: "Meta description", type: "textarea" },
      { key: "keywords", label: "Keywords" },
      { key: "focusKeyword", label: "Focus keyword" },
      { key: "ogTitle", label: "Open Graph title" },
      { key: "ogDescription", label: "Open Graph description", type: "textarea" },
      { key: "ogImage", label: "Open Graph image URL", type: "url", folder: "services" },
      { key: "canonicalUrl", label: "Canonical URL" },
      { key: "robotsIndex", label: "Allow search engines to index", type: "checkbox" },
    ],
    Publishing: [
      { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
      { key: "featured", label: "Featured service", type: "checkbox" },
      { key: "displayOrder", label: "Display order", type: "number" },
    ],
  };

  // Array list configs (title + description rows)
  const arrayListConfig: Record<string, { key: string; fields: Array<[string, string]> }> = {
    Process: { key: "process", fields: [["title", "Step title"], ["description", "Step description"]] },
    Features: { key: "features", fields: [["title", "Feature title"], ["description", "Description"], ["icon", "Lucide icon (optional)"]] },
    Applications: { key: "applications", fields: [["title", "Application"], ["description", "Description (optional)"]] },
    Capabilities: { key: "capabilities", fields: [["value", "Capability"]] },
    "Why Choose": { key: "whyChoosePoints", fields: [["title", "Heading"], ["description", "Detail"]] },
  };

  function arrayUpdate(key: string, index: number, fieldKey: string, value: string) {
    if (key === "capabilities") {
      const arr = [...((data.capabilities as string[]) || [])];
      arr[index] = value;
      set("capabilities", arr);
      return;
    }
    const arr = [...((data[key] as Data[]) || [])];
    arr[index] = { ...arr[index], [fieldKey]: value };
    set(key, arr);
  }
  function arrayRemove(key: string, index: number) {
    if (key === "capabilities") {
      set("capabilities", ((data.capabilities as string[]) || []).filter((_, i) => i !== index));
      return;
    }
    set(key, ((data[key] as Data[]) || []).filter((_, i) => i !== index));
  }
  function arrayAdd(key: string) {
    if (key === "capabilities") { set("capabilities", [...((data.capabilities as string[]) || []), ""]); return; }
    const empty: Data =
      key === "features" ? { title: "", description: "", icon: "CheckCircle2" }
      : key === "process" ? { title: "", description: "" }
      : key === "applications" ? { title: "", description: "" }
      : key === "whyChoosePoints" ? { title: "", description: "" }
      : { title: "", description: "" };
    set(key, [...((data[key] as Data[]) || []), empty]);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    // Coerce lines-type fields from textarea strings to arrays
    const payload = { ...data };
    for (const field of Object.values(groups).flat()) {
      if (field.type === "lines" && typeof payload[field.key] === "string") {
        payload[field.key] = (payload[field.key] as string).split("\n").map((l) => l.trim()).filter(Boolean);
      }
    }
    onSave(payload);
  }

  const arrayConfig = arrayListConfig[tab] ?? null;
  const busy = saving || uploading;

  return (
    <form onSubmit={submit}>
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-zinc-200 px-5 pt-3">
        {tabs.map((item) => (
          <button
            type="button"
            onClick={() => setTab(item)}
            key={item}
            className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold ${
              tab === item ? "border-red-600 text-red-600" : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="p-5 sm:p-7">
        {groups[tab] ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {groups[tab].map((field) => (
              <FieldInput key={field.key} field={field} value={data[field.key]} onChange={(v) => set(field.key, v)} onMeta={setMeta} onUploadBusy={onUploadBusy} />
            ))}
          </div>
        ) : null}
        {arrayConfig ? (
          <div className="space-y-3">
            {tab === "Capabilities"
              ? ((data.capabilities as string[]) || []).map((cap, i) => (
                  <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4" key={i}>
                    <GripVertical size={16} className="text-zinc-300" />
                    <input value={cap} onChange={(e) => arrayUpdate("capabilities", i, "value", e.target.value)} className="admin-field flex-1" placeholder="e.g. Heavy-duty rack manufacturing" />
                    <button type="button" aria-label="Remove" onClick={() => arrayRemove("capabilities", i)} className="grid h-9 w-9 place-items-center rounded text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                  </div>
                ))
              : ((data[arrayConfig.key] as Data[]) || []).map((row, i) => (
                  <div className="grid items-start gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-[24px_1fr_1fr_auto]" key={i}>
                    <GripVertical size={16} className="mt-3 text-zinc-300" />
                    {arrayConfig.fields.map(([key, label]) => (
                      <div key={key}>
                        <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">{label}</label>
                        {key === "description" ? (
                          <textarea value={String(row[key] || "")} onChange={(e) => arrayUpdate(arrayConfig.key, i, key, e.target.value)} className="admin-field min-h-20" />
                        ) : (
                          <input value={String(row[key] || "")} onChange={(e) => arrayUpdate(arrayConfig.key, i, key, e.target.value)} className="admin-field" />
                        )}
                      </div>
                    ))}
                    {arrayConfig.fields.length === 1 ? <div /> : null}
                    <button type="button" aria-label="Remove row" onClick={() => arrayRemove(arrayConfig.key, i)} className="mt-5 grid h-9 w-9 place-items-center rounded text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                  </div>
                ))
            }
            <button type="button" onClick={() => arrayAdd(arrayConfig.key)} className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-900 hover:bg-zinc-50">
              <Plus size={14} /> Add row
            </button>
            <p className="text-[.68rem] leading-5 text-zinc-500">Rows save in the order shown. Save the service after adding or reordering.</p>
          </div>
        ) : null}
        {error ? <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      </div>
      <div className="flex justify-end border-t border-zinc-200 bg-zinc-50 p-4">
        <button disabled={busy} className="flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60">
          <Save size={15} />
          {saving ? "Saving…" : uploading ? "Uploading…" : "Save service"}
        </button>
      </div>
    </form>
  );
}

export function EntityEditor({
  entity,
  initialData = {},
  id,
  relationOptions = { products: [], industries: [], projects: [] },
}: {
  entity: string;
  initialData?: Data;
  id?: number;
  relationOptions?: RelationOptions;
}) {
  const router = useRouter();
  const [data, setData] = useState<Data>({
    ...initialData,
    status: initialData.status || "DRAFT",
    isActive: initialData.isActive ?? true,
    enabled: initialData.enabled ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const fields = configs[entity] || [];
  const title = String(initialData.name || initialData.title || initialData.clientName || initialData.question || initialData.sectionKey || `New ${entity.replace(/-/g, " ")}`);
  const preview = useMemo(() => {
    const slug = String(data.slug || initialData.slug || "");
    if (!slug) return null;
    const base = entity === "blog" ? "blog" : entity;
    return ["products", "services", "projects", "industries", "blog"].includes(entity)
      ? `/${base}/${slug}?preview=1`
      : entity === "pages"
        ? `/${slug}?preview=1`
        : null;
  }, [data.slug, initialData.slug, entity]);

  const markUpload = (busy: boolean) => setUploading((value) => Math.max(0, value + (busy ? 1 : -1)));

  async function save(payload: Data) {
    setSaving(true);
    setError("");
    const normalized = { ...payload };
    for (const field of fields) {
      if (field.type === "json" && typeof normalized[field.key] === "string") {
        try {
          normalized[field.key] = JSON.parse(normalized[field.key] as string);
        } catch {
          setError(`${field.label} must contain valid JSON.`);
          setSaving(false);
          return;
        }
      }
      if (field.type === "lines" && typeof normalized[field.key] === "string") {
        normalized[field.key] = (normalized[field.key] as string)
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
      }
    }
    if ((normalized.name || normalized.title) && !normalized.slug) normalized.slug = slugify(String(normalized.name || normalized.title));
    try {
      const response = await fetch(`/api/admin/${entity}${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || "Unable to save this record.");
        return;
      }
      router.push(`/admin/${entity}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /**
   * Save the record, then rewrite the static data the public page reads.
   *
   * Saving and publishing are deliberately one button here. They used to be two
   * steps in two places, which is how a product got edited for a week and never
   * appeared on the site — the save succeeded, the publish was forgotten, and
   * nothing on the page moved. The publish only runs after the save succeeds,
   * so the button cannot leave the two out of step.
   *
   * The payload is saved with `status: PUBLISHED`; the caller sets that, because
   * "publish" should mean the record is live *and* the static copy is current,
   * and the editor is what knows which of the two the press asked for.
   */
  async function saveAndPublish(payload: Data) {
    setSaving(true);
    setPublishing(true);
    setError("");
    const normalized = { ...payload };
    if ((normalized.name || normalized.title) && !normalized.slug) {
      normalized.slug = slugify(String(normalized.name || normalized.title));
    }
    try {
      const response = await fetch(`/api/admin/${entity}${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || "Unable to save this record.");
        return;
      }
      const published = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: entity === "products" ? "products" : "all" }),
      });
      if (!published.ok) {
        const reason = await published.json().catch(() => ({}));
        setError(`Saved, but publishing failed: ${reason.error || "unknown error"}. The public site still shows the previous version.`);
        return;
      }
      router.push(`/admin/${entity}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  }

  const busy = saving || publishing || uploading > 0;

  if (entity === "products") {
    return (
      <EditorFrame entity={entity} title={title} preview={preview}>
        <ProductEditor
          initial={initialData}
          onSave={save}
          onPublish={saveAndPublish}
          saving={saving}
          publishing={publishing}
          uploading={uploading > 0}
          error={error}
          options={relationOptions}
          onUploadBusy={markUpload}
        />
      </EditorFrame>
    );
  }

  if (entity === "services") {
    return (
      <EditorFrame entity={entity} title={title} preview={preview}>
        <ServiceEditor initial={initialData} onSave={save} saving={saving} uploading={uploading > 0} error={error} onUploadBusy={markUpload} />
      </EditorFrame>
    );
  }

  if (entity === "homepage") {
    // Two homepage sections model their own fields: the About section and the
    // offer-card heading are both edited regularly, and burying them in a JSON
    // textarea makes a routine copy or photo change a mistake waiting to happen.
    if (String(initialData.sectionKey) === "about") {
      return (
        <EditorFrame entity={entity} title={title} preview="/#home-about">
          <HomepageAboutEditor
            initial={initialData}
            onSave={save}
            saving={saving}
            uploading={uploading > 0}
            error={error}
            onUploadBusy={markUpload}
          />
        </EditorFrame>
      );
    }
    if (String(initialData.sectionKey) === "offers") {
      return (
        <EditorFrame entity={entity} title={title} preview="/">
          <HomepageOffersEditor initial={initialData} onSave={save} saving={saving} error={error} />
        </EditorFrame>
      );
    }
  }

  if (entity === "videos") {
    return (
      <EditorFrame entity={entity} title={title} preview={preview}>
        <VideoEditor
          initial={initialData}
          onSave={save}
          saving={saving}
          error={error}
          options={{ products: relationOptions.products, services: relationOptions.services ?? [] }}
        />
      </EditorFrame>
    );
  }

  return (
    <EditorFrame entity={entity} title={title} preview={preview}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(data);
        }}
      >
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          {fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={data[field.key]}
              onChange={(v) => setData((d) => ({ ...d, [field.key]: v }))}
              onMeta={(values) => setData((d) => ({ ...d, ...values }))}
              onUploadBusy={markUpload}
            />
          ))}
          {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p> : null}
        </div>
        <div className="flex justify-end border-t border-zinc-200 bg-zinc-50 p-4">
          <button disabled={busy} className="flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60">
            <Save size={15} />
            {saving ? "Saving…" : uploading > 0 ? "Uploading…" : "Save changes"}
          </button>
        </div>
      </form>
    </EditorFrame>
  );
}

function EditorFrame({ entity, title, preview, children }: { entity: string; title: string; preview: string | null; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={`/admin/${entity}`} className="inline-flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-zinc-900">
            <ArrowLeft size={13} /> Back to {entity}
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">{title}</h1>
        </div>
        {preview ? (
          <Link href={preview} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-900 hover:bg-zinc-50">
            <Eye size={15} /> Preview
          </Link>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">{children}</div>
    </section>
  );
}
