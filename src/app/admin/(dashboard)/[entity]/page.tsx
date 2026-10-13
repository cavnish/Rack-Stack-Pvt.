import { notFound, redirect } from "next/navigation";
import { AdminTable } from "@/components/admin/admin-table";
import { ClientLogoManager } from "@/components/admin/client-logo-manager";
import { HomeProductsManager } from "@/components/admin/home-product-manager";
import { HomepageSectionsManager, type HomepageSectionRow } from "@/components/admin/homepage-sections-manager";
import { HomeSliderManager, type HomeSliderItem } from "@/components/admin/home-slider-manager";
import { MediaManager } from "@/components/admin/media-manager";
import { isAdminEntity, listEntity } from "@/lib/admin-entities";
import { requireUser } from "@/lib/auth";
import { buildProductIndex, type HomeProductCardRow } from "@/lib/home-products";
import { catalogueProducts } from "@/lib/catalogue";
import { getProducts } from "@/lib/data";
import { getPrimaryProductImages, getPrimaryCatalogueImages } from "@/lib/product-primary-images";

export default async function EntityListPage({
  params,
  searchParams,
}: {
  params: Promise<{ entity: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { entity } = await params;
  if (!isAdminEntity(entity)) notFound();
  const user = await requireUser();
  if (entity === "users" && user.role !== "SUPER_ADMIN") redirect("/admin?error=permission");
  const rows = await listEntity(entity);
  const serialized = JSON.parse(JSON.stringify(rows));

  const saved = (await searchParams).saved;
  const notice = saved === "created" ? "Saved. The new record is on the list below." : saved === "updated" ? "Changes saved." : undefined;

  if (entity === "homepage") return <HomepageSectionsManager initialRows={serialized as HomepageSectionRow[]} role={user.role} notice={notice} />;
  if (entity === "home-slider") return <HomeSliderManager initialSlides={serialized as HomeSliderItem[]} role={user.role} notice={notice} />;
  if (entity === "media") return <MediaManager initialItems={serialized} role={user.role} cloudinaryReady={Boolean(process.env.CLOUDINARY_CLOUD_NAME)} />;
  if (entity === "client-logos") return <ClientLogoManager initialItems={serialized} role={user.role} />;
  if (entity === "home-offer-cards") {
    const products = await getProducts();
    const [primaryImages, cataloguePrimaryImages] = await Promise.all([
      getPrimaryProductImages(products),
      getPrimaryCatalogueImages(catalogueProducts),
    ]);
    return (
      <HomeProductsManager
        initialCards={serialized as HomeProductCardRow[]}
        products={buildProductIndex({ databaseProducts: products, primaryImages, catalogueProducts, cataloguePrimaryImages }).all}
        role={user.role}
      />
    );
  }
  return <AdminTable entity={entity} initialRows={serialized} role={user.role} notice={notice} />;
}
