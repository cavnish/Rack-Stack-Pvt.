import type { products as productTable } from "@/db/schema";
import type { getProductBySlug } from "@/lib/data";
import {
  catalogueCategoryNames,
  catalogueCategorySlugs,
  catalogueProducts,
  getCatalogueProductBySlug,
  getCatalogueProductHref,
  getCatalogueProductType,
  type CatalogueProduct,
} from "@/lib/catalogue";

type DatabaseProduct = typeof productTable.$inferSelect;
type LegacyProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export type ProductPageImage = {
  id: string | number;
  imageUrl: string;
  altText: string;
  caption: string | null;
};

export type ProductPageFeature = {
  id: string | number;
  title: string;
  description: string;
};

export type ProductPageSpecification = {
  id: string | number;
  specificationName: string;
  specificationValue: string;
};

export type ProductPageApplication = {
  id: string | number;
  application: string;
  title: string | null;
  description: string | null;
  image: string | null;
  altText: string | null;
};

export type ProductPageConfiguration = {
  id: string | number;
  title: string;
  description: string | null;
  image: string | null;
};

export type ProductPageBenefit = {
  id: string | number;
  title: string;
  description: string;
};

export type ProductPageProject = {
  id: string | number;
  slug: string;
  title: string;
  coverImage: string | null;
  description: string | null;
  industry: string | null;
};

export type ProductPageFaq = {
  id: string | number;
  question: string;
  answer: string;
};

export type ProductPageRelated = {
  id: string | number;
  name: string;
  slug: string;
  href: string;
  category: string;
  shortDescription: string;
  thumbnail?: string | null;
  heroImage?: string | null;
};

export type ProductPageProduct = {
  id: string | number;
  name: string;
  slug: string;
  href: string;
  category: string;
  categoryLabel: string;
  productType?: string;
  featured?: boolean;
  status?: string;
  heroTitle?: string | null;
  heroDescription?: string | null;
  shortDescription: string;
  description: string;
  longDescription: string | null;
  heroImage: string | null;
  thumbnail: string | null;
  /**
   * The admin-managed gallery, active rows only, in editor order.
   *
   * This is the list the product page renders as its gallery and the head of
   * which is the product's main image. It is empty for catalogue products,
   * which have no CMS record, and for a CMS product whose editor has not added
   * any images yet.
   */
  gallery: ProductPageImage[];
  images: ProductPageImage[];
  features: ProductPageFeature[];
  specifications: ProductPageSpecification[];
  applications: ProductPageApplication[];
  configurations: ProductPageConfiguration[];
  benefits: ProductPageBenefit[];
  projects: ProductPageProject[];
  faqs: ProductPageFaq[];
  related: ProductPageRelated[];
  industries: string[];
  variants: string[];
  useDefaultFeatureFillers: boolean;
  showGallery: boolean;
  showFeatures: boolean;
  showSpecifications: boolean;
  showConfigurations: boolean;
  showApplications: boolean;
  showBenefits: boolean;
  showFaq: boolean;
  showRelated: boolean;
};

export type ProductOption = {
  id: string | number;
  name: string;
  slug: string;
};

function categoryLabel(category: string) {
  if (catalogueCategorySlugs.includes(category as (typeof catalogueCategorySlugs)[number])) {
    return catalogueCategoryNames[category as keyof typeof catalogueCategoryNames];
  }
  return category
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * The canonical URL for a CMS product, from a database row.
 *
 * CMS products live at the flat `/products/{slug}` route, which is what
 * `generateMetadata` already publishes as their canonical and what
 * `/products/[category]` resolves. They deliberately do *not* get the
 * `/products/{category}/{slug}` shape: that route only serves catalogue products
 * and 404s unless the category matches, so a category form is a dead link for a
 * CMS product.
 */
export function getDatabaseProductHref(slug: string) {
  return `/products/${slug}`;
}

/**
 * Resolves a URL from a bare slug.
 *
 * Catalogue first, because a slug is only unambiguous when it is not also a CMS
 * slug. Where a slug exists in *both* systems — `mezzanine-floor`,
 * `slotted-angle-racks` and `mobile-compactor-storage-system` do — the answer
 * depends on which record you actually hold, so anything resolving a known CMS
 * product must call `getDatabaseProductHref` with the row's slug instead. The two
 * records are different products and their pages are genuinely different.
 */
export function getProductHref(slug: string) {
  const catalogueProduct = getCatalogueProductBySlug(slug);
  return catalogueProduct ? getCatalogueProductHref(catalogueProduct) : getDatabaseProductHref(slug);
}

function adaptCatalogueRelated(product: CatalogueProduct): ProductPageRelated {
  const image = product.images.find((item) => item.url)?.url ?? "";
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    href: getCatalogueProductHref(product),
    category: product.category,
    shortDescription: product.shortDescription,
    thumbnail: image,
    heroImage: image,
  };
}

