import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

const pending = new Map();
page.on("request", (r) => pending.set(r, { url: r.url(), t: Date.now() }));
page.on("requestfinished", (r) => pending.delete(r));
page.on("requestfailed", (r) => pending.delete(r));

const t0 = Date.now();
await page.goto("http://localhost:3000/products", { waitUntil: "commit", timeout: 30000 });
console.log("navigation committed at +" + (Date.now() - t0) + "ms");

for (let i = 0; i < 6; i++) {
  await page.waitForTimeout(5000);
  const state = await page.evaluate(() => document.readyState).catch(() => "eval-blocked");
  console.log(
    "+" + (Date.now() - t0) + "ms readyState=" + state +
    " pending=" + pending.size +
    " domNodes=" + (await page.evaluate(() => document.getElementsByTagName("*").length).catch(() => "?")),
  );
}

console.log("\nOutstanding requests:");
for (const [, v] of pending) console.log("  +" + (v.t - t0) + "ms  " + v.url.slice(0, 130));

await browser.close();