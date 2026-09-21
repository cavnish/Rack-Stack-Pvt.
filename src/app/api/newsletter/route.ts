import { NextResponse } from "next/server";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { newsletterSchema } from "@/lib/validation";
import { hasValidOrigin, rateLimit, requestKey } from "@/lib/rate-limit";
export async function POST(request: Request) { if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 }); if (!rateLimit(requestKey(request, "newsletter"), 5, 60_000).allowed) return NextResponse.json({ error: "Please wait before trying again" }, { status: 429 }); try { const data = newsletterSchema.parse(await request.json()); if (!data.website) await db.insert(newsletterSubscribers).values({ email: data.email.toLowerCase() }).onConflictDoUpdate({ target: newsletterSubscribers.email, set: { isActive: true } }); return NextResponse.json({ ok: true }, { status: 201 }); } catch { return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 }); } }