export /**
 * Adapts a CMS product for a "related" list.
 *
 * The row is always a CMS product, so it is always adapted as one — both for
 * its copy and for its URL. Deferring to a same-slug catalogue entry here would
 * have been self-contradictory: the card would show a different product's name
 * and open that product's page, while the row came from the CMS.
 */
function adaptDatabaseRelated(product: DatabaseProduct): ProductPageRelated {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    href: getDatabaseProductHref(product.slug),
    category: product.category,
    shortDescription: product.shortDescription,
    thumbnail: product.thumbnail,
    heroImage: product.heroImage,
  };
}

export function adaptCatalogueProduct(product: CatalogueProduct, relatedProducts: readonly CatalogueProduct[] = [], folderImages: ProductPageImage[] = []): ProductPageProduct {
  const catalogueImages: ProductPageImage[] = product.images.map((image, index) => ({
    id: `${product.id}-image-${index}`,
    imageUrl: image.url,
    altText: image.alt,
    caption: image.caption,
  }));
  const sourceImages: ProductPageImage[] = folderImages.length > 0 ? [...folderImages, ...catalogueImages] : catalogueImages;
  const firstImage = getPrimaryProductImage({ images: sourceImages });
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    href: getCatalogueProductHref(product),
    category: product.category,
    categoryLabel: catalogueCategoryNames[product.category],
    productType: getCatalogueProductType(product),
    featured: product.featured,
    status: "PUBLISHED",
    heroTitle: product.name,
    heroDescription: product.shortDescription,
    shortDescription: product.shortDescription,
    description: product.longDescription || product.shortDescription,
    longDescription: product.longDescription,
    heroImage: firstImage,
    thumbnail: firstImage,
    gallery: [],
    images: sourceImages.map((image, index) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText || `${product.name} image ${index + 1}`,
      caption: image.caption || `${product.name} image ${index + 1}`,
    })),
    features: product.features.map((feature, index) => ({ id: `${product.id}-feature-${index}`, ...feature })),
    specifications: product.specifications.map((specification, index) => ({
      id: `${product.id}-specification-${index}`,
      specificationName: specification.label,
      specificationValue: specification.value,
    })),
    applications: product.applications.map((application, index) => ({
      id: `${product.id}-application-${index}`,
      application,
      title: application,
      description: null,
      image: null,
      altText: null,
    })),
    configurations: product.variants.map((variant, index) => ({
      id: `${product.id}-configuration-${index}`,
      title: variant,
      description: null,
      image: null,
    })),
    benefits: [],
    projects: [],
    faqs: [],
    related: relatedProducts.map(adaptCatalogueRelated),
    industries: product.industries,
    variants: product.variants,
    useDefaultFeatureFillers: false,
    showGallery: true,
    showFeatures: true,
    showSpecifications: true,
    showConfigurations: true,
    showApplications: true,
    showBenefits: true,
    showFaq: true,
    showRelated: true,
  };
}

/**
 * Image #1 for a product — the single definition of a product's primary image.
 *
 * A product's images live in one ordered list: the admin-managed gallery first,
 * then the images on its record, then — only for a product with neither — the
 * media assets in its product folder. The product page renders the head of that
 * list as the primary image, and the homepage card asks this function for the
 * same value, so the two cannot drift apart.
 *
 * `gallery` leads deliberately. It is the list an editor reorders in the admin,
 * so moving an image to the top must move the main image on the hero, the card
 * and the homepage at the same time — which is only true if that list is
 * consulted first. `product_images` is the older, narrower list kept for
 * compatibility, and `folderImages` is a last resort that keeps a product with
 * no CMS images from rendering a blank card.
 *
 * `heroImage`/`thumbnail` are consulted before `folderImages` for the same
 * reason: an explicit column is a deliberate choice, a scanned folder is not.
 */
