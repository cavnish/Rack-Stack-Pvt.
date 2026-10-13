import type { ReactElement } from "react";
import { CONSENT_STORAGE_KEY } from "@/lib/analytics";

/**
 * The tracking identifiers and the GTM bootstrap.
 *
 * ## One tag manager, one GA4
 *
 * GTM is the only loader on the page. GA4 (`G-KZW52G5Z4K`) is configured *as a
 * tag inside the container*, so this file must never also emit
 * `googletagmanager.com/gtag/js` or a `gtag('config', 'G-…')` call — that would
 * be a second GA4 installation and every `page_view` would be counted twice.
 * The generated GA4 Configuration tag in GTM is set to not send its own page
 * view; the site pushes `page_view` from `AnalyticsProvider` instead, so there
 * is exactly one per navigation.
 *
 * ## Consent before GTM
 *
 * The inline consent script runs *before* the GTM snippet and pushes Google
 * Consent Mode v2 defaults, so the container is never loaded with an unknown
 * consent state. A returning visitor who already accepted starts as `granted`;
 * everyone else starts as `denied` and is upgraded by the banner.
 */

/** GTM container. Overridable at build time via `NEXT_PUBLIC_GTM_ID`. */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "GTM-WR439C6L";

/**
 * GA4 measurement ID. Kept here for the setup doc and for a `dataLayer`
 * hand-off; it is *not* used to load gtag.js, because GA4 lives in GTM.
 */
export const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || "G-KZW52G5Z4K";

/**
 * Google Search Console verification token.
 *
 * This is the *token only* — the 43-character string Search Console shows for
 * the HTML-tag method. Next's `metadata.verification.google` turns it into the
 * correct `<meta name="google-site-verification" content="…">`. Do not paste a
 * whole `<meta …>` tag here, and do not add a second copy by hand.
 */
export const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || "rxYbw4WVp8zsV6V4aLPDsDAQ4_F9GZ4iQJCdr1UiizI";

/**
 * Google Consent Mode v2 defaults, before the GTM container loads.
 *
 * `functionality_storage`/`security_storage` stay `granted`: they cover the
 * cookie banner's own preference and Next's server features, which are not
 * optional marketing storage.
 */
const consentDefaultScript = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
(function(){
  var state = "denied";
  try {
    state = window.localStorage.getItem("${CONSENT_STORAGE_KEY}") === "all" ? "granted" : "denied";
  } catch (error) {}
  gtag("consent", "default", {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500
  });
})();
`;

/**
 * The standard GTM loader, with the container id interpolated.
 *
 * Kept byte-for-byte identical to Google's snippet apart from the id, because
 * Tag Assistant and the container's own diagnostics recognise this exact shape.
 */
const gtmScript = `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
`;

/**
 * Rendered inside the root layout's `<head>`.
 *
 * Inline rather than `next/script` on purpose: the consent defaults have to be
 * guaranteed to run before the GTM snippet, and two inline tags that share a
 * parent are ordered by the parser when a strategy-based loader is not.
 */
export function GoogleTagManager(): ReactElement {
  return (
    <>
      <script id="consent-mode-default" dangerouslySetInnerHTML={{ __html: consentDefaultScript }} />
      <script id="google-tag-manager" dangerouslySetInnerHTML={{ __html: gtmScript }} />
    </>
  );
}

/**
 * The GTM `<noscript>` fallback, rendered as the first child of `<body>` so it
 * is "immediately after the opening body tag" as Google requires.
 */
export function GoogleTagManagerNoScript(): ReactElement | null {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
