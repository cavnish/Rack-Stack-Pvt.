import type { Metadata } from "next";
import { getProducts, getServices } from "@/lib/data";
import { getPublicClientLogos } from "@/lib/client-assets";
import { JsonLd } from "@/components/site/ui";
import { ProductSectionsLayout } from "@/components/site/product-sections";
import { adaptCatalogueProduct, getProductOptions } from "@/lib/product-page";
import { getProductFolderImages } from "@/lib/product-image-assets";
import { catalogueCategoryNames, getCatalogueProductHref, type CatalogueProduct } from "@/lib/catalogue";

type CatalogueProductDetailProps = {
  product: CatalogueProduct;
  relatedProducts: readonly CatalogueProduct[];
};

export async function CatalogueProductDetail({ product, relatedProducts }: CatalogueProductDetailProps) {
  const [databaseProducts, allServices, logos] = await Promise.all([getProducts(), getServices(), getPublicClientLogos()]);
  const folderImages = await getProductFolderImages(product.slug, product.name);
  const pageProduct = adaptCatalogueProduct(product, relatedProducts, folderImages);
  const productHref = getCatalogueProductHref(product);
  const categoryHref = `/products/${product.category}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  const productUrl = siteUrl ? `${siteUrl}${productHref}` : productHref;
  const categoryName = catalogueCategoryNames[product.category];
  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seo.description || product.shortDescription,
    category: categoryName,
    url: productUrl,
    image: pageProduct.images.map((image) => image.imageUrl).filter(Boolean),
    brand: { "@type": "Brand", name: "Rack & Stack Storage Systems" },
    additionalProperty: product.specifications.map((specification) => ({
      "@type": "PropertyValue",
      name: specification.label,
      value: specification.value,
    })),
  };
  const breadcrumbSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Products", item: "/products" },
      { "@type": "ListItem", position: 3, name: categoryName, item: categoryHref },
      { "@type": "ListItem", position: 4, name: product.name, item: productUrl },
    ],
  };

  return (
    <main>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ProductSectionsLayout
        product={pageProduct}
        logos={logos}
        allProducts={getProductOptions(databaseProducts)}
        allServices={allServices}
        entityType="catalogue_product"
      />
    </main>
  );
}

export function getCatalogueProductMetadata(product: CatalogueProduct): Metadata {
  return {
    title: product.seo.title,
    description: product.seo.description,
    alternates: { canonical: getCatalogueProductHref(product) },
    openGraph: {
      title: product.seo.ogTitle,
      description: product.seo.ogDescription,
      url: getCatalogueProductHref(product),
      siteName: "Rack & Stack Storage Systems",
      type: "website",
      images: [{ url: product.seo.ogImage, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.seo.ogTitle,
      description: product.seo.ogDescription,
      images: [product.seo.ogImage],
    },
  };
}

