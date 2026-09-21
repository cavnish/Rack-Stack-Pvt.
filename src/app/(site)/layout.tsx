import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CookieConsent } from "@/components/site/cookie-consent";
import { FloatingActions } from "@/components/site/floating-actions";
import { OrganizationSchema } from "@/components/site/organization-schema";
import { getProducts,getSiteSettings } from "@/lib/data";
export const dynamic="force-dynamic";
export default async function SiteLayout({children}:{children:ReactNode}){const [settings,products]=await Promise.all([getSiteSettings(),getProducts()]);if(!settings)notFound();return <><OrganizationSchema settings={settings}/><Header products={products} phone={settings.primaryPhone} whatsapp={settings.whatsapp}/>{children}<Footer settings={settings}/><CookieConsent/><FloatingActions phone={settings.primaryPhone} whatsapp={settings.whatsapp}/></>}
