import { NextResponse } from "next/server";
import { db } from "@/db";
import { inquiries, products, services } from "@/db/schema";
import { inquirySchema } from "@/lib/validation";
import { hasValidOrigin, rateLimit, requestKey } from "@/lib/rate-limit";
import { sendInquiryEmails } from "@/lib/email";
import { logActivity, logServer } from "@/lib/logger";
import { eq } from "drizzle-orm";
export async function POST(request: Request) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  if (!rateLimit(requestKey(request, "inquiry"), 5, 10 * 60_000).allowed) return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  try {
    const data = inquirySchema.parse(await request.json());
    if (data.website) return NextResponse.json({ ok: true });
    const [inquiry] = await db.insert(inquiries).values({ name: data.name, company: data.company, email: data.email, phone: data.phone, whatsapp: data.whatsapp || null, city: data.city || null, state: data.state || null, requirement: data.requirement, warehouseSize: data.warehouseSize || null, loadRequirement: data.loadRequirement || null, productId: data.productId || null, serviceId: data.serviceId || null, message: data.message || null, sourcePage: data.sourcePage || null }).returning();
    const [product, service] = await Promise.all([
      data.productId ? db.select({ name: products.name }).from(products).where(eq(products.id, data.productId)).then((r) => r[0]) : null,
      data.serviceId ? db.select({ name: services.name }).from(services).where(eq(services.id, data.serviceId)).then((r) => r[0]) : null,
    ]);
    await logActivity("INQUIRY_CREATED", "INQUIRY", inquiry.id);
    sendInquiryEmails(data, product?.name, service?.name).catch((error) => logServer("error", "inquiry.email_failed", { inquiryId: inquiry.id, error: error instanceof Error ? error.message : "unknown" }));
    return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 });
  } catch (error) {
    logServer("warn", "inquiry.invalid", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }
}
