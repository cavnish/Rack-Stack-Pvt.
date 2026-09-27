/**
 * Instagram Reel URL handling.
 *
 * This module is the single place an Instagram URL is ever turned into markup.
 * It is deliberately dependency-free and import-safe from both the client bundle
 * and the server, because the same rules have to hold in the admin form (fast
 * feedback) and in the admin API (the one that actually matters).
 *
 * The rule everywhere is the same: a CMS value may only ever contribute a
 * shortcode. Nothing else about the URL is trusted, and no string from the CMS
 * is ever treated as HTML or as an arbitrary iframe target.
 */

/** Hosts Instagram actually serves Reels from. Anything else is rejected. */
const ALLOWED_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]);

/**
 * Instagram shortcodes are base64url-ish: letters, digits, underscore and
 * hyphen. Anchored and length-bounded so a crafted value cannot smuggle in a
 * path, a query string or a second host.
 */
const SHORTCODE = /^[A-Za-z0-9_-]{5,40}$/;

export type InstagramRef = {
  /** Normalised shortcode, e.g. `DdddS0npcgW`. Safe to interpolate. */
  shortcode: string;
  /** Canonical permalink, always trailing-slashed. */
  permalink: string;
};

/**
 * Raised when a value fails the Instagram Reel contract. A distinct type rather
 * than a bare string so the admin API can return this message to the form
 * verbatim while still collapsing every other internal error into a generic one.
 */
export class InstagramValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InstagramValidationError";
  }
}

export type InstagramParseResult =
  | { ok: true; ref: InstagramRef }
  | { ok: false; reason: string };

/**
 * Parses and validates a user-supplied Instagram Reel URL.
 *
 * The contract is intentionally narrow, because the CMS is a place editors type
 * by hand and a link that merely *looks* like an Instagram link is not a Reel:
 *
 * - the scheme must be https (a scheme-less paste is read as https),
 * - the host must be instagram.com,
 * - the path must be exactly `/reel/<shortcode>`.
 *
 * `/p/`, `/tv/`, profile pages, tag pages and bare shortcodes are all rejected,
 * since Instagram's embed only resolves a Reel permalink and anything else would
 * render as a broken or misleading card.
 */
export function parseInstagramUrl(input: string | null | undefined): InstagramParseResult {
  const raw = (input ?? "").trim();
  if (!raw) return { ok: false, reason: "Enter the Reel's Instagram URL." };

  // A bare shortcode is not a URL. Rejecting it keeps the stored value a real
  // link, so the record stays meaningful to an editor reading the list view.
  if (!raw.includes("/") && !raw.includes(".")) {
    return { ok: false, reason: "Paste the Reel's full Instagram URL, not just its code." };
  }

  // Add a scheme so `URL` can parse `instagram.com/reel/…` pasted without one,
  // and so a protocol-relative or javascript: value cannot be reinterpreted.
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, reason: "That is not a valid URL." };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "Use the https link, not http." };
  }
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    return { ok: false, reason: "The link must point to instagram.com." };
  }

  // Query strings and fragments are allowed and dropped: `?igsh=` share suffixes
  // are what the address bar actually shows.
  const segments = url.pathname.split("/").filter(Boolean);
  const [first, second, ...rest] = segments;
  if (!first || !second || rest.length > 0) {
    return { ok: false, reason: "Use a link to a single Reel, like instagram.com/reel/…/" };
  }
  if (first.toLowerCase() !== "reel") {
    return { ok: false, reason: "Only Instagram Reels are supported — use a /reel/ link." };
  }
  if (!SHORTCODE.test(second)) {
    return { ok: false, reason: "The Instagram link is missing a valid Reel code." };
  }

  return { ok: true, ref: buildRef(second) };
}

function buildRef(shortcode: string): InstagramRef {
  return {
    shortcode,
    // Always the canonical reel permalink, so the same Reel cannot enter the
    // database in two different shapes.
    permalink: `https://www.instagram.com/reel/${shortcode}/`,
  };
}

/** Convenience for call sites that only care whether a value is usable. */
export function isValidInstagramUrl(input: string | null | undefined): boolean {
  return parseInstagramUrl(input).ok;
}

/**
 * Normalises a CMS value, throwing a typed error when it is not a valid Reel
 * link. Server-side writes go through this so the database can never hold a
 * value the renderer would then have to sanitise, and so the admin API can tell
 * this failure apart from an internal one.
 */
export function requireInstagramUrl(input: string | null | undefined): string {
  const result = parseInstagramUrl(input);
  if (!result.ok) throw new InstagramValidationError(result.reason);
  return result.ref.permalink;
}
