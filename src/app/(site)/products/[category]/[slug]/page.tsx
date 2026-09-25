import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  catalogueCategorySlugs,
  catalogueProducts,
  getCatalogueProductBySlug,
  getRelatedCatalogueProducts,
} from "@/lib/catalogue";
import { CatalogueProductDetail, getCatalogueProductMetadata } from "@/components/site/catalogue-product-detail";

export function generateStaticParams() {
  return catalogueProducts.map((product) => ({ category: product.category, slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const product = getCatalogueProductBySlug(slug);
  if (!product || product.category !== category) return {};
  return getCatalogueProductMetadata(product);
}

export default async function CatalogueProductPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const validCategory = catalogueCategorySlugs.find((item) => item === category);
  const product = getCatalogueProductBySlug(slug);
  if (!validCategory || !product || product.category !== validCategory) notFound();

  return <CatalogueProductDetail product={product} relatedProducts={getRelatedCatalogueProducts(product, 3)} />;
}
