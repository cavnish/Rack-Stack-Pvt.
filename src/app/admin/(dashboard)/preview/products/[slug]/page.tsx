import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProductBySlug } from "@/lib/data";
import { ProductPageView } from "@/components/site/product-page-view";

/**
 * `/admin/preview/products/<slug>` — the preview of an unpublished product.
 *
 * This used to be `?preview=1` on the public product URL. Reading `searchParams`
 * and the session cookie on the public route is what forced `/products/[slug]`
 * and `/products/[category]/[slug]` to render on every request instead of being
 * static, so a single admin query string cost every visitor a database read per
 * page view. Preview now lives here instead: this route is behind the Admin
 * layout's `requireUser()`, and the public route is static.
 */
export const dynamic = "force-dynamic";

export default async function AdminProductPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  // `requireUser()` in the admin layout already redirected an anonymous visitor.
  // This second check is what makes the preview safe rather than merely hidden:
  // it is the guard `allowPreview` used to be.
  if (!(await getCurrentUser())) notFound();

  const { slug } = await params;
  const product = await getProductBySlug(slug, true);
  if (!product) notFound();

  return <ProductPageView slug={slug} allowPreview />;
}