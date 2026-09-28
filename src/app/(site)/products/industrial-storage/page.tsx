import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogueCategoryPage } from "@/components/site/catalogue-category-page";
import { getPublicClientLogos } from "@/lib/client-assets";
import { getCatalogueCategory, getCatalogueProductsByCategory } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Industrial Storage Systems | Rack & Stack",
  description: "Explore slotted angle racks, long span shelving, pallet racking, multi-tier systems, mezzanine floors and cantilever racking.",
};

export default async function IndustrialStoragePage() {
  const category = getCatalogueCategory("industrial-storage");
  if (!category) notFound();
  const logos = await getPublicClientLogos();
  return <CatalogueCategoryPage category={category} products={getCatalogueProductsByCategory(category.slug)} logos={logos} />;
}
