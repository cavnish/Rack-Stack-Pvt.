"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CloudUpload, Eye, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";
import { slugify } from "@/lib/utils";

type Data = Record<string, unknown>;
type RelationOptions = {
  products: Array<{ id: number; name: string }>;
  industries: Array<{ id: number; name: string }>;
  projects: Array<{ id: number; title: string }>;
};
type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "url" | "number" | "checkbox" | "select" | "json" | "lines" | "date" | "password";
  required?: boolean;
  options?: string[];
  help?: string;
  folder?: string;
  publicIdKey?: string;
  widthKey?: string;
  heightKey?: string;
};
type UploadResult = { imageUrl: string; cloudinaryPublicId?: string | null; width?: number | null; height?: number | null };

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const configs: Record<string, Field[]> = {
  services: [
    { key: "name", label: "Service name", required: true },
    { key: "slug", label: "Slug", required: true },
    { key: "shortDescription", label: "Short description", type: "textarea", required: true },
    { key: "description", label: "Full description", type: "textarea", required: true },
    { key: "heroImage", label: "Hero image URL", type: "url", folder: "services" },
    { key: "icon", label: "Lucide icon name" },
    { key: "featured", label: "Featured", type: "checkbox" },
    { key: "status", label: "Publishing status", type: "select", options: STATUS_OPTIONS },
    { key: "displayOrder", label: "Display order", type: "number" },
    { key: "metaTitle", label: "SEO title" },
    { key: "metaDescription", label: "SEO description", type: "textarea" },
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

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024;

function ImageUpload({
  value,
  folder = "cms",
  onUploaded,
  onBusyChange,
}: {
  value?: string;
  folder?: string;
  onUploaded: (result: UploadResult) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setDone(false);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Use a JPG, PNG, WebP or AVIF image.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 10MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setLoading(true);
    onBusyChange?.(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("folder", folder || "cms");
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      onUploaded({ imageUrl: data.imageUrl, cloudinaryPublicId: data.cloudinaryPublicId, width: data.width, height: data.height });
      setDone(true);
    } catch {
      setError("Network error while uploading.");
    } finally {
      setLoading(false);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <span className="relative block h-14 w-14 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            <SmartImage src={value} alt="Selected image preview" fill className="object-cover" sizes="56px" />
          </span>
        ) : null}
        <label
          className={`inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-[.68rem] font-bold text-zinc-800 transition hover:bg-zinc-50 ${
            loading ? "cursor-wait opacity-60" : "cursor-pointer"
          }`}
        >
          <CloudUpload size={13} />
          {loading ? "Uploading…" : value ? "Replace image" : "Upload to Cloudinary"}
          <input ref={inputRef} className="hidden" type="file" accept={ACCEPTED_TYPES.join(",")} disabled={loading} onChange={pick} />
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => {
              onUploaded({ imageUrl: "" });
              setError("");
              setDone(false);
            }}
            className="text-[.68rem] font-bold text-red-600 hover:underline"
          >
            Remove
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-[.68rem] font-semibold text-red-600">{error}</p> : null}
      {done && !error ? <p className="mt-2 text-[.68rem] font-semibold text-green-600">Upload complete.</p> : null}
    </div>
  );
}

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
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
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
  saving,
  uploading,
  error,
  options,
  onUploadBusy,
}: {
  initial: Data;
  onSave: (d: Data) => void;
  saving: boolean;
  uploading: boolean;
  error: string;
  options: RelationOptions;
  onUploadBusy: (busy: boolean) => void;
}) {
  const [tab, setTab] = useState("General");
  const [data, setData] = useState<Data>({
    ...initial,
    status: initial.status || "DRAFT",
    featured: Boolean(initial.featured),
    displayOrder: initial.displayOrder || 0,
    specHighlights: Array.isArray(initial.specHighlights) ? (initial.specHighlights as string[]).join("\n") : String(initial.specHighlights ?? ""),
    features: initial.features || [],
    specifications: initial.specifications || [],
    applications: initial.applications || [],
    images: initial.images || [],
    benefits: initial.benefits || [],
    components: initial.components || [],
    configurations: initial.configurations || [],
    storedMaterials: initial.storedMaterials || [],
    stories: initial.stories || [],
    workflows: initial.workflows || [],
    faqs: initial.faqs || [],
    relatedProductIds: initial.relatedProductIds || [],
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
  const tabs = ["General", "Hero", "Highlights", "Specifications", "Applications", "Configurations", "Components", "Benefits", "Storage", "Story", "Workflow", "Gallery", "Relationships", "FAQs", "Technical", "Sections", "SEO", "Publishing"];

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

  const groups: Record<string, Field[]> = {
    General: [
      { key: "name", label: "Product name", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "category", label: "Category", type: "select", options: ["Industrial Racking", "Space Optimization", "Workplace Storage"] },
      { key: "shortDescription", label: "Short description", type: "textarea", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "longDescription", label: "Long description", type: "textarea" },
    ],
    Hero: [
      { key: "heroImage", label: "Hero image URL", type: "url", folder: "products", publicIdKey: "heroImagePublicId" },
      { key: "thumbnail", label: "Thumbnail URL", type: "url", folder: "products", publicIdKey: "thumbnailPublicId" },
      { key: "heroTitle", label: "Positioning statement", help: "A short, premium positioning line shown above the product name on the detail page." },
      { key: "heroDescription", label: "Hero description" },
      { key: "specHighlights", label: "Specification highlights (one per line)", type: "lines", help: "Short hero chips such as load capacity, height range or finish." },
    ],
    Technical: [
      { key: "technicalEnabled", label: "Show technical image block", type: "checkbox" },
      { key: "technicalImage", label: "Technical / dimension image URL", type: "url", folder: "products", publicIdKey: "technicalImagePublicId", help: "Dimension drawing, structure diagram or component breakdown." },
      { key: "technicalDescription", label: "Technical caption", type: "textarea" },
    ],
    Sections: [
      { key: "showGallery", label: "Show gallery", type: "checkbox" },
      { key: "showFeatures", label: "Show highlights", type: "checkbox" },
      { key: "showSpecifications", label: "Show specifications", type: "checkbox" },
      { key: "showConfigurations", label: "Show configurations", type: "checkbox" },
      { key: "showApplications", label: "Show applications", type: "checkbox" },
      { key: "showStoredMaterials", label: "Show what can be stored", type: "checkbox" },
      { key: "showStories", label: "Show in-operation story", type: "checkbox" },
      { key: "showWorkflow", label: "Show installation workflow", type: "checkbox" },
      { key: "showBenefits", label: "Show benefits", type: "checkbox" },
      { key: "showComponents", label: "Show components", type: "checkbox" },
      { key: "showFaq", label: "Show FAQ", type: "checkbox" },
      { key: "showRelated", label: "Show related products", type: "checkbox" },
    ],
    SEO: [
      { key: "metaTitle", label: "Meta title" },
      { key: "metaDescription", label: "Meta description", type: "textarea" },
      { key: "keywords", label: "Keywords" },
      { key: "focusKeyword", label: "Focus keyword" },
      { key: "ogTitle", label: "Open Graph title" },
      { key: "ogDescription", label: "Open Graph description", type: "textarea" },
      { key: "ogImage", label: "Open Graph image URL", type: "url", folder: "products" },
      { key: "canonicalUrl", label: "Canonical URL" },
      { key: "robotsIndex", label: "Allow search engines to index", type: "checkbox" },
    ],
    Publishing: [
      { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
      { key: "featured", label: "Featured product", type: "checkbox" },
      { key: "displayOrder", label: "Display order", type: "number" },
    ],
  };

  function arrayUpdate(key: string, index: number, fieldKey: string, value: string) {
    const arr = [...((data[key] as Data[]) || [])];
    arr[index] = { ...arr[index], [fieldKey]: value };
    set(key, arr);
  }
  function arrayRemove(key: string, index: number) {
    set(key, ((data[key] as Data[]) || []).filter((_, i) => i !== index));
  }
  const fieldGroupConfig: Record<string, { key: string; fields: Array<[string, string]>; previewField?: string }> = {
    Highlights: { key: "features", fields: [["title", "Title"], ["description", "Description"]] },
    Specifications: { key: "specifications", fields: [["specificationName", "Specification"], ["specificationValue", "Value"]] },
    Applications: { key: "applications", fields: [["title", "Application"], ["description", "Description"], ["image", "Image URL (optional)"], ["altText", "Image alt text"]] },
    Configurations: { key: "configurations", fields: [["title", "Title"], ["description", "Description"], ["image", "Image URL (optional)"], ["altText", "Image alt text"]], previewField: "image" },
    Components: { key: "components", fields: [["title", "Component"], ["description", "Description"], ["image", "Image URL (optional)"], ["altText", "Image alt text"]], previewField: "image" },
    Benefits: { key: "benefits", fields: [["title", "Benefit"], ["description", "Description"]] },
    Storage: { key: "storedMaterials", fields: [["title", "Material"], ["description", "Description"], ["image", "Image URL (optional)"], ["altText", "Image alt text"]], previewField: "image" },
    Story: { key: "stories", fields: [["title", "Caption"], ["description", "Description"], ["image", "Image URL (required)"], ["altText", "Image alt text"]], previewField: "image" },
    Workflow: { key: "workflows", fields: [["title", "Step"], ["description", "Description"]] },
    Gallery: { key: "images", fields: [["imageUrl", "Cloudinary image URL"], ["altText", "Alternative text"], ["caption", "Caption (optional)"]] },
    FAQs: { key: "faqs", fields: [["question", "Question"], ["answer", "Answer"]] },
  };
  const arrayConfig = fieldGroupConfig[tab] ?? null;

  const relationGroups = [
    { key: "relatedProductIds", label: "Related products", rows: options.products.filter((item) => item.id !== Number(initial.id)) },
    { key: "industryIds", label: "Relevant industries", rows: options.industries },
    { key: "projectIds", label: "Related projects", rows: options.projects.map((item) => ({ id: item.id, name: item.title })) },
  ];

  const busy = saving || uploading;

  function arrayAdd(key: string) {
    const empty: Data =
      key === "features"
        ? { title: "", description: "", icon: "CheckCircle2" }
        : key === "specifications"
          ? { specificationName: "", specificationValue: "" }
          : key === "images"
            ? { imageUrl: "", altText: "", caption: "" }
            : key === "faqs"
              ? { question: "", answer: "" }
              : key === "applications"
                ? { title: "", description: "", image: "", altText: "" }
                : key === "stories"
                  ? { title: "", description: "", image: "", altText: "" }
                  : key === "workflows"
                    ? { title: "", description: "" }
                    : { title: "", description: "", image: "", altText: "" };
    set(key, [...((data[key] as Data[]) || []), empty]);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload: Data = { ...data };
    if (typeof payload.specHighlights === "string") {
      payload.specHighlights = (payload.specHighlights as string).split("\n").map((line) => line.trim()).filter(Boolean);
    }
    onSave(payload);
  }

  const isTextareaField = (key: string) => key === "description" || key === "answer";

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
            {((data[arrayConfig.key] as Data[]) || []).map((row, i) => (
              <div className="grid items-start gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-[24px_1fr_1fr_auto]" key={i}>
                <GripVertical size={16} className="mt-3 text-zinc-300" />
                {arrayConfig.fields.map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">{label}</label>
                    {isTextareaField(key) ? (
                      <textarea
                        value={String(row[key] || "")}
                        onChange={(e) => arrayUpdate(arrayConfig.key, i, key, e.target.value)}
                        className="admin-field min-h-20"
                        required={key === "description"}
                      />
                    ) : (
                      <input value={String(row[key] || "")} onChange={(e) => arrayUpdate(arrayConfig.key, i, key, e.target.value)} className="admin-field" required={key === "image" && arrayConfig.key === "stories"} />
                    )}
                  </div>
                ))}
                {arrayConfig.fields.length === 1 ? <div /> : null}
                <button
                  type="button"
                  aria-label="Remove row"
                  onClick={() => arrayRemove(arrayConfig.key, i)}
                  className="mt-5 grid h-9 w-9 place-items-center rounded text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => arrayAdd(arrayConfig.key)} className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-900 hover:bg-zinc-50">
              <Plus size={14} /> Add row
            </button>
            <p className="text-[.68rem] leading-5 text-zinc-500">Rows save in the order shown. Run a product save after adding or reordering.</p>
          </div>
        ) : null}
        {tab === "Relationships" ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {relationGroups.map((group) => (
              <fieldset key={group.key} className="rounded-lg border border-zinc-200 p-4">
                <legend className="px-1 text-xs font-bold text-zinc-900">{group.label}</legend>
                <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                  {group.rows.map((item) => (
                    <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 text-xs text-zinc-800 hover:bg-zinc-50">
                      <input type="checkbox" checked={((data[group.key] as number[]) || []).includes(item.id)} onChange={() => toggleRelation(group.key, item.id)} />
                      <span>{item.name}</span>
                    </label>
                  ))}
                  {group.rows.length === 0 ? <p className="p-2 text-xs text-zinc-500">No records available yet.</p> : null}
                </div>
              </fieldset>
            ))}
          </div>
        ) : null}
        {error ? <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      </div>
      <div className="flex justify-end border-t border-zinc-200 bg-zinc-50 p-4">
        <button disabled={busy} className="flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60">
          <Save size={15} />
          {saving ? "Saving…" : uploading ? "Uploading…" : "Save product"}
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

  const busy = saving || uploading > 0;

  if (entity === "products") {
    return (
      <EditorFrame entity={entity} title={title} preview={preview}>
        <ProductEditor initial={initialData} onSave={save} saving={saving} uploading={uploading > 0} error={error} options={relationOptions} onUploadBusy={markUpload} />
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
