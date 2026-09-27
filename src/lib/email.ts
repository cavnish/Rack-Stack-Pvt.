import "server-only";
import { Resend } from "resend";
import type { z } from "zod";
import type { inquirySchema } from "./validation";
import {
  CUSTOMER_PREHEADER,
  CUSTOMER_SUBJECT,
  customerConfirmationHtml,
  ownerNotificationHtml,
  type InquiryEmailData,
} from "./email-templates";

type Inquiry = z.infer<typeof inquirySchema>;

/**
 * Where an enquiry notification should go.
 *
 * `INQUIRY_NOTIFICATION_EMAIL` is the explicit override. The `ADMIN_EMAIL`
 * fallback is kept because a deployment that only set the admin login address
 * still gets its enquiries delivered, and the literal default means an
 * unconfigured deployment sends somewhere real and obvious rather than nowhere.
 */
function notificationRecipient(): string {
  return (
    process.env.INQUIRY_NOTIFICATION_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    "info@rackandstack.in"
  );
}

/**
 * Resend's shared testing sender.
 *
 * This address is only ever allowed to deliver to the Resend account owner's
 * own inbox. Any other recipient is rejected by the API with a 403
 * `validation_error`. That single restriction is the root cause of "the form
 * succeeds but no customer ever gets an email", so it is detected explicitly and
 * logged as a configuration fault rather than as a generic send failure.
 */
const RESEND_TEST_SENDER = "resend.dev";

function isSandboxSender(from: string): boolean {
  return from.toLowerCase().includes(`@${RESEND_TEST_SENDER}`) || from.toLowerCase().includes("onboarding@");
}

/**
 * Builds the display reference for an inquiry.
 *
 * Derived from the existing `inquiries.id` serial rather than a new column or a
 * second counter, so there is still exactly one identifier in the system and no
 * schema change was needed. `RST-<year>-<id padded to 5>` is a presentational
 * format of the primary key: sorting by it still sorts by insertion order, and
 * it always resolves back to a real row.
 */
function buildReference(id: number, date: Date): string {
  const year = date.getFullYear();
  return `RST-${year}-${String(id).padStart(5, "0")}`;
}

export type InquiryEmailOutcome = {
  /** The notification reached the Rack & Stack team. This is the one that matters operationally. */
  notificationDelivered: boolean;
  /** The acknowledgement reached the customer. Expected to fail on an unverified sender. */
  acknowledgementDelivered: boolean;
  reference: string;
  /** Resend message ids, when the corresponding send succeeded. */
  notificationId?: string;
  acknowledgementId?: string;
  /** Human-readable failure reasons, safe to log. Never contains the API key. */
  errors: string[];
  /** True when a misconfigured sender, not a transient fault, caused the failure. */
  configurationFault: boolean;
};

/**
 * Sends the two inquiry emails: a notification to the Rack & Stack team and a
 * confirmation to the customer.
 *
 * The templates own all presentation and all optional-field handling, so this
 * function only decides recipients, subjects and delivery. It is called
 * fire-and-forget from the API route, so a mail failure can never fail or roll
 * back the inquiry itself.
 *
 * The two sends are reported independently instead of being collapsed into one
 * success boolean. That distinction is the whole point: with an unverified
 * sender the customer acknowledgement fails while the team notification
 * succeeds, and a combined result hides exactly the fault worth knowing about.
 */
