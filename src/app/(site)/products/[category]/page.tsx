import { getCurrentUser } from "@/lib/auth";
import { getProducts, getProductCatalogue } from "@/lib/data";
import { slugifySegment } from "@/lib/publish/media";
import { ProductPageView, buildProductMetadata, productStaticParams } from "@/components/site/product-page-view";

/**
 * `/products/<slug>` — the flat address a product answers to.
 *
 * The same product is also served at `/products/<category>/<slug>`, and both
 * render {@link ProductPageView}, so there is one product page rather than a
 * full one and a thin one.
 */
export async function generateStaticParams() {
  const [products, categories] = await Promise.all([getProducts(), getProductCatalogue()]);
  const slugs = new Set<string>();
  for (const product of products) slugs.add(product.slug);
  for (const category of categories) slugs.add(slugifySegment(category.category));
  return [...slugs].map((slug) => ({ category: slug }));
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<{ preview?: string }> }) {
  const [{ category: slug }, { preview }] = await Promise.all([params, searchParams]);
  const allowPreview = preview === "1" && Boolean(await getCurrentUser());
  return buildProductMetadata(slug, allowPreview);
}

export default async function ProductPageRoute({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<{ preview?: string }> }) {
  const [{ category: slug }, { preview }] = await Promise.all([params, searchParams]);
  const allowPreview = preview === "1" && Boolean(await getCurrentUser());
  return <ProductPageView slug={slug} allowPreview={allowPreview} />;
}
