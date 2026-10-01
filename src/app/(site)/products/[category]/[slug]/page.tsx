import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProductBySlug } from "@/lib/data";
import { slugifySegment } from "@/lib/publish/media";
import { ProductPageView, buildProductMetadata, productStaticParams } from "@/components/site/product-page-view";

/**
 * `/products/<category>/<slug>` — the compatibility address for a product.
 *
 * This used to render a separate, hardcoded page built from the array in
 * `src/lib/catalogue.ts`, which is why `/products/office-storage/mobile-compactor-storage-system`
 * and `/products/mobile-compactor-storage-system` were two different pages for
 * one product, and only the second one showed the CMS content. It now resolves
 * the same CMS product and renders the same view, so the route the business
 * uses shows the real, editable record.
 *
 * `/products/<slug>` is the canonical address, and both build their metadata
 * through `buildProductMetadata`, so this form canonicalises to the flat one.
 *
 * The category is still checked, so `/products/office-storage/lockers` is a 404
 * rather than quietly serving lockers from the wrong shelf.
 */
export async function generateStaticParams() {
  return productStaticParams();
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ category: string; slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const [{ category, slug }, { preview }] = await Promise.all([params, searchParams]);
  const allowPreview = preview === "1" && Boolean(await getCurrentUser());

  // The same guard the page applies. Without it a wrong-category address such as
  // `/products/office-storage/slotted-angle-racks` would 404 while still
  // emitting a title and a canonical for the product it refused to serve.
  const product = await getProductBySlug(slug, allowPreview);
  if (!product || slugifySegment(product.category) !== category) return {};

  return buildProductMetadata(slug, allowPreview);
}

export default async function ProductCategoryPage({ params, searchParams }: { params: Promise<{ category: string; slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const [{ category, slug }, { preview }] = await Promise.all([params, searchParams]);
  const allowPreview = preview === "1" && Boolean(await getCurrentUser());

  const product = await getProductBySlug(slug, allowPreview);
  if (!product || slugifySegment(product.category) !== category) notFound();

  return <ProductPageView slug={slug} allowPreview={allowPreview} />;
}
