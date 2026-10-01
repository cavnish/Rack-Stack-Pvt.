import { chromium } from "playwright";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";

const BASE = "http://localhost:3000";
const ROUTES = [
  "/", "/about", "/products", "/products/heavy-duty-long-span-racks",
  "/products/slotted-angle-racks", "/services", "/industries", "/projects",
  "/clients", "/gallery", "/contact", "/request-a-quote", "/blog", "/catalog",
];

// ---------- raw transfer sizes (curl-free, node http) ----------
async function raw(url, enc) {
  const t0 = performance.now();
  const res = await fetch(url, { headers: { "Accept-Encoding": enc } });
  const buf = Buffer.from(await res.arrayBuffer());
  const ttfb = performance.now() - t0;
  return {
    status: res.status, bytes: buf.length, ttfb: +ttfb.toFixed(1),
    ce: res.headers.get("content-encoding") || "-",
    cl: res.headers.get("content-length") || "-",
    cache: res.headers.get("cache-control") || "-",
  };
}

const SIZE = {};
console.log("=== RAW RESPONSE SIZES (identity = uncompressed) ===");
for (const r of ROUTES) {
  const id = await raw(BASE + r, "identity");
  const br = await raw(BASE + r, "br");
  SIZE[r] = { raw: id.bytes, br: br.bytes, ce: id.ce, brCe: br.ce, cl: id.cl, cache: id.cache, ttfb: id.ttfb };
  console.log(
    r.padEnd(42),
    "raw=" + String(id.bytes).padStart(8),
    "br=" + String(br.bytes).padStart(7),
    (br.bytes > 0 ? (100 - (br.bytes / id.bytes) * 100).toFixed(1) + "%" : "-").padStart(6),
    "| ce(raw)=" + id.ce.padEnd(8),
    "ce(br)=" + br.ce.padEnd(6),
    "cl=" + id.cl,
    "ttfb=" + id.ttfb + "ms",
  );
}
console.log("\n=== CACHE-CONTROL ===");
for (const r of ROUTES) console.log(r.padEnd(42), SIZE[r].cache);

// ---------- browser vitals + console + network ----------
const browser = await chromium.launch();
const VITALS = {};
console.log("\n=== BROWSER VITALS / CONSOLE / NETWORK ===");
for (const r of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  const errs = [], warns = [], failed = [];
  page.on("console", (m) => {
    if (m.type() === "error") errs.push(m.text().slice(0, 200));
    if (m.type() === "warning") warns.push(m.text().slice(0, 160));
  });
  page.on("pageerror", (e) => errs.push("PAGEERROR " + String(e).slice(0, 200)));
  page.on("requestfailed", (req) => failed.push(req.method() + " " + req.url().slice(0, 110) + " :: " + (req.failure()?.errorText || "")));
  page.on("response", (res) => { if (res.status() >= 400) failed.push("HTTP" + res.status() + " " + res.url().slice(0, 110)); });

  const byType = {}; let reqCount = 0; let jsBytes = 0, cssBytes = 0, imgBytes = 0, fontBytes = 0, otherBytes = 0;
  page.on("response", async (res) => {
    reqCount++;
    const u = res.url();
    let t = res.request().resourceType();
    if (t === "document") t = "html";
    try {
      const h = res.headers();
      const len = h["content-length"] ? +h["content-length"] : (await res.body().catch(() => null))?.length ?? 0;
      byType[t] = (byType[t] || 0) + len;
      if (t === "script") jsBytes += len;
      else if (t === "stylesheet") cssBytes += len;
      else if (t === "image") imgBytes += len;
      else if (t === "font") fontBytes += len;
      else otherBytes += len;
      if (t === "document") byType.__htmlCt = h["content-encoding"] || "none";
    } catch {}
  });

  try {
    await page.goto(BASE + r, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(3500);
  } catch (e) { errs.push("GOTO " + String(e).slice(0, 160)); }

  // measure interaction (INP proxy)
  let inp = null;
  try {
    await page.evaluate(() => { window.__i = 0; ["pointerdown","keydown"].forEach(t => window.addEventListener(t, () => performance.now(), true)); });
    const t0 = Date.now();
    await page.mouse.move(300, 300); await page.mouse.down(); await page.mouse.up();
    await page.mouse.click(683, 400, { delay: 40 });
    inp = Date.now() - t0;
  } catch {}

  const v = await page.evaluate(() => new Promise((res) => {
    let lcp = 0, cls = 0, fcp = 0;
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); } catch {}
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: "layout-shift", buffered: true }); } catch {}
    const f = performance.getEntriesByName("first-contentful-paint")[0]; if (f) fcp = f.startTime;
    const nav = performance.getEntriesByType("navigation")[0];
    setTimeout(() => res({
      lcp: Math.round(lcp), cls: +cls.toFixed(4), fcp: Math.round(fcp),
      ttfb: nav ? Math.round(nav.responseStart) : 0,
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : 0,
      lcpEl: (() => { try { const e = performance.getEntriesByType("largest-contentful-paint").pop(); return e?.element ? e.element.tagName + (e.element.className ? "." + String(e.element.className).slice(0, 50) : "") : "-"; } catch { return "-"; } })(),
      imgs: document.images.length,
      brokenImgs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
    }), 400);
  }));

  const jsReqs = Object.entries(byType).filter(([k]) => k === "script").length;
  VITALS[r] = { ...v, reqCount, jsReqs, jsBytes, cssBytes, imgBytes, fontBytes, otherBytes, errs, warns, failed, inp };
  console.log(
    "\n" + r,
    "\n  ttfb=" + v.ttfb + "ms fcp=" + v.fcp + "ms lcp=" + v.lcp + "ms cls=" + v.cls + " reqs=" + reqCount + " js=" + (jsBytes / 1024).toFixed(0) + "KB css=" + (cssBytes / 1024).toFixed(0) + "KB img=" + (imgBytes / 1024).toFixed(0) + "KB font=" + (fontBytes / 1024).toFixed(0) + "KB",
    "\n  lcpEl=" + v.lcpEl + " imgs=" + v.imgs + " broken=" + v.brokenImgs,
    "\n  consoleErrors=" + errs.length + " consoleWarns=" + warns.length + " failedReqs=" + failed.length,
  );
  errs.slice(0, 6).forEach((e) => console.log("    ERR  " + e));
  warns.slice(0, 3).forEach((e) => console.log("    WARN " + e));
  [...new Set(failed)].slice(0, 6).forEach((e) => console.log("    FAIL " + e));
  await ctx.close();
}
await browser.close();

const out = { SIZE, VITALS, at: new Date().toISOString() };
(await import("node:fs")).writeFileSync("perf-baseline.json", JSON.stringify(out, null, 2));
console.log("\nSaved perf-baseline.json");