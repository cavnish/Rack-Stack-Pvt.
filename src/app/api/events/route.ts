import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { hasValidOrigin, rateLimit, requestKey } from "@/lib/rate-limit";

const eventSchema = z.object({
  eventName: z.enum(["product_view", "project_view", "quote_started", "whatsapp_click", "phone_click"]),
  entityType: z.string().trim().max(40).optional(),
  entityId: z.string().trim().max(100).optional(),
  path: z.string().trim().max(300).optional(),
  consent: z.literal("all"),
});

export async function POST(request: Request) {
  if (!hasValidOrigin(request)) return NextResponse.json({ ok: true });
  if (!rateLimit(requestKey(request, "analytics-event"), 40, 60_000).allowed) return NextResponse.json({ ok: true });
  try {
    const event = eventSchema.parse(await request.json());
    await db.insert(analyticsEvents).values({ eventName: event.eventName, entityType: event.entityType, entityId: event.entityId, path: event.path, consentLevel: event.consent });
  } catch {
    // Analytics must never interrupt the visitor experience.
  }
  return NextResponse.json({ ok: true });
}
