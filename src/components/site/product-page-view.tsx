import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProductBySlug, getProductCatalogue, getProductReelVideos, getProducts, getRedirectPath, getServices, type ProductDetail } from "@/lib/data";
import { getPublicClientLogos } from "@/lib/client-assets";
import { JsonLd } from "@/components/site/ui";
import { ProductSectionsLayout } from "@/components/site/product-sections";
import { adaptDatabaseProduct, adaptDatabaseRelated, getProductOptions } from "@/lib/product-page";
import { getProductFolderImages } from "@/lib/product-image-assets";
import { getCatalogueProductBySlug, getCatalogueProductHref } from "@/lib/catalogue";
import { slugifySegment } from "@/lib/publish/media";

/**
 * Resolves a product slug to a published CMS product.
 *
 * Every product on the site is a row in `products` now, so this is the single
 * answer to "which product is this URL". The fallbacks are for slugs that
 * predate the current set: a slug that still only exists in the catalogue is
 * redirected to its canonical address, and a slug with a stored redirect is
 * honoured, so no previously published URL 404s.
 */
async function resolveProduct(slug: string, allowPreview: boolean): Promise<ProductDetail> {
  const product = await getProductBySlug(slug, allowPreview);
  if (product) return product;

  // Only a slug with no CMS product of its own may fall through. Checking the
  // catalogue first would hand every shared slug to it and silently retire the
  // CMS record.
  const catalogueProduct = getCatalogueProductBySlug(slug);
  if (catalogueProduct) redirect(getCatalogueProductHref(catalogueProduct));
  const target = await getRedirectPath(`/products/${slug}`);
  if (target) redirect(target);
  notFound();
}

/**
 * A product page, for either of the two addresses a product answers to.
 *
 * `/products/<slug>` and `/products/<category>/<slug>` are the same product, so
 * they are rendered by the same component. Both routes existed for years with
 * their own markup, which is how the category URL ended up serving a thin,
 * hardcoded page while the flat URL served the full one: the same product had
 * two different pages, and only one of them showed the CMS content. Sharing the
 * view is what makes an Admin edit appear on whichever URL a visitor landed on.
 */
export async function ProductPageView({ slug, allowPreview }: { slug: string; allowPreview: boolean }) {
  const product = await resolveProduct(slug, allowPreview);

  const [databaseProducts, allServices, clientLogos, reels] = await Promise.all([
    getProducts(),
    getServices(),
    getPublicClientLogos(),
    getProductReelVideos(product.slug, 6),
  ]);
  const folderImages = await getProductFolderImages(product.slug, product.name);
  const pageProduct = adaptDatabaseProduct(product, folderImages);

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.metaDescription || product.shortDescription,
    image: [pageProduct.heroImage, pageProduct.thumbnail, ...pageProduct.images.map((image) => image.imageUrl)].filter(Boolean),
    brand: { "@type": "Brand", name: "Rack & Stack Storage Systems" },
  };
  if (product.specifications.length) {
    productSchema.additionalProperty = product.specifications.map((specification) => ({ "@type": "PropertyValue", name: specification.specificationName, value: specification.specificationValue }));
  }
  const faqSchema: Record<string, unknown> = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: product.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
  const breadcrumbSchema: Record<string, unknown> = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "/" }, { "@type": "ListItem", position: 2, name: "Products", item: "/products" }, { "@type": "ListItem", position: 3, name: product.name }] };

  return (
    <main>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      {product.faqs.length > 0 ? <JsonLd data={faqSchema} /> : null}
      <ProductSectionsLayout
        product={pageProduct}
        logos={clientLogos}
        allProducts={getProductOptions(databaseProducts)}
        allServices={allServices}
        reels={reels}
      />
    </main>
  );
}

/**
 * The `<head>` for a product, for either address.
 *
 * The canonical URL is the category form because that is the one the mega menu,
 * the listing and the category pages link to, and the one the business uses
 * publicly. Sending the flat address there as well stops the two addresses
 * being indexed as separate pages for the same product.
 */
export async function buildProductMetadata(slug: string, allowPreview: boolean): Promise<Metadata> {
  const product = await getProductBySlug(slug, allowPreview);
  if (!product) return {};

  const ogImage = product.ogImage || product.heroImage || product.images[0]?.imageUrl || product.thumbnail || undefined;
  const title = product.metaTitle || product.name;
  const description = product.metaDescription || product.shortDescription;
  const canonical = product.canonicalUrl || `/products/${slugifySegment(product.category)}/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: product.robotsIndex, follow: product.robotsIndex },
    openGraph: { title: product.ogTitle || title, description: product.ogDescription || description, url: canonical, siteName: "Rack & Stack Storage Systems", type: "website", images: ogImage ? [ogImage] : [] },
    twitter: { card: "summary_large_image", title: product.ogTitle || title, description: product.ogDescription || description, images: ogImage ? [ogImage] : [] },
  };
}

/** Every address a published product answers to, for static generation. */
export async function productStaticParams(): Promise<{ category: string; slug: string }[]> {
  const [products, categories] = await Promise.all([getProducts(), getProductCatalogue()]);
  const seen = new Set<string>();
  const params: { category: string; slug: string }[] = [];

  for (const product of products) {
    if (seen.has(product.slug)) continue;
    seen.add(product.slug);
    params.push({ category: slugifySegment(product.category), slug: product.slug });
  }
  for (const category of categories) {
    if (seen.has(category.category)) continue;
    seen.add(category.category);
    params.push({ category: category.category, slug: category.category });
  }
  return params;
}

export { adaptDatabaseRelated };
