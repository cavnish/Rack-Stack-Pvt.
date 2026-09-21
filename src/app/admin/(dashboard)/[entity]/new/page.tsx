import { notFound,redirect } from "next/navigation";
import { EntityEditor } from "@/components/admin/entity-editor";
import { isAdminEntity, listEntity } from "@/lib/admin-entities";
import { requireUser } from "@/lib/auth";
const disabled=new Set(["inquiries","contact-messages","activity","media","seo","settings"]);
export default async function NewEntityPage({params}:{params:Promise<{entity:string}>}){const {entity}=await params;if(!isAdminEntity(entity)||disabled.has(entity))notFound();const user=await requireUser();if(entity==="users"&&user.role!=="SUPER_ADMIN")redirect("/admin?error=permission");const relationOptions=entity==="products"?await Promise.all([listEntity("products"),listEntity("industries"),listEntity("projects")]).then(([products,industries,projects])=>({products:(products as Array<{id:number;name:string}>).map(({id,name})=>({id,name})),industries:(industries as Array<{id:number;name:string}>).map(({id,name})=>({id,name})),projects:(projects as Array<{id:number;title:string}>).map(({id,title})=>({id,title}))})):undefined;return <EntityEditor entity={entity} relationOptions={relationOptions}/>}
