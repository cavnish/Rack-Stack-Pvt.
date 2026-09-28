import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogueCategoryPage } from "@/components/site/catalogue-category-page";
import { getPublicClientLogos } from "@/lib/client-assets";
import { getCatalogueCategory, getCatalogueProductsByCategory } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Material Handling Equipment | Rack & Stack",
  description: "Explore pallets, pallet trucks, dock levelers, stackers, cranes and lifting platforms for industrial material handling.",
};

export default async function MaterialHandlingPage() {
  const category = getCatalogueCategory("material-handling");
  if (!category) notFound();
  const logos = await getPublicClientLogos();
  return <CatalogueCategoryPage category={category} products={getCatalogueProductsByCategory(category.slug)} logos={logos} />;
}
