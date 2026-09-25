import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogueCategoryPage } from "@/components/site/catalogue-category-page";
import { getCatalogueCategory, getCatalogueProductsByCategory } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Office Storage Systems | Rack & Stack",
  description: "Explore mobile compactors, filing cabinets, office cupboards, pedestals, tables and lockers for organised office storage.",
};

export default function OfficeStoragePage() {
  const category = getCatalogueCategory("office-storage");
  if (!category) notFound();
  return <CatalogueCategoryPage category={category} products={getCatalogueProductsByCategory(category.slug)} />;
}
