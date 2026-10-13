# Analytics & tracking setup

This document is the operational half of the tracking code. The code emits a
`dataLayer`; **the GTM container turns those events into GA4 events, Ads
conversions and key events.** Nothing below can be applied automatically from
the repository — it is the container work that makes the emitted events visible
in Google's tools.

- Container: `GTM-WR439C6L`
- GA4 measurement ID: `G-KZW52G5Z4K` (configured **inside** GTM)
- Search Console token: `rxYbw4WVp8zsV6V4aLPDsDAQ4_F9GZ4iQJCdr1UiizI`
- Site: `https://www.rackandstack.in`

---

## 1. How the site loads tags

`src/app/layout.tsx` renders, inside `<head>`, and in this order:

1. an inline **Consent Mode v2 default** script (`consent-mode-default`), then
2. the standard **GTM container snippet** (`google-tag-manager`).

Immediately after the opening `<body>` tag it renders the GTM **`<noscript>`
iframe** (`GoogleTagManagerNoScript`).

There is deliberately **no `gtag.js`** and **no `gtag('config', 'G-…')`** anywhere
in the app. GA4 is loaded by GTM only. Adding a direct GA4 install later would
double every `page_view`.

Code that emits events:

| File | Responsibility |
| --- | --- |
| `src/lib/analytics.ts` | Consent state, consent mode updates, `dataLayer` push, event names |
| `src/components/site/google-tag-manager.tsx` | Consent default + GTM snippet + noscript + verification token |
| `src/components/site/analytics-provider.tsx` | `page_view`, scroll depth, click + form-start delegation |
| `src/components/site/product-view-tracker.tsx` | `view_item` |
| `src/components/site/consent-aware-tags.tsx` | Optional Ads / Meta / LinkedIn / Clarity |
| `src/components/site/cookie-consent.tsx` | Writes consent and updates Consent Mode |

---

## 2. GTM container build

### 2.1 Variables (Data Layer Variables)

Create these **Data Layer Variables** (type = Data Layer Variable, same name):

`page_path`, `page_location`, `page_title`, `item_id`, `item_name`,
`item_category`, `link_url`, `link_text`, `file_name`, `form_name`,
`lead_type`, `product_slug`, `percent_scrolled`, `cta_label`,
`google_ads_id`.

Also create these built-ins: **Page Path**, **Page URL**, **Click Text**,
**Click URL**.

### 2.2 Triggers

| Trigger name | Type | Fires on |
| --- | --- | --- |
| `CE - page_view` | Custom Event | `page_view` |
| `CE - view_item` | Custom Event | `view_item` |
| `CE - whatsapp_click` | Custom Event | `whatsapp_click` |
| `CE - phone_click` | Custom Event | `phone_click` |
| `CE - email_click` | Custom Event | `email_click` |
| `CE - quote_cta_click` | Custom Event | `quote_cta_click` |
| `CE - brochure_download` | Custom Event | `brochure_download` |
| `CE - lead_form_start` | Custom Event | `lead_form_start` |
| `CE - generate_lead` | Custom Event | `generate_lead` |
| `CE - scroll_depth` | Custom Event | `scroll_depth` |
| `CE - google_ads_config` | Custom Event | `google_ads_config` |
| `Consent Initialization` | Consent Initialization – All Pages | container load |

> Because `page_view` is emitted by the app, **do not** add the built-in
> "History Change" page-view trigger; it would duplicate SPA page views.

### 2.3 Tags

**GA4 Configuration** (`GA4 - Config`)

- Tag type: Google Tag / GA4 Configuration, Measurement ID `G-KZW52G5Z4K`
- Trigger: **Consent Initialization – All Pages**
- **Untick "Send a page view event when this configuration loads."** The site
  sends `page_view` itself; leaving this on produces two per page.
- Enable Consent Mode (advanced consent settings = "Use consent mode").

**GA4 Event tags** (tag type: GA4 Event, Measurement ID `G-KZW52G5Z4K`)

| Tag | Event name | Trigger | Parameters |
| --- | --- | --- | --- |
| `GA4 - page_view` | `page_view` | `CE - page_view` | `page_path`, `page_location`, `page_title` |
| `GA4 - view_item` | `view_item` | `CE - view_item` | `items`, `item_id`, `item_name`, `item_category` |
| `GA4 - whatsapp_click` | `whatsapp_click` | `CE - whatsapp_click` | `link_url`, `link_text`, `page_path` |
| `GA4 - phone_click` | `phone_click` | `CE - phone_click` | `link_url`, `link_text`, `page_path` |
| `GA4 - email_click` | `email_click` | `CE - email_click` | `link_url`, `link_text`, `page_path` |
| `GA4 - quote_cta_click` | `quote_cta_click` | `CE - quote_cta_click` | `cta_label`, `page_path` |
| `GA4 - brochure_download` | `brochure_download` | `CE - brochure_download` | `file_name`, `link_url`, `page_path` |
| `GA4 - lead_form_start` | `lead_form_start` | `CE - lead_form_start` | `form_name`, `page_path` |
| `GA4 - generate_lead` | `generate_lead` | `CE - generate_lead` | `form_name`, `lead_type`, `product_slug` |
| `GA4 - scroll_depth` | `scroll_depth` | `CE - scroll_depth` | `percent_scrolled`, `page_path` |

All GA4 tags use "Use consent mode" with `analytics_storage` as the consent
requirement.

---

## 3. GA4 configuration

In **Admin → Data Streams → (web stream) → Enhanced measurement**:

