import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProductBySlug, getProducts, getRedirectPath, getServices } from "@/lib/data";
import { getPublicClientLogos } from "@/lib/client-assets";
import { JsonLd } from "@/components/site/ui";
import { ProductSectionsLayout } from "@/components/site/product-sections";
import { adaptDatabaseProduct, adaptDatabaseRelated, getProductOptions } from "@/lib/product-page";
import { getProductFolderImages } from "@/lib/product-image-assets";
import { getCatalogueProductBySlug, getCatalogueProductHref } from "@/lib/catalogue";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const item = await getProductBySlug(slug);
  if (!item) return {};
  const ogImage = item.ogImage || item.heroImage || item.images[0]?.imageUrl || item.thumbnail || undefined;
  const title = item.metaTitle || item.name;
  const description = item.metaDescription || item.shortDescription;
  return {
    title,
    description,
    alternates: { canonical: item.canonicalUrl || `/products/${item.slug}` },
    robots: { index: item.robotsIndex, follow: item.robotsIndex },
    openGraph: { title: item.ogTitle || title, description: item.ogDescription || description, url: `/products/${item.slug}`, siteName: "Rack & Stack Storage Systems", type: "website", images: ogImage ? [ogImage] : [] },
    twitter: { card: "summary_large_image", title: item.ogTitle || title, description: item.ogDescription || description, images: ogImage ? [ogImage] : [] },
  };
}

export default async function LegacyProductPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<{ preview?: string }> }) {
  const [{ category: slug }, { preview }] = await Promise.all([params, searchParams]);
  const catalogueProduct = getCatalogueProductBySlug(slug);
  if (catalogueProduct) redirect(getCatalogueProductHref(catalogueProduct));
  const allowPreview = preview === "1" && Boolean(await getCurrentUser());
  const product = await getProductBySlug(slug, allowPreview);
  if (!product) {
    const target = await getRedirectPath(`/products/${slug}`);
    if (target) redirect(target);
    notFound();
  }
  const [databaseProducts, allServices, clientLogos] = await Promise.all([getProducts(), getServices(), getPublicClientLogos()]);
  const folderImages = await getProductFolderImages(product.slug, product.name);
  const pageProduct = adaptDatabaseProduct(product, folderImages);
  const configurationProducts = product.configurations.length
    ? []
    : databaseProducts.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 6).map(adaptDatabaseRelated);
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
        configurationProducts={configurationProducts}
      />
    </main>
  );
}
