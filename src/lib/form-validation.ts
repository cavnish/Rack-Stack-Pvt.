/**
 * Client-side validation shared by the enquiry and quote forms.
 *
 * The server (`src/lib/validation.ts`) stays the authority — these rules exist
 * so a visitor is told what is wrong *before* a request is sent, instead of
 * after a round trip. Two reasons that matters here beyond politeness:
 *
 * 1. `/api/inquiries` rate-limits to 5 attempts per 10 minutes per IP, so an
 *    invalid submission is not a free retry — it burns a real attempt.
 * 2. The API deliberately returns a single generic message for validation
 *    failures, so a form that only renders `body.error` can never tell the
 *    visitor which field to fix.
 *
 * Every rule here is mirrored by `inquirySchema` on the server. Keep them in
 * step: a rule that exists here but not there lets an invalid enquiry past the
 * browser only to be rejected after a round trip, and a rule that exists there
 * but not here fails to protect the visitor from a 422 they cannot act on.
 */

/** Field keys, matching the `name` attributes on the form controls. */
export type FieldName =
  | "name"
  | "company"
  | "email"
  | "phone"
  | "whatsapp"
  | "location"
  | "message";

import { isValidEmail, isValidPhone } from "./contact-format";

export type FieldErrors = Partial<Record<FieldName, string>>;

/** Re-exported so a component can check one value without importing two modules. */
export { isValidEmail, isValidPhone };

/**
 * Validates the fields the enquiry form marks as required.
 *
 * `whatsapp` and `location` are optional in the UI, but if the visitor typed
 * *something* into them it still has to be usable — a half-typed WhatsApp
 * number is a follow-up call the sales team cannot make, and it would be
 * stored verbatim into the database and the notification email.
 *
 * @returns An object keyed by field name. Empty means the form is submittable.
 */
export function validateInquiryFields(values: Record<FieldName, string>): FieldErrors {
  const errors: FieldErrors = {};

  const name = values.name.trim();
  if (!name) errors.name = "Please enter your name.";
  else if (name.length < 2) errors.name = "Please enter at least 2 characters.";

  const company = values.company.trim();
  if (!company) errors.company = "Please enter your company name.";
  else if (company.length < 2) errors.company = "Please enter at least 2 characters.";

  const email = values.email.trim();
  if (!email) errors.email = "Please enter your email address.";
  else if (!isValidEmail(email)) errors.email = "Please enter a valid email address.";

  const phone = values.phone.trim();
  if (!phone) errors.phone = "Please enter your phone number.";
  else if (!isValidPhone(phone)) errors.phone = "Please enter a valid phone number (7–15 digits).";

  const whatsapp = values.whatsapp.trim();
  if (whatsapp && !isValidPhone(whatsapp)) {
    errors.whatsapp = "Please enter a valid WhatsApp number, or leave it blank.";
  }

  const message = values.message.trim();
  if (!message) errors.message = "Please tell us about your requirement.";
  else if (message.length < 3) errors.message = "Please add a little more detail (3 characters or more).";

  return errors;
}

/** True when the first invalid field, in DOM order, can take focus. */
export const FIELD_ORDER: FieldName[] = ["name", "company", "email", "phone", "whatsapp", "location", "message"];

export function firstInvalidField(errors: FieldErrors): FieldName | null {
  return FIELD_ORDER.find((field) => Boolean(errors[field])) ?? null;
}
