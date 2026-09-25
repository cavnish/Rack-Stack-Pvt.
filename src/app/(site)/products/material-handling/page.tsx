import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogueCategoryPage } from "@/components/site/catalogue-category-page";
import { getCatalogueCategory, getCatalogueProductsByCategory } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Material Handling Equipment | Rack & Stack",
  description: "Explore pallets, pallet trucks, dock levelers, stackers, cranes and lifting platforms for industrial material handling.",
};

export default function MaterialHandlingPage() {
  const category = getCatalogueCategory("material-handling");
  if (!category) notFound();
  return <CatalogueCategoryPage category={category} products={getCatalogueProductsByCategory(category.slug)} />;
}
