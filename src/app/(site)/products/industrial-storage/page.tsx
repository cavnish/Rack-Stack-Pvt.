import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogueCategoryPage } from "@/components/site/catalogue-category-page";
import { getCatalogueCategory, getCatalogueProductsByCategory } from "@/lib/catalogue";
import { getClientLogos } from "@/lib/data";

const category = getCatalogueCategory("industrial-storage");

export const metadata: Metadata = {
  title: "Industrial Storage Systems",
  description: "Explore slotted angle racks, long span shelving, pallet racking, multi-tier systems, mezzanine floors and cantilever racking.",
  alternates: { canonical: "/products/industrial-storage" },
  openGraph: {
    title: "Industrial Storage Systems",
    description: "Explore slotted angle racks, long span shelving, pallet racking, multi-tier systems, mezzanine floors and cantilever racking.",
    url: "/products/industrial-storage",
    siteName: "Rack & Stack Storage Systems",
    type: "website",
    images: category?.image ? [{ url: category.image, alt: category.name }] : [],
  },
  twitter: { card: "summary_large_image", title: "Industrial Storage Systems", description: "Explore slotted angle racks, long span shelving, pallet racking, multi-tier systems, mezzanine floors and cantilever racking." },
};

export default async function IndustrialStoragePage() {
  const logos = await getClientLogos();
  if (!category) notFound();
  return <CatalogueCategoryPage category={category} products={getCatalogueProductsByCategory(category.slug)} logos={logos} />;
}
