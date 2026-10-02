import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  // Previously `process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"`,
  // which advertised localhost to crawlers in production. See `lib/site-url`.
  const base = siteOrigin();
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] }], sitemap: `${base}/sitemap.xml`, host: base };
}
