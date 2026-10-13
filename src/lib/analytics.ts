/**
 * The client-side analytics contract for the whole site.
 *
 * There is exactly one analytics path: this module pushes named objects onto
 * `window.dataLayer`, and Google Tag Manager (configured in the container, not
 * in code) turns those objects into GA4 events, Google Ads conversions and any
 * other downstream tag. Nothing here loads a vendor library, and in particular
 * nothing here loads `gtag.js` for GA4 — GA4 is configured *inside* GTM, so a
 * direct `gtag('config', 'G-…')` would be a second, competing GA4 installation
 * and would double every `page_view`.
 *
 * ## Consent
 *
 * The site is consent-first: the cookie banner writes `all` or `essential`
 * under `CONSENT_STORAGE_KEY`, and this module treats anything other than
 * `all` as "no analytics consent". `track()` is a no-op without consent, so a
 * visitor who has not accepted produces no GA4 events at all. Google Consent
 * Mode v2 is still kept in sync (defaults are pushed from an inline script
 * before GTM loads — see `google-tag-manager.tsx`) so that any tag that fires
 * is already told the right state.
 *
 * ## Why a module
 *
 * Every form, CTA and link used to grow its own ad-hoc `/api/events` call. The
 * event names were duplicated as string literals at each call site, which made
 * a typo ("whatsapp click" vs "whatsapp_click") a silent data loss. This module
 * is the single place a name is spelled, so GTM's triggers and the code can be
 * kept in step.
 */

/** The values the cookie banner stores. `all` is the only consenting value. */
export type ConsentValue = "all" | "essential";

/** Where the cookie banner records the visitor's choice. */
export const CONSENT_STORAGE_KEY = "rackstack_cookie_consent";

/**
 * Fired on `window` when the visitor changes consent, so live tags (Meta,
 * LinkedIn, Clarity) can be attached without a reload. `CustomEvent.detail`
 * carries the new `ConsentValue`.
 */
export const CONSENT_CHANGE_EVENT = "rackstack:consent-change";

/**
 * Every event this site emits, and what it means to GA4.
 *
 * The names are either GA4's recommended names (`page_view`, `view_item`,
 * `generate_lead`) or deliberately *not* one of GA4's Enhanced Measurement
 * names (`brochure_download`, `lead_form_start`, `scroll_depth`) so the two can
 * never collide into a duplicate event when Enhanced Measurement is left on.
 * `check-ga4-setup` in the docs maps each one to its GTM trigger.
 */
export type AnalyticsEventName =
  | "page_view"
  | "view_item"
  | "whatsapp_click"
  | "phone_click"
  | "email_click"
  | "quote_cta_click"
  | "brochure_download"
  | "lead_form_start"
  | "generate_lead"
  | "scroll_depth"
  | "google_ads_config";

/** The free-form parameters attached to an event. */
export type AnalyticsParams = Record<string, unknown>;

/**
 * A `dataLayer` entry. GTM accepts either a plain object (an event) or the
 * positional `arguments`-style array used by the `gtag()` command API
 * (`["consent", "update", {…}]`), so the array is allowed too.
 */
export type DataLayerEntry = AnalyticsParams | unknown[];

declare global {
  interface Window {
    dataLayer?: DataLayerEntry[];
    /** Defined by the inline Google Consent Mode script before GTM loads. */
    gtag?: (...args: unknown[]) => void;
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * The visitor's stored choice, or `null` when the banner has not been answered.
 *
 * `localStorage` can throw in private modes and when cookies are blocked, so a
 * read failure is treated as "no consent" rather than crashing a page.
 */
export function getConsent(): ConsentValue | null {
  if (!isBrowser()) return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "all" || value === "essential" ? value : null;
  } catch {
    return null;
  }
}

/** True only when the visitor has accepted optional cookies. */
export function hasAnalyticsConsent(): boolean {
  return getConsent() === "all";
}

/** Marketing tags (Ads, Meta, LinkedIn, Clarity) ride on the same `all`. */
export function hasMarketingConsent(): boolean {
  return getConsent() === "all";
}

/**
 * Record the visitor's choice, update Google Consent Mode and notify listeners.
 *
 * The raw push is used for the consent itself (it must reach GTM whatever the
 * previous state was); everything else goes through `track()`, which is gated.
 */
export function setConsent(value: ConsentValue): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // A stored choice is a nicety; do not let a storage failure break the banner.
  }

  const state = value === "all" ? "granted" : "denied";
  const mode = {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  };

  // `gtag('consent','update',…)` is the Google-sanctioned shape; the inline
  // script in the root layout defines `gtag` before GTM loads. Fall back to the
  // raw positional form if that script somehow did not run.
  if (typeof window.gtag === "function") window.gtag("consent", "update", mode);
  else pushToDataLayer(["consent", "update", mode]);

  window.dispatchEvent(new CustomEvent<ConsentValue>(CONSENT_CHANGE_EVENT, { detail: value }));
}

/** Subscribe to consent changes. Returns an unsubscribe function. */
export function onConsentChange(listener: (value: ConsentValue) => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = (event: Event) => {
    const value = (event as CustomEvent<ConsentValue>).detail;
    if (value === "all" || value === "essential") listener(value);
  };
  window.addEventListener(CONSENT_CHANGE_EVENT, handler);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, handler);
}

/**
 * Append an entry to `dataLayer`, creating it first if the inline GTM snippet
 * has not run yet. This is the only function that writes to the queue.
 */
export function pushToDataLayer(entry: DataLayerEntry): void {
  if (!isBrowser()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(entry);
}

/**
 * Push one named event, if (and only if) the visitor has consented.
 *
 * Gating here rather than relying on GTM alone is deliberate: it means a
 * non-consenting visitor's browser never even *builds* the event, so a
 * mis-configured container cannot leak one.
 */
export function track(event: AnalyticsEventName, params: AnalyticsParams = {}): void {
  if (!hasAnalyticsConsent()) return;
  pushToDataLayer({ event, ...params });
}

/**
 * A `page_view` for the current address.
 *
 * Called on first paint and on every client-side navigation, so a Next.js
 * route change produces exactly one event. `google_tag_manager`'s GA4
 * configuration tag must be set to *not* send its own page view, and GA4's
 * Enhanced Measurement history tracking stays off — see the setup doc.
 */
export function trackPageView(): void {
  if (!isBrowser() || !hasAnalyticsConsent()) return;
  const { pathname, search, href } = window.location;
  pushToDataLayer({
    event: "page_view",
    page_path: `${pathname}${search}`,
    page_location: href,
    page_title: document.title,
  });
}

/** Record a product page view with the item fields GA4's `view_item` expects. */
export function trackViewItem(item: {
  id?: string | number;
  name: string;
  category?: string;
  slug?: string;
}): void {
  if (!hasAnalyticsConsent()) return;
  const items = [
    {
      item_id: item.id == null ? item.slug : String(item.id),
      item_name: item.name,
      item_category: item.category,
    },
  ];
  pushToDataLayer({
    event: "view_item",
    item_id: items[0].item_id,
    item_name: item.name,
    item_category: item.category,
    items,
  });
}

/**
 * A confirmed lead.
 *
 * Only ever called after the server has answered that the submission or
 * download actually succeeded — never on the click that starts one, and never
 * on a client-side validation pass. That is what "track confirmed successful
 * leads only" means in practice.
 */
export function trackLead(params: {
  form_name: string;
  lead_type?: string;
  product_slug?: string;
  value?: number;
  currency?: string;
}): void {
  track("generate_lead", { lead_type: "enquiry", ...params });
}
