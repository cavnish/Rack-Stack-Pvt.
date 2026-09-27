import { NextResponse } from "next/server";
import { db } from "@/db";
import { inquiries, products, services } from "@/db/schema";
import { inquirySchema } from "@/lib/validation";
import { hasValidOrigin, rateLimit, requestKey } from "@/lib/rate-limit";
import { sendInquiryEmails } from "@/lib/email";
import { logActivity, logServer } from "@/lib/logger";
import { eq } from "drizzle-orm";
import { getCatalogueProductBySlug } from "@/lib/catalogue";

export async function POST(request: Request) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const limit = rateLimit(requestKey(request, "inquiry"), 5, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 600) } },
    );
  }

  /**
   * The honeypot is checked against the raw body, before schema parsing.
   *
   * `inquirySchema` caps `website` at 0 characters, so a filled honeypot used
   * to fail validation and answer a bot with 422 — a distinguishable response
   * that tells a scraper the field is watched. Reading it raw lets a bot get
   * the same `ok` a human gets while nothing is stored or mailed.
   */
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (typeof body === "object" && body !== null && (body as { website?: unknown }).website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    /**
     * 422 with per-field messages rather than the previous blanket 400.
     *
     * These are this schema's own messages, all written for the visitor, so
     * nothing internal (driver output, column names) is exposed. The form uses
     * them to mark individual inputs, which is what makes a rejected submission
     * fixable instead of merely reported. Messages are de-duplicated because a
     * field can collect one per failing check, and a repeated identical string
     * just reads as a glitch.
     */
    const fields: Record<string, string[]> = {};
    for (const [field, messages] of Object.entries(parsed.error.flatten().fieldErrors)) {
      const unique = Array.from(new Set(messages));
      if (unique.length) fields[field] = unique;
    }
    logServer("warn", "inquiry.invalid", { fields: Object.keys(fields) });
    return NextResponse.json(
      { error: "Please check the highlighted fields and try again.", fields },
      { status: 422 },
    );
  }
  const data = parsed.data;

  try {
    const catalogueProduct = data.productSlug ? getCatalogueProductBySlug(data.productSlug) : undefined;
    const [product, service] = await Promise.all([
      data.productId ? db.select({ name: products.name }).from(products).where(eq(products.id, data.productId)).then((result) => result[0]) : null,
      data.serviceId ? db.select({ name: services.name }).from(services).where(eq(services.id, data.serviceId)).then((result) => result[0]) : null,
    ]);
    const resolvedProductName = product?.name ?? catalogueProduct?.name ?? data.productName;
    /**
     * `inquiries.requirement` is NOT NULL, and the schema leaves it optional so
     * a caller that sends only `message` is not rejected. The visitor's own
     * message is the correct fallback — it is what they actually asked for.
     */
    const requirement = data.requirement?.trim() || data.message;
    const messageDetails = [
      data.message,
      resolvedProductName ? `Product: ${resolvedProductName}` : "",
      data.quantity ? `Quantity: ${data.quantity}` : "",
      data.location ? `Location: ${data.location}` : "",
      data.warehouseSize ? `Available space: ${data.warehouseSize}` : "",
      data.loadRequirement ? `Load requirement: ${data.loadRequirement}` : "",
    ].filter(Boolean).join("\n");

    const [inquiry] = await db.insert(inquiries).values({
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      city: data.location || data.city || null,
      state: data.state || null,
      requirement,
      warehouseSize: data.warehouseSize || null,
      loadRequirement: data.loadRequirement || null,
      productId: data.productId || null,
      serviceId: data.serviceId || null,
      message: messageDetails || null,
      sourcePage: data.sourcePage || null,
    }).returning();

    await logActivity("INQUIRY_CREATED", "INQUIRY", inquiry.id);
    /**
     * Fire-and-forget: a mail outage must not fail an inquiry the visitor has
     * already submitted, since the row is persisted and visible in the admin
     * dashboard. The raw form values are passed, not the composed
     * `messageDetails`, so the emails present quantity, space and load as
     * separate fields instead of one pre-formatted blob.
     *
     * Failures are logged from the returned outcome rather than from a rejected
     * promise: `sendInquiryEmails` reports per-recipient results instead of
     * throwing, because "the team was not notified" and "the customer
     * acknowledgement bounced" are different incidents needing different fixes,
     * and only the first one is an outage. `errors` holds only Resend's own
     * status, code and message — never the API key.
     */
    sendInquiryEmails(data, {
      inquiryId: inquiry.id,
      productName: resolvedProductName,
      serviceName: service?.name,
    })
      .then((outcome) => {
        if (outcome.errors.length === 0) {
          logServer("info", "inquiry.email_sent", {
            inquiryId: inquiry.id,
            reference: outcome.reference,
            notificationId: outcome.notificationId,
            acknowledgementId: outcome.acknowledgementId,
          });
          return;
        }
        logServer(outcome.configurationFault ? "error" : "warn", "inquiry.email_failed", {
          inquiryId: inquiry.id,
          reference: outcome.reference,
          notificationDelivered: outcome.notificationDelivered,
          acknowledgementDelivered: outcome.acknowledgementDelivered,
          // Included on the failure path too: when the notification *did* go
          // out, its Resend id is what lets the message be traced in the
          // Resend dashboard, which is the only proof it reached the inbox.
          notificationId: outcome.notificationId,
          configurationFault: outcome.configurationFault,
          errors: outcome.errors,
        });
      })
      .catch((error) =>
        logServer("error", "inquiry.email_threw", {
          inquiryId: inquiry.id,
          error: error instanceof Error ? error.message : "unknown",
        }),
      );
    return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 });
  } catch (error) {
    /**
     * A database failure is a server fault, not a form fault. It is logged in
     * full server-side and reported to the browser as a bare 500 so the visitor
     * is not shown a driver message, and their submitted values are still in
     * the form for a retry.
     */
    logServer("error", "inquiry.persist_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "We could not save your enquiry right now. Please try again in a moment." },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
