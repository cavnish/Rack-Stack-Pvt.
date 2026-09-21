import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireUser } from "@/lib/auth";
export const dynamic="force-dynamic";
export default async function AdminLayout({children}:{children:ReactNode}){const user=await requireUser();return <AdminShell user={{name:user.name,email:user.email,role:user.role}}>{children}</AdminShell>}
