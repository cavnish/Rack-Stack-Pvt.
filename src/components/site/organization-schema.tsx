import { JsonLd } from "./ui";
import type { siteSettings } from "@/db/schema";
type Settings=typeof siteSettings.$inferSelect;
export function OrganizationSchema({settings}:{settings:Settings}){return <JsonLd data={{"@context":"https://schema.org","@type":["Organization","LocalBusiness"],name:settings.companyName,url:process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000",email:settings.email,telephone:settings.primaryPhone,address:{"@type":"PostalAddress",streetAddress:settings.address,addressRegion:"Maharashtra",postalCode:"401208",addressCountry:"IN"},openingHours:"Mo-Fr 09:00-18:00"}}/>}
