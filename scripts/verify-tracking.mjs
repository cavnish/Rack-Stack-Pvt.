/**
 * End-to-end check of the tracking wiring.
 *
 * Runs a real headless browser against a server that is already running
 * (`npm run build` then `npm start`, or a dev server). It verifies the pieces
 * that CI can actually see: the GTM snippet, the noscript fallback, the Search
 * Console meta tag, the absence of a direct GA4 install, and the `dataLayer`
 * events the app pushes — including that a client-side navigation adds exactly
 * one `page_view` and that nothing fires without consent.
 *
 * It does NOT submit real forms (that would create real leads), so the
 * `generate_lead` path is verified by code inspection, not here. It also cannot
 * see inside Google's servers — GTM Preview, Tag Assistant and GA4 DebugView
 * remain the tools for that.
 *
 * Usage: BASE_URL=http://localhost:3000 node scripts/verify-tracking.mjs
 */
import { chromium } from "playwright";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const GTM_ID = process.env.GTM_ID ?? "GTM-WR439C6L";
const VERIFICATION_TOKEN =
  process.env.VERIFICATION_TOKEN ?? "rxYbw4WVp8zsV6V4aLPDsDAQ4_F9GZ4iQJCdr1UiizI";

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

async function serverEvents(page) {
  return page.evaluate(() => (window.dataLayer || []).filter((entry) => entry && entry.event).map((entry) => entry.event));
}

async function run() {
  const browser = await chromium.launch();
  try {
    // ---- 1. Static HTML ---------------------------------------------------
    const html = await fetch(BASE).then((response) => response.text());
    check(
      "GTM container snippet is in the HTML",
      html.includes("googletagmanager.com/gtm.js") && html.includes(`'${GTM_ID}'`),
    );
    check("GTM noscript iframe is in the HTML", html.includes(`googletagmanager.com/ns.html?id=${GTM_ID}`));
    check(
      "Search Console meta tag is in the HTML",
      html.includes(`<meta name="google-site-verification" content="${VERIFICATION_TOKEN}"/>`) ||
        html.includes(`<meta name="google-site-verification" content="${VERIFICATION_TOKEN}"`),
    );
    check("No direct gtag.js install", !html.includes("googletagmanager.com/gtag/js"));

    // ---- 2. Consented session --------------------------------------------
    const context = await browser.newContext();
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem("rackstack_cookie_consent", "all");
      } catch {}
    });
    const page = await context.newPage();

    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.waitForFunction(() => (window.dataLayer || []).some((entry) => entry && entry.event === "page_view"));
    const first = await serverEvents(page);
    check("Exactly one page_view on initial load", first.filter((e) => e === "page_view").length === 1, `events=[${first.join(", ")}]`);

    // ---- 3. Client-side navigation --------------------------------------
    // A Next.js `<Link>` click is a history push, not a document load, so the
    // URL is awaited via pathname rather than `waitForURL` (which waits for a
    // `load` event an SPA navigation never fires).
    await page.locator('a[href="/contact"]').first().click();
    await page.waitForFunction(() => window.location.pathname === "/contact");
    await page.waitForTimeout(300);
    const afterNav = await serverEvents(page);
    check(
      "Exactly one page_view per client-side navigation",
      afterNav.filter((e) => e === "page_view").length === 2,
      `page_view total=${afterNav.filter((e) => e === "page_view").length}`,
    );

    // ---- 3b. Dynamic product page ---------------------------------------
    await page.goto(`${BASE}/products/mobile-compactor-storage-system`, { waitUntil: "load" });
    await page.waitForFunction(() => (window.dataLayer || []).some((entry) => entry && entry.event === "view_item"));
    const productEvents = await serverEvents(page);
    check("view_item fires on a product page", productEvents.includes("view_item"));

    // ---- 4. Scroll depth --------------------------------------------------
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(600);
    const afterScroll = await serverEvents(page);
    check("scroll_depth fires", afterScroll.includes("scroll_depth"), `events=[${afterScroll.join(", ")}]`);

    // ---- 5. Click classification -----------------------------------------
    await page.evaluate(() => {
      const fire = (href) => {
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.textContent = "test";
        document.body.appendChild(anchor);
        anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        anchor.remove();
      };
      fire("tel:+919769267792");
      fire("mailto:info@rackandstack.in");
      fire("https://wa.me/919769267792");
      fire("/request-a-quote?product=demo");
      fire("/rack-and-stack-brochure.pdf");
    });
    const afterClicks = await serverEvents(page);
    for (const name of ["phone_click", "email_click", "whatsapp_click", "quote_cta_click", "brochure_download"]) {
      check(`click event: ${name}`, afterClicks.includes(name));
    }

    // ---- 6. Form start ----------------------------------------------------
    await page.goto(`${BASE}/contact`, { waitUntil: "load" });
    await page.locator("form input, form textarea").first().focus();
    await page.waitForTimeout(200);
    const contactEvents = await serverEvents(page);
    check("lead_form_start fires on form interaction", contactEvents.includes("lead_form_start"), `events=[${contactEvents.join(", ")}]`);
    await context.close();

    // ---- 7. Consent gate --------------------------------------------------
    const gatedContext = await browser.newContext();
    await gatedContext.addInitScript(() => {
      try {
        window.localStorage.setItem("rackstack_cookie_consent", "essential");
      } catch {}
    });
    const gatedPage = await gatedContext.newPage();
    await gatedPage.goto(`${BASE}/`, { waitUntil: "load" });
    await gatedPage.waitForTimeout(800);
    // GTM pushes its own container lifecycle events (gtm.js, gtm.dom, gtm.load)
    // regardless of consent; only the app's analytics events must be absent.
    const GTM_LIFECYCLE = new Set(["gtm.js", "gtm.dom", "gtm.load"]);
    const gatedEvents = (await serverEvents(gatedPage)).filter((e) => !GTM_LIFECYCLE.has(e));
    check("No analytics events without consent", gatedEvents.length === 0, `events=[${gatedEvents.join(", ")}]`);
    await gatedContext.close();
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) {
    console.log("Failed:");
    for (const result of failed) console.log(`  - ${result.name}`);
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
