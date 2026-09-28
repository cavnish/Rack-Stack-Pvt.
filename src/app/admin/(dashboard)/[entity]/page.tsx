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
export default async function EntityListPage({params}:{params:Promise<{entity:string}>}){const {entity}=await params;if(!isAdminEntity(entity))notFound();const user=await requireUser();if(entity==="users"&&user.role!=="SUPER_ADMIN")redirect("/admin?error=permission");const rows=await listEntity(entity);const serialized=JSON.parse(JSON.stringify(rows));if(entity==="media")return <MediaManager initialItems={serialized} role={user.role} cloudinaryReady={Boolean(process.env.CLOUDINARY_CLOUD_NAME)}/>;if(entity==="client-logos")return <ClientLogoManager initialItems={serialized} role={user.role}/>;if(entity==="home-offer-cards"){const products=await getProducts();/* The picker previews the image the card will actually show, so it must resolve
     it the same way the homepage and the product page do rather than reading
     `thumbnail` off the row. */const [primaryImages,cataloguePrimaryImages]=await Promise.all([getPrimaryProductImages(products),getPrimaryCatalogueImages(catalogueProducts)]);return <HomeProductsManager initialCards={serialized as HomeProductCardRow[]} products={buildProductIndex({databaseProducts:products,primaryImages,catalogueProducts,cataloguePrimaryImages}).all} role={user.role}/>;}return <AdminTable entity={entity} initialRows={serialized} role={user.role}/>}
