import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogueCategoryPage } from "@/components/site/catalogue-category-page";
import { getCatalogueCategory, getCatalogueProductsByCategory } from "@/lib/catalogue";
import { getClientLogos } from "@/lib/data";

const category = getCatalogueCategory("material-handling");

export const metadata: Metadata = {
  title: "Material Handling Equipment",
  description: "Explore pallets, pallet trucks, dock levelers, stackers, cranes and lifting platforms for industrial material handling.",
  alternates: { canonical: "/products/material-handling" },
  openGraph: {
    title: "Material Handling Equipment",
    description: "Explore pallets, pallet trucks, dock levelers, stackers, cranes and lifting platforms for industrial material handling.",
    url: "/products/material-handling",
    siteName: "Rack & Stack Storage Systems",
    type: "website",
    images: category?.image ? [{ url: category.image, alt: category.name }] : [],
  },
  twitter: { card: "summary_large_image", title: "Material Handling Equipment", description: "Explore pallets, pallet trucks, dock levelers, stackers, cranes and lifting platforms for industrial material handling." },
};

export default async function MaterialHandlingPage() {
  const logos = await getClientLogos();
  if (!category) notFound();
  return <CatalogueCategoryPage category={category} products={getCatalogueProductsByCategory(category.slug)} logos={logos} />;
}
