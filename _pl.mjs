import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const pending = new Map();
page.on("request", (r) => pending.set(r, r.url()));
page.on("requestfinished", (r) => pending.delete(r));
page.on("requestfailed", (r) => pending.delete(r));

const t0 = Date.now();
await page.goto("http://localhost:3000/products", { waitUntil: "domcontentloaded", timeout: 60000 });
console.log("DOMContentLoaded at " + (Date.now() - t0) + "ms");

const fired = await Promise.race([
  page.waitForLoadState("load", { timeout: 25000 }).then(() => "load").catch(() => "TIMEOUT"),
]);
console.log("load state: " + fired + " at " + (Date.now() - t0) + "ms");

// What is still outstanding when `load` should already have fired?
console.log("still pending: " + pending.size);
for (const url of pending.values()) console.log("   " + url.slice(0, 140));

const readyState = await page.evaluate(() => ({
  readyState: document.readyState,
  images: Array.from(document.images).filter((i) => !i.complete).map((i) => i.currentSrc || i.src).slice(0, 8),
  incompleteImages: Array.from(document.images).filter((i) => !i.complete).length,
}));
console.log(JSON.stringify(readyState, null, 1));

await browser.close();