- **Turn off "Page changes based on browser history events."** The app emits
  `page_view` on every navigation; leaving this on duplicates SPA page views.
- **Turn off "Scrolls"** (the app emits `scroll_depth`).
- **Turn off "Form interactions"** (the app emits `lead_form_start` /
  `generate_lead`).
- Optionally turn off "File downloads" (the app emits `brochure_download`).
- "Outbound clicks" may stay on.

In **Admin → Events**, mark these as **key events (conversions)**:

- `generate_lead` — the only confirmed-lead event.
- `whatsapp_click`, `phone_click`, `email_click`, `quote_cta_click` — optional
  micro-conversions.

`generate_lead` is only emitted after the server confirms success, so key-event
counts are real leads, not button clicks.

---

## 4. Consent settings

The site uses **Google Consent Mode v2** with consent-first defaults:

- Before any visitor choice: `ad_storage`, `ad_user_data`,
  `ad_personalization`, `analytics_storage` are **denied**.
- The cookie banner (Accept) calls `setConsent("all")`, which pushes
  `consent` `update` with all four **granted** and re-sends the current
  `page_view`.
- "Reject Optional" stores `essential`, which keeps everything denied.
- Analytics events are additionally gated in JS: without `all`, the app never
  builds the event at all.

In GTM, configure each tag's **Consent Settings**:

| Tag group | Required consent |
| --- | --- |
| GA4 tags | `analytics_storage` |
| Google Ads tags | `ad_storage`, `ad_user_data`, `ad_personalization` |

Add a **Consent Overview** check in Tag Assistant and confirm denied → granted
transitions are logged.

---

## 5. Optional marketing integrations

All four are **off unless an id is provided**, and are gated on consent `all`.
Set the variables and redeploy (they are build-time `NEXT_PUBLIC_*` values).

| Integration | Env var | Loaded by |
| --- | --- | --- |
| Google Ads | `NEXT_PUBLIC_GOOGLE_ADS_ID` (`AW-…`) | GTM, on `google_ads_config` + Consent Mode |
| Meta Pixel | `NEXT_PUBLIC_META_PIXEL_ID` | App, after consent |
| LinkedIn Insight Tag | `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` | App, after consent |
| Microsoft Clarity | `NEXT_PUBLIC_CLARITY_ID` | App, after consent |

For **Google Ads**: create a Google Ads conversion linker / tag triggered by
`CE - google_ads_config`, mapping `google_ads_id` (DLV) to the tag's conversion
ID. The app never loads a second Google tag.

No id is ever invented in code; an empty variable means the integration is inert.

---

## 6. Search Console verification

The token is rendered as a meta tag in the root `<head>` by Next's Metadata API
(`src/app/layout.tsx` → `metadata.verification.google`), which produces:

```html
<meta name="google-site-verification" content="rxYbw4WVp8zsV6V4aLPDsDAQ4_F9GZ4iQJCdr1UiizI" />
```

- This is the **HTML tag** method and verifies a **URL-prefix** property
  (`https://www.rackandstack.in/`).
- For a **Domain** property, DNS verification is required. Add a **TXT** record
  whose value is `google-site-verification=rxYbw4WVp8zsV6V4aLPDsDAQ4_F9GZ4iQJCdr1UiizI`
  (Google's DNS method prefixes the token the same way). The token itself is the
  string above; do not paste a whole `<meta>` tag into DNS or into the env var.
- Verify in Search Console **only after the production deploy** shows the meta
  tag (see §7).

---

## 7. Validation

1. **Local** — `npm run verify:tracking` (starts a headless Chromium against a
   running server) checks the GTM snippet, the noscript iframe, the meta tag,
   `page_view` on first load and on client navigation, `view_item`, click events,
   form-start, and that there are **no duplicate `page_view`s**.
2. **GTM Preview** — open `https://www.rackandstack.in/?gtm_debug=1` (or use
   Preview from the container), accept cookies, and confirm one `page_view`,
   then navigate in-app and confirm exactly one more per route.
3. **Tag Assistant** — confirm the container loads, consent transitions log,
   and no tag fires twice.
4. **GA4 DebugView** — `Admin → DebugView`; watch `page_view` once per
   navigation, `view_item` on product pages, and `generate_lead` only after a
   real form success.
5. **Production page navigation** — walk Home → product → contact → submit a
   test enquiry; confirm in DebugView there is no duplicate `page_view` and the
   lead appears once.

### Event reference

| Event | When | Key parameters |
| --- | --- | --- |
| `page_view` | First paint + every client navigation | `page_path`, `page_location`, `page_title` |
| `view_item` | Product page view (both product URLs) | `items`, `item_id`, `item_name`, `item_category` |
| `whatsapp_click` | Click on a `wa.me` / WhatsApp link | `link_url`, `link_text` |
| `phone_click` | Click on a `tel:` link | `link_url`, `link_text` |
| `email_click` | Click on a `mailto:` link | `link_url`, `link_text` |
| `quote_cta_click` | "Request a Quote" CTA / `/request-a-quote` link | `cta_label`, `page_path` |
| `brochure_download` | Confirmed catalog download / a PDF link | `file_name`, `link_url` |
| `lead_form_start` | First focus/keystroke in a form | `form_name` |
| `generate_lead` | Server-confirmed form / gated download success | `form_name`, `lead_type`, `product_slug` |
| `scroll_depth` | 25 / 50 / 75 / 90 % scroll, per page | `percent_scrolled` |
| `google_ads_config` | Consent granted and Ads id present | `google_ads_id` |
