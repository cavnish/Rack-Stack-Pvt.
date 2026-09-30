import { cacheImage, resolveLocalAsset, slugifySegment, type AssetGroup } from "./media";
import { catalogueProducts, getRelatedCatalogueProducts } from "@/lib/catalogue";
import { CORE_SERVICES } from "@/data/services-data";
import {
  defaultGalleryAltText,
  defaultGalleryCaption,
  productGalleryOrder,
  productGallerySlots,
} from "@/lib/product-gallery-slots";
import type {
  StaticBlogCategory,
  StaticBlogPost,
  StaticClientLogo,
  StaticFaq,
  StaticGalleryItem,
  StaticHomeSection,
  StaticHomeSlider,
  StaticIndustry,
  StaticPage,
  StaticProduct,
  StaticProject,
  StaticService,
  StaticTestimonial,
  StaticVideo,
} from "./types";

/**
 * Curated content used only when no published static data exists yet and Neon
 * cannot be reached. It mirrors the CMS seed data and always points at local
 * assets, so the public site renders completely offline.
 */

type ImageKey =
  | "siteHero"
  | "hero"
  | "aisle"
  | "forklift"
  | "warehouse"
  | "shelving"
  | "racks"
  | "installation"
  | "longspan";

const imageDefinitions: Record<ImageKey, { group: AssetGroup; name: string; fallback: string }> = {
  siteHero: { group: "hero", name: "rack-and-stack-site-hero", fallback: "/Hero.jpeg" },
  hero: { group: "hero", name: "warehouse-pallet-storage-hero", fallback: "/illustrations/pallet-racking-hero.svg" },
  aisle: { group: "about", name: "organised-storage-aisle", fallback: "/illustrations/warehouse-storage.svg" },
  forklift: { group: "products", name: "forklift-alongside-pallet-racking", fallback: "/illustrations/material-handling.svg" },
  warehouse: { group: "gallery", name: "warehouse-storage-layout", fallback: "/illustrations/warehouse-storage.svg" },
  shelving: { group: "services", name: "industrial-shelving-installation", fallback: "/illustrations/industrial-shelving.svg" },
  racks: { group: "products", name: "industrial-racking-systems", fallback: "/illustrations/storage-systems-overview.svg" },
  installation: { group: "services", name: "storage-system-installation", fallback: "/illustrations/storage-systems-overview.svg" },
  longspan: { group: "products", name: "long-span-storage", fallback: "/illustrations/long-span-shelving.svg" },
};

let imageCache: Promise<Record<ImageKey, string>> | null = null;

