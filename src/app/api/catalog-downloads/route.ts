import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { analyticsEvents, catalogDownloads, siteSettings } from "@/db/schema";
import { hasValidOrigin, rateLimit, requestKey } from "@/lib/rate-limit";
import { logActivity } from "@/lib/logger";

const leadSchema = z.object({
  name: z.string().trim().max(100).optional().default(""),
  company: z.string().trim().max(150).optional().default(""),
  email: z.union([z.email(), z.literal("")]).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  sourcePage: z.string().trim().max(300).optional().default("/catalog"),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  if (!rateLimit(requestKey(request, "catalog-download"), 10, 10 * 60_000).allowed) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 });
  try {
    const data = leadSchema.parse(await request.json());
    if (data.website) return NextResponse.json({ ok: true });
    const settings = (await db.select().from(siteSettings).limit(1))[0];
    if (!settings?.brochureUrl) return NextResponse.json({ error: "The current catalog is not available yet. Please contact our team." }, { status: 404 });
    if (settings.catalogLeadGated && (!data.name || !data.company || !data.email || !data.phone)) {
      return NextResponse.json({ error: "Name, company, email and phone are required for this catalog." }, { status: 400 });
    }
    const [download] = await db.insert(catalogDownloads).values({
      name: data.name || null,
      company: data.company || null,
      email: data.email || null,
      phone: data.phone || null,
      catalogUrl: settings.brochureUrl,
      sourcePage: data.sourcePage,
    }).returning();
    await db.insert(analyticsEvents).values({ eventName: "catalog_download", entityType: "catalog", entityId: String(download.id), path: data.sourcePage, consentLevel: data.email ? "lead" : "essential" });
    await logActivity("CATALOG_DOWNLOADED", "CATALOG", download.id);
    return NextResponse.json({ ok: true, reference: `CAT-${download.id}`, url: settings.brochureUrl });
  } catch {
    return NextResponse.json({ error: "Please check the details and try again." }, { status: 400 });
  }
}