export async function sendInquiryEmails(
  inquiry: Inquiry,
  context: { inquiryId: number; productName?: string | null; serviceName?: string | null },
): Promise<InquiryEmailOutcome> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const recipient = notificationRecipient();
  const reference = buildReference(context.inquiryId, new Date());

  if (!apiKey || !from) {
    return {
      notificationDelivered: false,
      acknowledgementDelivered: false,
      reference,
      errors: ["Resend is not configured: set RESEND_API_KEY and RESEND_FROM_EMAIL."],
      configurationFault: true,
    };
  }

  const sandbox = isSandboxSender(from);
  const resend = new Resend(apiKey);
  const receivedAt = new Date();

  const data: InquiryEmailData = {
    reference,
    receivedAt,
    inquiryId: context.inquiryId,
    name: inquiry.name,
    email: inquiry.email,
    company: inquiry.company,
    phone: inquiry.phone,
    whatsapp: inquiry.whatsapp,
    location: inquiry.location ?? inquiry.city,
    productName: context.productName,
    serviceName: context.serviceName,
    // The visitor's own words, not the system-composed summary the database
    // stores, so the emails can show quantity/space/load as their own rows.
    message: inquiry.message,
    requirement: inquiry.requirement,
    quantity: inquiry.quantity,
    warehouseSize: inquiry.warehouseSize,
    loadRequirement: inquiry.loadRequirement,
    sourcePage: inquiry.sourcePage,
  };

  const customer = customerConfirmationHtml(data);
  const owner = ownerNotificationHtml(data);

  /**
   * `allSettled`, not `all`: the Resend SDK returns `{ error }` instead of
   * rejecting, so a rejected promise here means a network or SDK-level fault
   * rather than a rejected email, and one of those must not cancel the other
   * send before it is attempted.
   */
  const [adminResult, customerResult] = await Promise.allSettled([
    resend.emails.send({
      from,
      to: recipient,
      subject: owner.subject,
      html: owner.html,
      // Replying to the notification lands directly in the customer's inbox.
      replyTo: inquiry.email,
    }),
    resend.emails.send({
      from,
      to: inquiry.email,
      subject: CUSTOMER_SUBJECT,
      html: customer,
    }),
  ]);

  const errors: string[] = [];
  let notificationDelivered = false;
  let acknowledgementDelivered = false;
  let notificationId: string | undefined;
  let acknowledgementId: string | undefined;

  if (adminResult.status === "rejected") {
    errors.push(`notification threw: ${describe(adminResult.reason)}`);
  } else if (adminResult.value.error) {
    errors.push(`notification rejected by Resend: ${describe(adminResult.value.error)}`);
  } else {
    notificationDelivered = true;
    notificationId = adminResult.value.data?.id;
  }

  if (customerResult.status === "rejected") {
    errors.push(`acknowledgement threw: ${describe(customerResult.reason)}`);
  } else if (customerResult.value.error) {
    errors.push(`acknowledgement rejected by Resend: ${describe(customerResult.value.error)}`);
  } else {
    acknowledgementDelivered = true;
    acknowledgementId = customerResult.value.data?.id;
  }

  /**
   * A 403 from Resend is a configuration fault, not an outage: retrying will
   * never succeed. Naming it here means the server log says "verify a domain"
   * instead of leaving someone to decode an opaque Resend message at 3am.
   */
  const configurationFault = sandbox || errors.some((message) => message.includes("validation_error"));
  if (sandbox && errors.length > 0) {
    errors.push(
      `Sender "${from}" is Resend's test address and can only deliver to the account owner's inbox. Verify a domain at https://resend.com/domains and set RESEND_FROM_EMAIL to an address on it before customer mail can be delivered.`,
    );
  }

  return {
    notificationDelivered,
    acknowledgementDelivered,
    reference,
    notificationId,
    acknowledgementId,
    errors,
    configurationFault,
  };
}

/**
 * A short, log-safe description of a Resend error.
 *
 * Resend errors carry only a status, a code and a message — no credential — but
 * the message is still truncated so a verbose driver error cannot flood the
 * log, and the API key is never part of the object being stringified here.
 */
function describe(error: unknown): string {
  if (error && typeof error === "object") {
    const candidate = error as { statusCode?: unknown; name?: unknown; message?: unknown };
    const parts = [
      candidate.statusCode !== undefined ? `status ${String(candidate.statusCode)}` : null,
      candidate.name !== undefined ? String(candidate.name) : null,
      candidate.message !== undefined ? String(candidate.message) : null,
    ].filter(Boolean);
    if (parts.length) return parts.join(" / ").slice(0, 400);
  }
  return String(error).slice(0, 400);
}

export { CUSTOMER_SUBJECT, CUSTOMER_PREHEADER };
