import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
export const contentStatusEnum = pgEnum("content_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "QUOTATION_SENT",
  "WON",
  "LOST",
  "SPAM",
]);
export const messageStatusEnum = pgEnum("message_status", ["NEW", "READ", "REPLIED", "ARCHIVED", "SPAM"]);
export const sliderTextAlignEnum = pgEnum("slider_text_align", ["left", "center", "right"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").default("EDITOR").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLogin: timestamp("last_login", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("sessions_user_idx").on(table.userId), uniqueIndex("sessions_token_unique").on(table.tokenHash)],
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    longDescription: text("long_description"),
    category: text("category").notNull(),
    featured: boolean("featured").default(false).notNull(),
    status: contentStatusEnum("status").default("DRAFT").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    heroImage: text("hero_image"),
    heroImagePublicId: text("hero_image_public_id"),
    thumbnail: text("thumbnail"),
    thumbnailPublicId: text("thumbnail_public_id"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    keywords: text("keywords"),
    focusKeyword: text("focus_keyword"),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImage: text("og_image"),
    canonicalUrl: text("canonical_url"),
    robotsIndex: boolean("robots_index").default(true).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("products_slug_unique").on(table.slug),
    index("products_status_idx").on(table.status),
    index("products_category_idx").on(table.category),
    index("products_featured_idx").on(table.featured),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    imageUrl: text("image_url").notNull(),
    cloudinaryPublicId: text("cloudinary_public_id"),
    altText: text("alt_text").notNull(),
    caption: text("caption"),
    width: integer("width"),
    height: integer("height"),
    fileSize: integer("file_size"),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("product_images_product_idx").on(table.productId)],
);

export const productFeatures = pgTable("product_features", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").default("CheckCircle2"),
  displayOrder: integer("display_order").default(0).notNull(),
});

export const productSpecifications = pgTable("product_specifications", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  specificationName: text("specification_name").notNull(),
  specificationValue: text("specification_value").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

export const productApplications = pgTable("product_applications", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  application: text("application").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

export const services = pgTable(
  "services",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    heroImage: text("hero_image"),
    heroImagePublicId: text("hero_image_public_id"),
    icon: text("icon").default("DraftingCompass"),
    featured: boolean("featured").default(false).notNull(),
    status: contentStatusEnum("status").default("DRAFT").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    process: jsonb("process").$type<Array<{ title: string; description: string }>>().default([]),
    deliverables: jsonb("deliverables").$type<string[]>().default([]),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    keywords: text("keywords"),
    focusKeyword: text("focus_keyword"),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImage: text("og_image"),
    canonicalUrl: text("canonical_url"),
    robotsIndex: boolean("robots_index").default(true).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("services_slug_unique").on(table.slug), index("services_status_idx").on(table.status)],
);

export const serviceFeatures = pgTable("service_features", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").references(() => services.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").default("CheckCircle2"),
  displayOrder: integer("display_order").default(0).notNull(),
});

export const industries = pgTable(
  "industries",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    challenges: jsonb("challenges").$type<string[]>().default([]),
    benefits: jsonb("benefits").$type<string[]>().default([]),
    heroImage: text("hero_image"),
    icon: text("icon").default("Factory"),
    status: contentStatusEnum("status").default("DRAFT").notNull(),
    featured: boolean("featured").default(false).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    ...timestamps,
  },
  (table) => [uniqueIndex("industries_slug_unique").on(table.slug)],
);

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    clientName: text("client_name"),
    location: text("location"),
    industry: text("industry"),
    solution: text("solution"),
    description: text("description").notNull(),
    challenge: text("challenge"),
    solutionDescription: text("solution_description"),
    result: text("result"),
    execution: text("execution"),
    featured: boolean("featured").default(false).notNull(),
    coverImage: text("cover_image"),
    coverImagePublicId: text("cover_image_public_id"),
    status: contentStatusEnum("status").default("DRAFT").notNull(),
    projectDate: timestamp("project_date", { withTimezone: true }),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    canonicalUrl: text("canonical_url"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("projects_slug_unique").on(table.slug), index("projects_status_idx").on(table.status)],
);