export function getPrimaryProductImage(
  product: {
    heroImage?: string | null;
    thumbnail?: string | null;
    images?: readonly { imageUrl?: string | null }[] | null;
    gallery?: readonly { imageUrl?: string | null }[] | null;
  },
  folderImages: readonly { imageUrl?: string | null }[] = [],
): string {
  const ordered = [...(product.gallery ?? []), ...(product.images ?? [])];
  for (const image of ordered) {
    const url = typeof image?.imageUrl === "string" ? image.imageUrl.trim() : "";
    if (url) return url;
  }
  const hero = typeof product.heroImage === "string" ? product.heroImage.trim() : "";
  if (hero) return hero;
  const thumbnail = typeof product.thumbnail === "string" ? product.thumbnail.trim() : "";
  if (thumbnail) return thumbnail;
  for (const image of folderImages) {
    const url = typeof image?.imageUrl === "string" ? image.imageUrl.trim() : "";
    if (url) return url;
  }
  return "";
}

/**
 * The admin-managed gallery as renderable images.
 *
 * Only active rows reach the page, and `displayOrder` — which is the position
 * the editor arranged them in — is the order they appear in. A row is dropped
 * only if it has no URL, which cannot happen for a stored row but guards a
 * half-filled row an editor has typed into and not yet uploaded.
 */
function toGalleryImages(rows: LegacyProductDetail["gallery"]): ProductPageImage[] {
  return rows
    .filter((row) => row.isActive !== false && row.imageUrl.trim())
    .map((row) => ({
      id: row.id,
      imageUrl: row.imageUrl,
      altText: row.altText,
      caption: row.caption,
    }));
}

export function adaptDatabaseProduct(product: LegacyProductDetail, folderImages: ProductPageImage[] = []): ProductPageProduct {
  const gallery = toGalleryImages(product.gallery);
  const sourceImages: ProductPageImage[] = [
    ...folderImages,
    ...product.images.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText,
      caption: image.caption,
    })),
  ];
  const firstImage = getPrimaryProductImage({ ...product, gallery }, folderImages);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    href: getDatabaseProductHref(product.slug),
    category: product.category,
    categoryLabel: categoryLabel(product.category),
    productType: undefined,
    featured: product.featured,
    status: product.status,
    heroTitle: product.heroTitle,
    heroDescription: product.heroDescription,
    shortDescription: product.shortDescription,
    description: product.description,
    longDescription: product.longDescription,
    heroImage: firstImage,
    thumbnail: firstImage,
    gallery,
    images: sourceImages.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText,
      caption: image.caption,
    })),
    features: product.features.map((feature) => ({ id: feature.id, title: feature.title, description: feature.description })),
    specifications: product.specifications.map((specification) => ({
      id: specification.id,
      specificationName: specification.specificationName,
      specificationValue: specification.specificationValue,
    })),
    applications: product.applications.map((application) => ({
      id: application.id,
      application: application.application,
      title: application.title,
      description: application.description,
      image: application.image,
      altText: application.altText,
    })),
    configurations: product.configurations.map((configuration) => ({
      id: configuration.id,
      title: configuration.title,
      description: configuration.description,
      image: configuration.image,
    })),
    benefits: product.benefits.map((benefit) => ({ id: benefit.id, title: benefit.title, description: benefit.description })),
    projects: product.projects.map((project) => ({
      id: project.id,
      slug: project.slug,
      title: project.title,
      coverImage: project.coverImage,
      description: project.description,
      industry: project.industry,
    })),
    faqs: product.faqs.map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answer })),
    related: product.related.map(adaptDatabaseRelated),
    industries: product.industries.map((industry) => industry.name),
    variants: [],
    useDefaultFeatureFillers: true,
    showGallery: product.showGallery,
    showFeatures: product.showFeatures,
    showSpecifications: product.showSpecifications,
    showConfigurations: product.showConfigurations,
    showApplications: product.showApplications,
    showBenefits: product.showBenefits,
    showFaq: product.showFaq,
    showRelated: product.showRelated,
  };
}

export function getProductOptions(databaseProducts: readonly DatabaseProduct[] = []) {
  const options: ProductOption[] = [];
  const seen = new Set<string>();
  for (const product of catalogueProducts) {
    if (seen.has(product.slug)) continue;
    seen.add(product.slug);
    options.push({ id: product.id, name: product.name, slug: product.slug });
  }
  for (const product of databaseProducts) {
    if (seen.has(product.slug)) continue;
    seen.add(product.slug);
    options.push({ id: product.id, name: product.name, slug: product.slug });
  }
  return options;
}
