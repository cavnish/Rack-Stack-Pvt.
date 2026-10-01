import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogueCategoryPage } from "@/components/site/catalogue-category-page";
import { getCatalogueCategory, getCatalogueProductsByCategory } from "@/lib/catalogue";
import { getClientLogos } from "@/lib/data";

export const metadata: Metadata = {
  title: "Material Handling Equipment | Rack & Stack",
  description: "Explore pallets, pallet trucks, dock levelers, stackers, cranes and lifting platforms for industrial material handling.",
};

export default async function MaterialHandlingPage() {
  const category = getCatalogueCategory("material-handling");
  if (!category) notFound();
  const logos = await getClientLogos();
  return <CatalogueCategoryPage category={category} products={getCatalogueProductsByCategory(category.slug)} logos={logos} />;
}