export function bootstrapImages() {
  if (!imageCache) {
    imageCache = (async () => {
      const entries = await Promise.all(
        (Object.keys(imageDefinitions) as ImageKey[]).map(async (key) => {
          const definition = imageDefinitions[key];
          const resolved = await resolveLocalAsset(definition.group, definition.name);
          return [key, resolved ?? definition.fallback] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<ImageKey, string>;
    })();
  }
  return imageCache;
}

const EPOCH = "2026-01-01T00:00:00.000Z";
/**
 * Offline product content is derived from src/lib/catalogue.ts, which is the
 * project's own product source of truth. Nothing here is hand-written per
 * product: names, descriptions, features, specifications, applications and
 * industry references all come from the catalogue, so a fallback page can never
 * disagree with the real product pages.
 */

const catalogueOrder = catalogueProducts.map((product) => product.slug);

function catalogueBySlug(slug: string) {
  return catalogueProducts.find((product) => product.slug === slug);
}

function catalogueId(slug: string) {
  const index = catalogueOrder.indexOf(slug);
  return index === -1 ? 0 : index + 1;
}

/** Local asset for a catalogue image, falling back to the group placeholder. */
async function localImageFor(url: string, fallbackKey: ImageKey) {
  const images = await bootstrapImages();
  const resolved = await cacheImage(url, { group: "products", name: `catalogue-${slugifySegment(url.split("/").pop() ?? "image")}` });
  return resolved?.url ?? images[fallbackKey];
}

const catalogueIndustryNames = Array.from(
  new Set(catalogueProducts.flatMap((product) => product.industries.map((name) => name.trim())).filter(Boolean)),
).sort();

const industrySlugOf = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function bootstrapProducts(): Promise<StaticProduct[]> {
  const images = await bootstrapImages();
  return catalogueProducts.map((product, displayOrder) => ({
    id: displayOrder + 1,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.shortDescription,
    longDescription: product.longDescription,
    category: product.category,
    featured: product.featured,
    status: "PUBLISHED",
    // Every catalogue entry is live, and the serialized shape the rest of the
    // site consumes requires the flag to be present rather than undefined.
    isActive: true,
    displayOrder: product.order ?? displayOrder,
    heroImage: images.racks,
    heroImagePublicId: null,
    thumbnail: images.racks,
    thumbnailPublicId: null,
    heroTitle: product.seo?.title ?? null,
    heroDescription: product.seo?.description ?? null,
    specHighlights: product.specifications.slice(0, 3).map((specification) => specification.value),
    technicalImage: null,
    technicalImagePublicId: null,
    technicalDescription: null,
    technicalEnabled: false,
    showGallery: true,
    showFeatures: true,
    showSpecifications: true,
    showConfigurations: true,
    showApplications: true,
    showStoredMaterials: true,
    showStories: true,
    showWorkflow: true,
    showBenefits: true,
    showComponents: true,
    showFaq: true,
    showRelated: true,
    // Seeded null on purpose. The catalogue has no per-product wording for this
    // section, and inventing 37 near-identical paragraphs in a fixture would only
    // hide the fact that the page derives the title from the product's category.
    relatedHeading: null,
    relatedSubheading: null,
    relatedDescription: null,
    metaTitle: product.seo?.title ?? `${product.name} | Rack & Stack`,
    metaDescription: product.seo?.description ?? product.shortDescription,
    keywords: [product.name, ...product.applications].join(", "),
    focusKeyword: product.name.toLowerCase(),
    ogTitle: product.seo?.ogTitle ?? null,
    ogDescription: product.seo?.ogDescription ?? null,
    ogImage: images.racks,
    canonicalUrl: null,
    robotsIndex: true,
    // Editorial copy. Left null so the renderer's own defaults apply: a fallback
    // page should read like the real product page, not like a section that has
    // been half filled in.
    galleryHeading: null,
    featuresHeading: null,
    overviewHeading: null,
    overviewBody: null,
    applicationsHeading: null,
    applicationsIntro: null,
    ctaTitle: null,
    ctaSubtitle: null,
    primaryCtaLabel: null,
    primaryCtaHref: null,
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    deletedAt: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  }));
}

export async function bootstrapProductChildren(slug: string) {
  const product = catalogueBySlug(slug);
  if (!product) return null;
  const images = await bootstrapImages();
  const id = catalogueId(slug);
  const related = getRelatedCatalogueProducts(product, 3).map((item) => catalogueId(item.slug));
  return {
    features: product.features.map((feature, index) => ({
      id: id * 1000 + index,
      productId: id,
      title: feature.title,
      description: feature.description,
      icon: "CheckCircle2",
      displayOrder: index,
    })),
    specifications: product.specifications.map((specification, index) => ({
      id: id * 1000 + index,
      productId: id,
      specificationName: specification.label,
      specificationValue: specification.value,
      displayOrder: index,
    })),
    applications: product.applications.map((application, index) => ({
      id: id * 1000 + index,
      productId: id,
      application,
      title: null,
      description: null,
      image: null,
      imagePublicId: null,
      altText: null,
      displayOrder: index,
    })),
    images: await Promise.all(
      product.images.map(async (image, index) => ({
        id: id * 1000 + index,
        productId: id,
        imageUrl: await localImageFor(image.url, "racks"),
        cloudinaryPublicId: null,
        altText: image.alt || product.name,
        caption: image.caption || null,
        width: null,
        height: null,
        fileSize: null,
        displayOrder: index,
        createdAt: EPOCH,
      })),
    ),
    /*
     * Gallery slots for the offline fallback.
     *
     * The catalogue has no notion of the six-view grid, so the images are mapped
     * onto it in order: whatever the first catalogue shot is becomes the main
     * view, the second the installation, and so on. Any slot the catalogue
     * cannot fill is left out rather than padded with unrelated stock, which is
     * the same rule the renderer follows.
     */
    gallery: (
      await Promise.all(
        productGallerySlots.map(async (definition, index) => {
          const image = product.images[index];
          if (!image) return null;
          return {
            id: id * 1000 + index,
            productId: id,
            slot: definition.slot,
            imageUrl: await localImageFor(image.url, "racks"),
            cloudinaryPublicId: null,
            altText: image.alt || defaultGalleryAltText(definition.slot, product.name),
            caption: image.caption || defaultGalleryCaption(definition.slot, product.name),
            width: null,
            height: null,
            fileSize: null,
            displayOrder: productGalleryOrder(definition.slot),
            createdAt: EPOCH,
          };
        }),
      )
    ).filter((row): row is NonNullable<typeof row> => row !== null),
    related: related.filter(Boolean),
    industries: product.industries.map((name) => catalogueIndustryNames.indexOf(name) + 1).filter((index) => index > 0),
    fallbackImage: images.installation,
  };
}

type ServiceSeed = [name: string, slug: string, shortDescription: string, description: string, icon: string];

const serviceSeed: ServiceSeed[] = [
  ["Storage Planning", "storage-planning", "A clear storage plan before you buy anything.", "We look at your stock, space and growth plans, then suggest the right storage approach.", "ClipboardList"],
  ["Site Survey", "site-survey", "Accurate site details for a layout that fits.", "We measure your space and note columns, doors and access so the layout works on site.", "ScanLine"],
  ["Rack Design", "rack-design", "Rack designs made for your loads.", "We plan bay sizes, levels and accessories around your actual loads and handling method.", "DraftingCompass"],
  ["Warehouse Layout Planning", "warehouse-layout-planning", "A warehouse layout that flows well.", "We plan receiving, storage, picking and dispatch so goods move smoothly through your warehouse.", "Workflow"],
  ["Installation", "installation", "Clean, safe installation on site.", "Our team installs your system on schedule and hands it over ready to use.", "HardHat"],
  ["Warehouse Optimization", "warehouse-optimization", "Get more from your current warehouse.", "We review your space and storage habits, then suggest practical ways to improve.", "ChartNoAxesCombined"],
  ["Customized Storage Solutions", "customized-storage-solutions", "Custom storage for tricky spaces.", "If standard racks don't fit, we design a solution around your items, loads and site.", "Settings2"],
  ["After-Sales Support", "after-sales-support", "Support even after setup.", "We stay available for questions, changes and follow-up needs after installation.", "Headset"],
];

/** Industries come from the catalogue, so the offline list matches real content. */
const industrySeed: Array<[name: string, slug: string, shortDescription: string]> = catalogueIndustryNames.map((name) => [
  name,
  industrySlugOf(name),
  `Storage and material handling systems referenced in our catalogue for ${name.toLowerCase()} operations.`,
]);

export async function bootstrapServices(): Promise<StaticService[]> {
  return CORE_SERVICES.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    shortDescription: s.shortDescription,
    description: s.description,
    heroImage: s.heroImage,
    heroImagePublicId: s.heroImagePublicId,
    icon: s.icon,
    featured: s.featured,
    status: s.status,
    displayOrder: s.displayOrder,
    process: s.process,
    deliverables: s.deliverables,
    heroHeading: s.heroHeading,
    introHeading: s.introHeading,
    introDescription: s.introDescription,
    introBullets: s.introBullets,
    capabilities: s.capabilities,
    applications: s.applications,
    whyChoosePoints: s.whyChoosePoints,
    locationCoverage: s.locationCoverage,
    relatedProductSlugs: s.relatedProductSlugs,
    galleryImageIds: s.galleryImageIds,
    metaTitle: s.metaTitle,
    metaDescription: s.metaDescription,
    keywords: s.keywords,
    focusKeyword: s.focusKeyword,
    ogTitle: s.ogTitle,
    ogDescription: s.ogDescription,
    ogImage: s.ogImage,
    canonicalUrl: s.canonicalUrl,
    robotsIndex: s.robotsIndex,
    deletedAt: s.deletedAt,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
}

export function bootstrapServiceFeatures(serviceId: number): Array<{ id: number; serviceId: number; title: string; description: string; icon: string; displayOrder: number }> {
  const service = CORE_SERVICES.find((s) => s.id === serviceId);
  if (service && service.features.length > 0) {
    return service.features;
  }
  return [
    { id: serviceId * 100, serviceId, title: "Based on Your Needs", description: "We start with how you work — not a one-size-fits-all answer.", icon: "CheckCircle2", displayOrder: 0 },
    { id: serviceId * 100 + 1, serviceId, title: "Clear Planning", description: "Everything is agreed before work begins.", icon: "CheckCircle2", displayOrder: 1 },
    { id: serviceId * 100 + 2, serviceId, title: "Practical Results", description: "Our advice fits your real space and workflow.", icon: "CheckCircle2", displayOrder: 2 },
  ];
}

export async function bootstrapIndustries(): Promise<StaticIndustry[]> {
  const images = await bootstrapImages();
  return industrySeed.map(([name, slug, shortDescription], displayOrder) => {
    const serving = catalogueProducts.filter((product) => product.industries.includes(name));
    return {
      id: displayOrder + 1,
      name,
      slug,
      shortDescription,
      description: serving.length
        ? `Our catalogue lists ${serving.length} storage or material handling system${serving.length === 1 ? "" : "s"} referenced for ${name} operations, including ${serving
            .slice(0, 3)
            .map((product) => product.name)
            .join(", ")}.`
        : shortDescription,
      challenges: serving.slice(0, 3).map((product) => product.shortDescription),
      benefits: serving.slice(0, 3).flatMap((product) => product.features.slice(0, 1).map((feature) => feature.title)),
      heroImage: displayOrder % 2 ? images.warehouse : images.hero,
      icon: "Factory",
      status: "PUBLISHED",
      featured: serving.length > 0,
      displayOrder,
      metaTitle: `Storage Solutions for ${name} | Rack & Stack`,
      metaDescription: shortDescription,
      createdAt: EPOCH,
      updatedAt: EPOCH,
    };
  });
}

export async function bootstrapGallery(): Promise<StaticGalleryItem[]> {
  const images = await bootstrapImages();
  const items: Array<[string, string, ImageKey, string]> = [
    ["Pallet storage aisle", "Racking", "hero", "Palletized inventory stored in a warehouse racking aisle"],
    ["Industrial shelving", "Shelving", "shelving", "Industrial metal shelving in a clean warehouse"],
    ["Warehouse layout", "Warehouse", "warehouse", "Wide warehouse layout with organized storage"],
    ["Storage installation", "Installation", "installation", "Warehouse team coordinating storage installation"],
    ["Long-span storage", "Racking", "longspan", "Wide-span industrial storage for long materials"],
    ["Material handling", "Warehouse", "forklift", "Forklift in an industrial warehouse environment"],
  ];
  return items.map(([title, category, key, altText], displayOrder) => ({
    id: displayOrder + 1,
    title,
    category,
    imageUrl: images[key],
    cloudinaryPublicId: null,
    altText,
    description: null,
    width: null,
    height: null,
    fileSize: null,
    displayOrder,
    status: "PUBLISHED",
    createdAt: EPOCH,
    updatedAt: EPOCH,
  }));
}

export async function bootstrapHomeSections(): Promise<StaticHomeSection[]> {
  const images = await bootstrapImages();
  const sections: Array<Omit<StaticHomeSection, "id" | "createdAt" | "updatedAt">> = [
    {
      sectionKey: "hero",
      title: "SMART STORAGE. BUILT TO LAST.",
      subtitle: "Smart storage systems that help you save space, work faster and grow with ease.",
      content: { eyebrow: "Industrial storage systems", highlight: "BUILT TO LAST.", primaryCta: "View Our Products", secondaryCta: "Request a Quote", tertiaryCta: "Talk to Us", image: images.siteHero, badge: "Planned around your operation" },
      enabled: true,
      displayOrder: 0,
    },
    {
      sectionKey: "trust",
      title: "What You Can Count On",
      subtitle: "Every plan starts with your space, your loads and the way your team works.",
      content: { metrics: [{ value: "Site-Based", label: "Planning" }, { value: "Load-Based", label: "Configuration" }, { value: "Workflow-Based", label: "Layout" }, { value: "End-to-End", label: "Support" }] },
      enabled: true,
      displayOrder: 2,
    },
    {
      sectionKey: "about",
      title: "About Rack & Stack",
      subtitle: "Rack & Stack designs and installs complete storage systems — industrial racking, shelving, mezzanine floors, material handling and workplace storage. We start from how you actually operate, then plan the space, the system and the setup as one connected solution.\n\nWe plan around what you store, how you access it and how your team moves it — so the result handles capacity, safety and growth without making daily work harder.",
      content: { image: images.aisle, cta: "Explore Our Solutions" },
      enabled: true,
      displayOrder: 1,
    },
    {
      sectionKey: "offers",
      title: "What We Offer",
      subtitle: "We offer great service at a very competitive price and never compromise on quality.",
      content: { ctaLabel: "View All Systems", ctaHref: "/products" },
      enabled: true,
      displayOrder: 5,
    },
    {
      sectionKey: "why",
      title: "The Rack & Stack Difference",
      subtitle: "A simple, honest approach to space, load, access and setup.",
      content: { cards: [{ title: "Built Around You", description: "We start with what you store and how you move it." }, { title: "Makes Best Use of Space", description: "We plan around your building, services and clearances." }, { title: "Right Load Capacity", description: "We design based on your actual load data." }, { title: "Smooth Execution", description: "We plan installation and site needs from day one." }] },
      enabled: true,
      displayOrder: 4,
    },
    {
      sectionKey: "process",
      title: "How We Work",
      subtitle: "A simple, clear process from the first call to final handover.",
      content: { steps: [{ number: "01", title: "Discover", description: "We learn your needs, stock and workflow" }, { number: "02", title: "Survey", description: "We measure your site and note limits" }, { number: "03", title: "Design", description: "We pick the system and plan the layout" }, { number: "04", title: "Deliver", description: "We supply and coordinate installation" }] },
      enabled: true,
      displayOrder: 8,
    },
    {
      sectionKey: "manufacturing",
      title: "Built for Your Needs",
      subtitle: "Materials, build and finish all match the design we agree with you.",
      content: { image: images.installation, cta: "Discuss Your Requirement" },
      enabled: true,
      displayOrder: 9,
    },
    {
      sectionKey: "cta",
      title: "Setting Up a New Warehouse or Improving an Old One?",
      subtitle: "Tell us about your space and storage needs. We'll help you take the next step.",
      content: { primaryCta: "Request a Quote", secondaryCta: "Call +91 97692 67792" },
      enabled: true,
      displayOrder: 14,
    },
  ];
  return sections.map((section, index) => ({ ...section, id: index + 1, createdAt: EPOCH, updatedAt: EPOCH }));
}

export async function bootstrapSliders(): Promise<StaticHomeSlider[]> {
  const images = await bootstrapImages();
  const slides: Array<Omit<StaticHomeSlider, "id" | "createdAt" | "updatedAt" | "videoUrl" | "imagePublicId" | "mobileImagePublicId">> = [
    {
      eyebrow: "Industrial storage systems",
      title: "Industrial Storage Systems,",
      highlightedText: "MANUFACTURER. SUPPLY. INSTALLATION.",
      description: "Manufacturing-grade pallet racking, heavy duty shelving and mezzanine floors engineered for heavy loads, tight floorspace and continuous production output.",
      imageUrl: images.siteHero,
      mobileImageUrl: images.siteHero,
      imageAlt: "Industrial racking and storage systems installed across a manufacturing facility",
      primaryButtonText: "View Products",
      primaryButtonUrl: "/products",
      secondaryButtonText: "Request a Quote",
      secondaryButtonUrl: "/request-a-quote",
      tertiaryButtonText: "Talk to Us",
      tertiaryButtonUrl: "/contact",
      trustPoints: ["Site-based planning", "Load-based configuration", "Installation included"],
      status: "PUBLISHED",
      sortOrder: 0,
      overlayOpacity: 72,
      textAlignment: "left",
      autoplay: true,
      duration: 3500,
      startAt: null,
      endAt: null,
    },
    {
      eyebrow: "Space optimization",
      title: "Maximize Manufacturing Floor Space with Vertical Storage",
      highlightedText: "FROM FLOOR TO FULL.",
      description: "Racking, mezzanines and material handling systems that turn wasted ceiling height and floor area into organised, high-density manufacturing storage.",
      imageUrl: images.warehouse,
      mobileImageUrl: images.warehouse,
      imageAlt: "Wide warehouse layout with organised industrial storage",
      primaryButtonText: "Explore Solutions",
      primaryButtonUrl: "/products",
      secondaryButtonText: "Request a Quote",
      secondaryButtonUrl: "/request-a-quote",
      tertiaryButtonText: "Talk to Us",
      tertiaryButtonUrl: "/contact",
      trustPoints: ["Custom layouts", "Mezzanine & racking experts", "End-to-end support"],
      status: "PUBLISHED",
      sortOrder: 1,
      overlayOpacity: 72,
      textAlignment: "left",
      autoplay: true,
      duration: 3500,
      startAt: null,
      endAt: null,
    },
    {
      eyebrow: "Industrial racking & shelving",
      title: "Heavy Duty Racking Built for High-Output Manufacturing",
      highlightedText: "BUILT FOR YOUR OPERATION.",
      description: "Pallet racking, cantilever racks and reinforced shelving configured around your forklifts, loads and daily throughput for safe, efficient operation.",
      imageUrl: images.forklift,
      mobileImageUrl: images.forklift,
      imageAlt: "Forklift working alongside industrial pallet racking",
      primaryButtonText: "See Our Products",
      primaryButtonUrl: "/products",
      secondaryButtonText: "Request a Quote",
      secondaryButtonUrl: "/request-a-quote",
      tertiaryButtonText: "Talk to Us",
      tertiaryButtonUrl: "/contact",
      trustPoints: ["Engineered for your loads", "Fitted to your workflow", "Safety built in"],
      status: "PUBLISHED",
      sortOrder: 2,
      overlayOpacity: 72,
      textAlignment: "left",
      autoplay: true,
      duration: 3500,
      startAt: null,
      endAt: null,
    },
  ];
  return slides.map((slide, index) => ({
    ...slide,
    id: index + 1,
    imagePublicId: null,
    mobileImagePublicId: null,
    videoUrl: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  }));
}

export async function bootstrapPages(): Promise<StaticPage[]> {
  const images = await bootstrapImages();
  const aboutContent =
    "Rack & Stack Storage Systems provides industrial racking, shelving, mezzanine floors, material handling and workplace storage solutions. We start with your site, your stock, your loads and the way your team works. From there, we plan the layout, supply the system, coordinate installation and support you afterwards.\n\nWe believe the best storage plans make room for capacity, easy access, safety and future growth — all at the same time.";
  const pages: Array<Omit<StaticPage, "id" | "createdAt" | "updatedAt" | "heroImagePublicId">> = [
    {
      title: "About Rack & Stack",
      slug: "about",
      heroTitle: "Storage Built Around Your Business",
      heroDescription: "From the first site visit to final setup, we turn your storage needs into practical solutions.",
      heroImage: images.racks,
      content: aboutContent,
      metaTitle: "About Rack & Stack Storage Systems",
      metaDescription: "Learn about Rack & Stack's practical approach to storage planning and setup.",
      canonicalUrl: null,
      status: "PUBLISHED",
      deletedAt: null,
    },
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      heroTitle: "Privacy Policy",
      heroDescription: "How we handle information sent through this website.",
      heroImage: null,
      content: "We use the information you send through our forms to reply to you, send what you requested and run this website. We never sell your personal information. For any privacy questions, email us at info@rackandstack.in.",
      metaTitle: "Privacy Policy | Rack & Stack",
      metaDescription: "Rack & Stack website privacy policy.",
      canonicalUrl: null,
      status: "PUBLISHED",
      deletedAt: null,
    },
    {
      title: "Terms and Conditions",
      slug: "terms-and-conditions",
      heroTitle: "Terms and Conditions",
      heroDescription: "General terms for using this website.",
      heroImage: null,
      content: "The content on this website is for general information only. Product details, loading and project scope are confirmed in a formal proposal. Images may be for illustration only. Please don't treat website content as engineering approval for a specific installation.",
      metaTitle: "Terms and Conditions | Rack & Stack",
      metaDescription: "Terms governing use of the Rack & Stack website.",
      canonicalUrl: null,
      status: "PUBLISHED",
      deletedAt: null,
    },
    {
      title: "Cookie Policy",
      slug: "cookie-policy",
      heroTitle: "Cookie Policy",
      heroDescription: "Information about cookies on this website.",
      heroImage: null,
      content: "This website uses essential cookies to keep the site working and remember your preferences. Optional analytics are only enabled if you allow them.",
      metaTitle: "Cookie Policy | Rack & Stack",
      metaDescription: "Rack & Stack website cookie policy.",
      canonicalUrl: null,
      status: "PUBLISHED",
      deletedAt: null,
    },
  ];
  return pages.map((page, index) => ({ ...page, id: index + 1, heroImagePublicId: null, createdAt: EPOCH, updatedAt: EPOCH }));
}

export function bootstrapFaqs(): StaticFaq[] {
  const items: Array<[string, string]> = [
    ["What do you need to prepare a quote?", "Share any dimensions you have, item or pallet sizes, maximum loads, quantities, how often you access them, your handling equipment and any building limits. A site survey can help fill the gaps."],
    ["Can you set up a system in an existing warehouse?", "Yes. We review your columns, clear height, doors, services, movement paths and current operations before proposing a layout."],
    ["How do you calculate storage capacity?", "Capacity depends on item size, declared loads, system type, aisle space, handling equipment and the usable building area. We calculate it from your specific inputs."],
    ["Do you handle installation?", "Yes. Installation is included as part of the agreed project scope. We check site readiness before scheduling."],
  ];
  return items.map(([question, answer], displayOrder) => ({
    id: displayOrder + 1,
    question,
    answer,
    entityType: "GLOBAL",
    entityId: null,
    displayOrder,
    status: "PUBLISHED",
    createdAt: EPOCH,
    updatedAt: EPOCH,
  }));
}

export function bootstrapBlogCategories(): StaticBlogCategory[] {
  return [
    { id: 1, name: "Warehouse Optimization", slug: "warehouse-optimization" },
    { id: 2, name: "Storage Systems", slug: "storage-systems" },
    { id: 3, name: "Safety", slug: "safety" },
    { id: 4, name: "Space Planning", slug: "space-planning" },
    { id: 5, name: "Industry Guides", slug: "industry-guides" },
  ];
}

export async function bootstrapBlogPosts(): Promise<StaticBlogPost[]> {
  const images = await bootstrapImages();
  const posts: Array<Omit<StaticBlogPost, "id" | "createdAt" | "updatedAt" | "featuredImagePublicId" | "scheduledAt" | "authorId" | "publishedAt" | "featured" | "deletedAt" | "categoryId">> = [
    {
      title: "Getting Ready for a Pallet Racking Layout",
      slug: "prepare-for-pallet-racking-layout",
      excerpt: "The details that help us create a better first plan for you.",
      content: "A good racking plan starts with a few key details: pallet size, maximum weight, what you store and how much, your handling equipment, building drawings and how your team works. The clearer these are, the better the layout will fit your operation.\n\nAlso note sprinklers, lighting, columns, doors and any other building limits. The final design should be checked against all of this.",
      featuredImage: images.hero,
      status: "PUBLISHED",
      metaTitle: "Getting Ready for a Pallet Racking Layout",
      metaDescription: "Key details to gather before requesting a pallet racking layout.",
      keywords: "pallet racking layout",
      canonicalUrl: null,
    },
    {
      title: "Storage Density vs. Easy Access: Finding the Balance",
      slug: "storage-density-versus-accessibility",
      excerpt: "Why the layout with the most spaces isn't always the best one.",
      content: "More storage space is good — but so is easy access, short travel times and the right handling equipment. High-density storage works well for reserve stock, while direct-access shelving suits fast-moving items.\n\nA good plan sorts your inventory into groups and picks the right storage method for each — instead of forcing everything into one system.",
      featuredImage: images.aisle,
      status: "PUBLISHED",
      metaTitle: "Storage Density vs Easy Access",
      metaDescription: "How to balance warehouse storage capacity with easy inventory access.",
      keywords: "warehouse storage density",
      canonicalUrl: null,
    },
  ];
  return posts.map((post, index) => ({
    ...post,
    id: index + 1,
    categoryId: index + 1,
    authorId: null,
    featured: index === 0,
    publishedAt: EPOCH,
    scheduledAt: null,
    featuredImagePublicId: null,
    deletedAt: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  }));
}

export function bootstrapClientLogoNames() {
  return [
    "Bank of America",
    "Knight Frank",
    "Jaslok Hospital",
    "Mumbai Metro",
    "Eaton",
    "IDBI Bank",
    "Allcargo Logistics",
    "Schindler",
  ];
}

export async function bootstrapClientLogos(): Promise<StaticClientLogo[]> {
  return bootstrapClientLogoNames().map((name, index) => ({
    id: index + 1,
    name,
    imageUrl: "",
    imagePublicId: null,
    altText: `${name} logo`,
    sortOrder: index + 1,
    isActive: true,
    width: null,
    height: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  }));
}

export function bootstrapProjects(): StaticProject[] {
  return [];
}

export function bootstrapTestimonials(): StaticTestimonial[] {
  return [];
}

/**
 * No offline reel content. Shipping demo video URLs would mean the public site
 * depended on a third party before anyone had uploaded anything, and every card
 * would ship with a broken `<video>`. The showcase hides itself when empty, so
 * an unconfigured site simply has no video section.
 */
export function bootstrapVideos(): StaticVideo[] {
  return [];
}
