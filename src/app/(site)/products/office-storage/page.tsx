import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogueCategoryPage } from "@/components/site/catalogue-category-page";
import { getCatalogueCategory, getCatalogueProductsByCategory } from "@/lib/catalogue";
import { getClientLogos } from "@/lib/data";

const category = getCatalogueCategory("office-storage");

export const metadata: Metadata = {
  title: "Office Storage Systems",
  description: "Explore mobile compactors, filing cabinets, office cupboards, pedestals, tables and lockers for organised office storage.",
  alternates: { canonical: "/products/office-storage" },
  openGraph: {
    title: "Office Storage Systems",
    description: "Explore mobile compactors, filing cabinets, office cupboards, pedestals, tables and lockers for organised office storage.",
    url: "/products/office-storage",
    siteName: "Rack & Stack Storage Systems",
    type: "website",
    images: category?.image ? [{ url: category.image, alt: category.name }] : [],
  },
  twitter: { card: "summary_large_image", title: "Office Storage Systems", description: "Explore mobile compactors, filing cabinets, office cupboards, pedestals, tables and lockers for organised office storage." },
};

export default async function OfficeStoragePage() {
  const logos = await getClientLogos();
  if (!category) notFound();
  return <CatalogueCategoryPage category={category} products={getCatalogueProductsByCategory(category.slug)} logos={logos} />;
}
