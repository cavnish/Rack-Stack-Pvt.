"use client";

import { useEffect } from "react";
import { hasMarketingConsent, onConsentChange, pushToDataLayer } from "@/lib/analytics";

/**
 * Optional marketing tags, switched on only by an environment variable *and*
 * only after the visitor has consented.
 *
 * Every id here is empty by default. An empty id means the tag is never built —
 * not a placeholder, not a test id, nothing — so this file cannot invent an
 * integration or fire one without consent. That is the whole contract:
 *
 *   id present  AND  consent === "all"   →   tag loads
 *   anything else                        →   no request leaves the page
 *
 * Meta Pixel, LinkedIn Insight Tag and Microsoft Clarity are third-party
 * libraries that have no consent-mode equivalent, so they are attached in code
 * on consent and never loaded by GTM. Google Ads does understand Consent Mode,
 * so it stays inside GTM; the id here is handed to the container through the
 * `dataLayer` so the Ads tag can be configured without duplicating the Google
 * tag that GTM already loads.
 *
 * A fresh page load with consent already stored attaches them immediately; a
 * visitor who accepts mid-session triggers the same code through the consent
 * event, with no reload.
 */

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() ?? "";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
const LINKEDIN_PARTNER_ID = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID?.trim() ?? "";
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_ID?.trim() ?? "";

/** Ids already attached, so a consent change cannot double-load a tag. */
const attached = new Set<string>();

function injectInline(id: string, code: string): void {
  if (attached.has(id) || document.getElementById(id)) return;
  attached.add(id);
  const script = document.createElement("script");
  script.id = id;
  script.text = code;
  document.head.appendChild(script);
}

function attachGoogleAds(): void {
  if (!GOOGLE_ADS_ID || attached.has("google-ads-config")) return;
  attached.add("google-ads-config");
  // The container has a Google Ads tag triggered on this event; passing the id
  // keeps it in GTM instead of loading a second Google tag from the app.
  pushToDataLayer({ event: "google_ads_config", google_ads_id: GOOGLE_ADS_ID });
}

function attachMetaPixel(): void {
  if (!META_PIXEL_ID) return;
  injectInline(
    "meta-pixel",
    `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`,
  );
}

function attachLinkedIn(): void {
  if (!LINKEDIN_PARTNER_ID) return;
  injectInline(
    "linkedin-insight",
    `_linkedin_partner_id="${LINKEDIN_PARTNER_ID}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s)})(window.lintrk);`,
  );
}

function attachClarity(): void {
  if (!CLARITY_PROJECT_ID) return;
  injectInline(
    "microsoft-clarity",
    `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${CLARITY_PROJECT_ID}");`,
  );
}

function attachConsentedTags(): void {
  if (!hasMarketingConsent()) return;
  attachGoogleAds();
  attachMetaPixel();
  attachLinkedIn();
  attachClarity();
}

export function ConsentAwareTags() {
  useEffect(() => {
    attachConsentedTags();
    return onConsentChange((value) => {
      if (value === "all") attachConsentedTags();
    });
  }, []);

  return null;
}
