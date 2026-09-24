import { NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactSchema } from "@/lib/validation";
import { hasValidOrigin, rateLimit, requestKey } from "@/lib/rate-limit";
import { logActivity } from "@/lib/logger";
export async function POST(request: Request) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  if (!rateLimit(requestKey(request, "contact"), 5, 10 * 60_000).allowed) return NextResponse.json({ error: "Too many submissions" }, { status: 429 });
  try { const data = contactSchema.parse(await request.json()); if (data.website) return NextResponse.json({ ok: true }); const [item] = await db.insert(contactMessages).values({ name: data.name, email: data.email, phone: data.phone || null, company: data.company || null, subject: data.subject, message: data.message }).returning(); await logActivity("CONTACT_CREATED", "CONTACT_MESSAGE", item.id); return NextResponse.json({ ok: true }, { status: 201 }); }
  catch { return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 }); }
}
