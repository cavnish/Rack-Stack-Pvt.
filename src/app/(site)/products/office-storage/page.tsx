import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogueCategoryPage } from "@/components/site/catalogue-category-page";
import { getPublicClientLogos } from "@/lib/client-assets";
import { getCatalogueCategory, getCatalogueProductsByCategory } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Office Storage Systems | Rack & Stack",
  description: "Explore mobile compactors, filing cabinets, office cupboards, pedestals, tables and lockers for organised office storage.",
};

export default async function OfficeStoragePage() {
  const category = getCatalogueCategory("office-storage");
  if (!category) notFound();
  const logos = await getPublicClientLogos();
  return <CatalogueCategoryPage category={category} products={getCatalogueProductsByCategory(category.slug)} logos={logos} />;
}
