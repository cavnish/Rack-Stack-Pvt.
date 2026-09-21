import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getClientLogos, getProductBySlug, getProducts, getRedirectPath, getServices, getSiteSettings } from "@/lib/data";
import { JsonLd } from "@/components/site/ui";
import { Reveal } from "@/components/site/reveal";
import { MobileProductActions } from "@/components/site/product-experience";
import { EventTracker } from "@/components/site/event-tracker";
import {
  ApplicationsSection, BenefitsSection, ClientRosterSection, ConfigurationsSection, FaqSection, FeaturesSection, FinalCtaSection, FinalEnquirySection,
  OverviewSection, ProductHero, ProductShowcaseSection, RealWorldSection, RelatedSection,
  TechnicalSpecificationsSection, WorkflowSection,
} from "@/components/site/product-sections";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
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
export default async function ProductPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const [{ slug }, { preview }] = await Promise.all([params, searchParams]);
  const allowPreview = preview === "1" && Boolean(await getCurrentUser());
  const product = await getProductBySlug(slug, allowPreview);
  if (!product) {
    const target = await getRedirectPath(`/products/${slug}`);
    if (target) redirect(target);
    notFound();
  }
  const [allProducts, allServices, settings, clientLogos] = await Promise.all([getProducts(), getServices(), getSiteSettings(), getClientLogos()]);
  const configProducts = product.configurations.length ? [] : allProducts.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 6);
  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.metaDescription || product.shortDescription,
    image: [product.heroImage, product.thumbnail, ...product.images.map((i) => i.imageUrl)].filter(Boolean),
    brand: { "@type": "Brand", name: "Rack & Stack Storage Systems" },
  };
  if (product.specifications.length) {
    productSchema.additionalProperty = product.specifications.map((s) => ({ "@type": "PropertyValue", name: s.specificationName, value: s.specificationValue }));
  }
  const faqSchema: Record<string, unknown> = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: product.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) };
  const breadcrumbSchema: Record<string, unknown> = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "/" }, { "@type": "ListItem", position: 2, name: "Products", item: "/products" }, { "@type": "ListItem", position: 3, name: product.name }] };
  return (
    <main>
      <EventTracker eventName="product_view" entityType="product" entityId={product.id} />
      <MobileProductActions slug={product.slug} />
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      {product.faqs.length > 0 && <JsonLd data={faqSchema} />}
      <ProductHero product={product} />
      {product.showSpecifications && product.specifications.length > 0 && <Reveal><TechnicalSpecificationsSection product={product} /></Reveal>}
      {product.showFeatures && <Reveal><FeaturesSection items={product.features} product={product} /></Reveal>}
      {product.showGallery && !product.showFeatures && <Reveal><ProductShowcaseSection product={product} /></Reveal>}
      <Reveal><OverviewSection product={product} /></Reveal>
      {product.showApplications && <Reveal><ApplicationsSection items={product.applications} product={product} /></Reveal>}
      <Reveal><ClientRosterSection logos={clientLogos} /></Reveal>
      {product.showConfigurations && <Reveal><ConfigurationsSection items={product.configurations} fallbackProducts={configProducts} /></Reveal>}
      {product.showBenefits && <Reveal><BenefitsSection items={product.benefits} /></Reveal>}
      <Reveal><WorkflowSection /></Reveal>
      {product.projects.length > 0 && <Reveal><RealWorldSection projects={product.projects} images={product.images} /></Reveal>}
      {product.showFaq && <Reveal><FaqSection items={product.faqs} /></Reveal>}
      {product.showRelated && <Reveal><RelatedSection items={product.related} /></Reveal>}
      <Reveal><FinalCtaSection product={product} /></Reveal>
      <FinalEnquirySection product={product} allProducts={allProducts} allServices={allServices} settings={settings} />
    </main>
  );
}