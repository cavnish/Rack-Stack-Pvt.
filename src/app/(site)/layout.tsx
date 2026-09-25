import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { SiteLoader } from "@/components/site/site-loader";
import { CookieConsent } from "@/components/site/cookie-consent";
import { FloatingActions } from "@/components/site/floating-actions";
import { OrganizationSchema } from "@/components/site/organization-schema";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  if (!settings) notFound();

  return (
    <>
      <SiteLoader />
      <OrganizationSchema settings={settings} />
      <Header phone={settings.primaryPhone} whatsapp={settings.whatsapp} />
      {children}
      <Footer settings={settings} />
      <CookieConsent />
      <FloatingActions phone={settings.primaryPhone} whatsapp={settings.whatsapp} />
    </>
  );
}
