import { notFound,redirect } from "next/navigation";
import { AdminTable } from "@/components/admin/admin-table";
import { ClientLogoManager } from "@/components/admin/client-logo-manager";
import { HomeProductsManager } from "@/components/admin/home-product-manager";
import { MediaManager } from "@/components/admin/media-manager";
import { isAdminEntity,listEntity } from "@/lib/admin-entities";
import { requireUser } from "@/lib/auth";
import { buildProductIndex, type HomeProductCardRow } from "@/lib/home-products";
import { catalogueProducts } from "@/lib/catalogue";
import { getProducts } from "@/lib/data";
import { getPrimaryProductImages, getPrimaryCatalogueImages } from "@/lib/product-primary-images";
export default async function EntityListPage({params,searchParams}:{params:Promise<{entity:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {entity}=await params;if(!isAdminEntity(entity))notFound();const user=await requireUser();if(entity==="users"&&user.role!=="SUPER_ADMIN")redirect("/admin?error=permission");const rows=await listEntity(entity);const serialized=JSON.parse(JSON.stringify(rows));/* The editor redirects here with `?saved=…` after a successful write, so the
   list can say so rather than looking unchanged. Without it a save is silent:
   the form disappears and the table is exactly as it was. */
   const saved=(await searchParams).saved;const notice=saved==="created"?"Saved. The new record is on the list below.":saved==="updated"?"Changes saved.":undefined;
   if(entity==="media")return <MediaManager initialItems={serialized} role={user.role} cloudinaryReady={Boolean(process.env.CLOUDINARY_CLOUD_NAME)}/>;if(entity==="client-logos")return <ClientLogoManager initialItems={serialized} role={user.role}/>;if(entity==="home-offer-cards"){const products=await getProducts();/* The picker previews the image the card will actually show, so it must resolve
     it the same way the homepage and the product page do rather than reading
     `thumbnail` off the row. */const [primaryImages,cataloguePrimaryImages]=await Promise.all([getPrimaryProductImages(products),getPrimaryCatalogueImages(catalogueProducts)]);return <HomeProductsManager initialCards={serialized as HomeProductCardRow[]} products={buildProductIndex({databaseProducts:products,primaryImages,catalogueProducts,cataloguePrimaryImages}).all} role={user.role}/>;}return <AdminTable entity={entity} initialRows={serialized} role={user.role} notice={notice}/>}