export const projectImages = pgTable("project_images", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  imageUrl: text("image_url").notNull(),
  cloudinaryPublicId: text("cloudinary_public_id"),
  altText: text("alt_text").notNull(),
  width: integer("width"),
  height: integer("height"),
  fileSize: integer("file_size"),
  displayOrder: integer("display_order").default(0).notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  cloudinaryPublicId: text("cloudinary_public_id"),
  website: text("website"),
  industry: text("industry"),
  featured: boolean("featured").default(false).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const clientLogos = pgTable(
  "client_logos",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    imageUrl: text("image_url").notNull(),
    imagePublicId: text("image_public_id"),
    altText: text("alt_text").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    width: integer("width"),
    height: integer("height"),
    ...timestamps,
  },
  (table) => [
    index("client_logos_active_sort_idx").on(table.isActive, table.sortOrder),
  ],
);

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  company: text("company"),
  designation: text("designation"),
  content: text("content").notNull(),
  rating: integer("rating").default(5).notNull(),
  image: text("image"),
  featured: boolean("featured").default(false).notNull(),
  status: contentStatusEnum("status").default("DRAFT").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  cloudinaryPublicId: text("cloudinary_public_id"),
  altText: text("alt_text").notNull(),
  description: text("description"),
  width: integer("width"),
  height: integer("height"),
  fileSize: integer("file_size"),
  displayOrder: integer("display_order").default(0).notNull(),
  status: contentStatusEnum("status").default("DRAFT").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const inquiries = pgTable(
  "inquiries",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    company: text("company").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    whatsapp: text("whatsapp"),
    city: text("city"),
    state: text("state"),
    requirement: text("requirement").notNull(),
    warehouseSize: text("warehouse_size"),
    loadRequirement: text("load_requirement"),
    attachmentUrl: text("attachment_url"),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    serviceId: integer("service_id").references(() => services.id, { onDelete: "set null" }),
    message: text("message"),
    sourcePage: text("source_page"),
    status: inquiryStatusEnum("status").default("NEW").notNull(),
    assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [index("inquiries_status_idx").on(table.status), index("inquiries_created_idx").on(table.createdAt)],
);

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: messageStatusEnum("status").default("NEW").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const homepageSections = pgTable(
  "homepage_sections",
  {
    id: serial("id").primaryKey(),
    sectionKey: text("section_key").notNull(),
    title: text("title"),
    subtitle: text("subtitle"),
    content: jsonb("content").$type<Record<string, unknown>>().default({}).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("homepage_section_key_unique").on(table.sectionKey)],
);

export const homeSliders = pgTable(
  "home_sliders",
  {
    id: serial("id").primaryKey(),
    eyebrow: text("eyebrow"),
    title: text("title"),
    highlightedText: text("highlighted_text"),
    description: text("description"),
    imageUrl: text("image_url"),
    imagePublicId: text("image_public_id"),
    mobileImageUrl: text("mobile_image_url"),
    mobileImagePublicId: text("mobile_image_public_id"),
    imageAlt: text("image_alt"),
    primaryButtonText: text("primary_button_text").default("Explore Solutions"),
    primaryButtonUrl: text("primary_button_url"),
    secondaryButtonText: text("secondary_button_text").default("Request a Quote"),
    secondaryButtonUrl: text("secondary_button_url"),
    status: contentStatusEnum("status").default("DRAFT").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    overlayOpacity: integer("overlay_opacity").default(72).notNull(),
    textAlignment: sliderTextAlignEnum("text_alignment").default("left").notNull(),
    autoplay: boolean("autoplay").default(true).notNull(),
    duration: integer("duration").default(7000).notNull(),
    startAt: timestamp("start_at", { withTimezone: true }),
    endAt: timestamp("end_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("home_sliders_status_idx").on(table.status),
    index("home_sliders_sort_idx").on(table.sortOrder),
  ],
);

export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content").notNull(),
    heroTitle: text("hero_title"),
    heroDescription: text("hero_description"),
    heroImage: text("hero_image"),
    heroImagePublicId: text("hero_image_public_id"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    canonicalUrl: text("canonical_url"),
    status: contentStatusEnum("status").default("DRAFT").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("pages_slug_unique").on(table.slug)],
);

