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

export function getProductHref(slug: string) {
  const catalogueProduct = getCatalogueProductBySlug(slug);
  return catalogueProduct ? getCatalogueProductHref(catalogueProduct) : `/products/${slug}`;
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

export function adaptDatabaseRelated(product: DatabaseProduct): ProductPageRelated {
  const catalogueProduct = getCatalogueProductBySlug(product.slug);
  if (catalogueProduct) return adaptCatalogueRelated(catalogueProduct);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    href: getProductHref(product.slug),
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
  const firstImage = sourceImages.find((image) => image.imageUrl.trim())?.imageUrl ?? "";
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

export function adaptDatabaseProduct(product: LegacyProductDetail, folderImages: ProductPageImage[] = []): ProductPageProduct {
  const sourceImages: ProductPageImage[] = [
    ...folderImages,
    ...product.images.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText,
      caption: image.caption,
    })),
  ];
  const firstImage = folderImages[0]?.imageUrl ?? product.heroImage ?? product.thumbnail;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    href: getProductHref(product.slug),
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
