/**
 * Email and phone format rules, shared by the browser form and the server
 * schema.
 *
 * These live in their own module with no `"use client"` and no `"server-only"`
 * precisely so both sides can import them. Duplicating the rules meant the two
 * copies could disagree — a leading "(" is a normal way to write an area code,
 * and the client regex rejected "(022) 1234 5678" while the server accepted it,
 * so the form refused a number the API would have taken. One definition cannot
 * drift.
 */

/**
 * Phone shape: an optional leading "+", then digits and the punctuation people
 * actually type. A leading "(" is allowed so a bracketed area code passes.
 *
 * This is deliberately a *shape* check only. Whether there are enough real
 * digits is decided by the digit count below, so a string of nothing but
 * brackets and spaces cannot pass.
 */
export const PHONE_SHAPE_PATTERN = /^\+?[\d(][\d\s().-]{5,24}$/;

/** ITU-T E.164 allows 15 digits maximum; 7 is the shortest sensible national number. */
export const MIN_PHONE_DIGITS = 7;
export const MAX_PHONE_DIGITS = 15;

/**
 * Deliberately permissive.
 *
 * The server uses Zod's `z.email()`, which only requires `local@domain.tld`.
 * Anything stricter here (rejecting `a@b.co.in`, unicode local parts, long TLDs)
 * would reject addresses the server would happily accept.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= 254 && EMAIL_PATTERN.test(trimmed);
}

export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!PHONE_SHAPE_PATTERN.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
}