export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull(),
    content: text("content").notNull(),
    categoryId: integer("category_id").references(() => blogCategories.id, { onDelete: "set null" }),
    featuredImage: text("featured_image"),
    featuredImagePublicId: text("featured_image_public_id"),
    authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
    status: contentStatusEnum("status").default("DRAFT").notNull(),
    featured: boolean("featured").default(false).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    keywords: text("keywords"),
    canonicalUrl: text("canonical_url"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("blog_posts_slug_unique").on(table.slug), index("blog_posts_status_idx").on(table.status)],
);

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  entityType: text("entity_type").default("GLOBAL").notNull(),
  entityId: integer("entity_id"),
  displayOrder: integer("display_order").default(0).notNull(),
  status: contentStatusEnum("status").default("PUBLISHED").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const media = pgTable(
  "media",
  {
    id: serial("id").primaryKey(),
    filename: text("filename").notNull(),
    imageUrl: text("image_url").notNull(),
    cloudinaryPublicId: text("cloudinary_public_id").notNull(),
    altText: text("alt_text").notNull(),
    folder: text("folder").default("rack-stack").notNull(),
    mimeType: text("mime_type"),
    width: integer("width"),
    height: integer("height"),
    fileSize: integer("file_size"),
    uploadedBy: integer("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("media_public_id_unique").on(table.cloudinaryPublicId), index("media_folder_idx").on(table.folder)],
);

export const seoSettings = pgTable("seo_settings", {
  id: serial("id").primaryKey(),
  siteTitle: text("site_title").notNull(),
  defaultMetaDescription: text("default_meta_description").notNull(),
  keywords: text("keywords"),
  ogImage: text("og_image"),
  twitterImage: text("twitter_image"),
  robotsSettings: text("robots_settings").default("index,follow"),
  googleVerification: text("google_verification"),
  canonicalBaseUrl: text("canonical_base_url"),
  organizationSchema: jsonb("organization_schema").$type<Record<string, unknown>>().default({}),
  socialLinks: jsonb("social_links").$type<Record<string, string>>().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  logo: text("logo"),
  favicon: text("favicon"),
  primaryPhone: text("primary_phone").notNull(),
  secondaryPhone: text("secondary_phone"),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  workingHours: text("working_hours").notNull(),
  socialLinks: jsonb("social_links").$type<Record<string, string>>().default({}),
  footerContent: text("footer_content"),
  copyright: text("copyright"),
  googleMapsEmbed: text("google_maps_embed"),
  brochureUrl: text("brochure_url"),
  brochurePublicId: text("brochure_public_id"),
  catalogTitle: text("catalog_title").default("Rack & Stack Product Catalog").notNull(),
  catalogDescription: text("catalog_description").default("Review our storage system categories and discuss the right configuration for your operation.").notNull(),
  catalogLeadGated: boolean("catalog_lead_gated").default(false).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("newsletter_email_unique").on(table.email)],
);

export const redirects = pgTable("redirects", {
  id: serial("id").primaryKey(),
  sourcePath: text("source_path").notNull().unique(),
  destinationPath: text("destination_path").notNull(),
  permanent: boolean("permanent").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productRelatedProducts = pgTable(
  "product_related_products",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    relatedProductId: integer("related_product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (table) => [
    uniqueIndex("product_related_unique").on(table.productId, table.relatedProductId),
    index("product_related_product_idx").on(table.productId),
  ],
);

export const productProjects = pgTable(
  "product_projects",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (table) => [
    uniqueIndex("product_project_unique").on(table.productId, table.projectId),
    index("product_project_product_idx").on(table.productId),
    index("product_project_project_idx").on(table.projectId),
  ],
);

export const productIndustries = pgTable(
  "product_industries",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    industryId: integer("industry_id").references(() => industries.id, { onDelete: "cascade" }).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (table) => [
    uniqueIndex("product_industry_unique").on(table.productId, table.industryId),
    index("product_industry_product_idx").on(table.productId),
    index("product_industry_industry_idx").on(table.industryId),
  ],
);

export const serviceIndustries = pgTable(
  "service_industries",
  {
    id: serial("id").primaryKey(),
    serviceId: integer("service_id").references(() => services.id, { onDelete: "cascade" }).notNull(),
    industryId: integer("industry_id").references(() => industries.id, { onDelete: "cascade" }).notNull(),
  },
  (table) => [uniqueIndex("service_industry_unique").on(table.serviceId, table.industryId), index("service_industry_service_idx").on(table.serviceId)],
);

export const serviceProjects = pgTable(
  "service_projects",
  {
    id: serial("id").primaryKey(),
    serviceId: integer("service_id").references(() => services.id, { onDelete: "cascade" }).notNull(),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  },
  (table) => [uniqueIndex("service_project_unique").on(table.serviceId, table.projectId), index("service_project_service_idx").on(table.serviceId)],
);

export const catalogDownloads = pgTable(
  "catalog_downloads",
  {
    id: serial("id").primaryKey(),
    name: text("name"),
    company: text("company"),
    email: text("email"),
    phone: text("phone"),
    catalogUrl: text("catalog_url"),
    sourcePage: text("source_page"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("catalog_downloads_created_idx").on(table.createdAt)],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    eventName: text("event_name").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    path: text("path"),
    consentLevel: text("consent_level").default("essential").notNull(),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("analytics_event_name_idx").on(table.eventName), index("analytics_created_idx").on(table.createdAt)],
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("activity_logs_user_idx").on(table.userId), index("activity_logs_created_idx").on(table.createdAt)],
);
