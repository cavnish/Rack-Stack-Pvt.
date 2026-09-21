import { notFound,redirect } from "next/navigation";
import { AdminTable } from "@/components/admin/admin-table";
import { ClientLogoManager } from "@/components/admin/client-logo-manager";
import { MediaManager } from "@/components/admin/media-manager";
import { isAdminEntity,listEntity } from "@/lib/admin-entities";
import { requireUser } from "@/lib/auth";
export default async function EntityListPage({params}:{params:Promise<{entity:string}>}){const {entity}=await params;if(!isAdminEntity(entity))notFound();const user=await requireUser();if(entity==="users"&&user.role!=="SUPER_ADMIN")redirect("/admin?error=permission");const rows=await listEntity(entity);const serialized=JSON.parse(JSON.stringify(rows));if(entity==="media")return <MediaManager initialItems={serialized} role={user.role} cloudinaryReady={Boolean(process.env.CLOUDINARY_CLOUD_NAME)}/>;if(entity==="client-logos")return <ClientLogoManager initialItems={serialized} role={user.role}/>;return <AdminTable entity={entity} initialRows={serialized} role={user.role}/>}
