import "server-only";
import { Resend } from "resend";
import type { z } from "zod";
import type { inquirySchema } from "./validation";

type Inquiry = z.infer<typeof inquirySchema>;
function clean(value: unknown) { return String(value ?? "—").replace(/[<>]/g, ""); }
export async function sendInquiryEmails(inquiry: Inquiry, productName?: string, serviceName?: string) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return { delivered: false, reason: "Resend not configured" };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const recipient = process.env.INQUIRY_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL ?? "info@rackandstack.in";
  const detail = `<h2>New website inquiry</h2><p><b>Name:</b> ${clean(inquiry.name)}</p><p><b>Company:</b> ${clean(inquiry.company)}</p><p><b>Email:</b> ${clean(inquiry.email)}</p><p><b>Phone:</b> ${clean(inquiry.phone)}</p><p><b>Product:</b> ${clean(productName)}</p><p><b>Service:</b> ${clean(serviceName)}</p><p><b>Requirement:</b> ${clean(inquiry.requirement)}</p><p><b>Message:</b> ${clean(inquiry.message)}</p>`;
  const [admin, customer] = await Promise.all([
    resend.emails.send({ from: process.env.RESEND_FROM_EMAIL, to: recipient, subject: `New requirement from ${clean(inquiry.company)}`, html: detail, replyTo: inquiry.email }),
    resend.emails.send({ from: process.env.RESEND_FROM_EMAIL, to: inquiry.email, subject: "Your requirement has been received | Rack & Stack", html: `<h2>Thank you, ${clean(inquiry.name)}.</h2><p>Our team has received your requirement and will review the information provided. We will contact you shortly to understand the next steps.</p><p>Rack & Stack Storage Systems Pvt. Ltd.</p>` }),
  ]);
  return { delivered: true, admin, customer };
}
