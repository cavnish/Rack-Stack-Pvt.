import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 375, height: 780 } })).newPage();
const cssUrls = [];
p.on("response", (r) => { if (r.request().resourceType() === "stylesheet") cssUrls.push(r.url()); });
await p.goto("http://localhost:3000/products/slotted-angle-racks", { waitUntil: "domcontentloaded", timeout: 120000 });
await p.waitForTimeout(2500);
console.log("stylesheet requests:", cssUrls.length);
for (const u of cssUrls) {
  const res = await p.request.get(u);
  const t = await res.text();
  const hasSpacer = t.includes("mp-action-bar-spacer");
  const hasBodyPad = /mp-action-bar\)\s*body/.test(t);
  console.log(`${u.slice(-60)} status=${res.status()} len=${t.length} hasSpacer=${hasSpacer} hasBodyPadRule=${hasBodyPad}`);
  const i = t.indexOf("mp-action-bar");
  if (i >= 0) console.log("   ctx:", JSON.stringify(t.slice(Math.max(0, i - 120), i + 260)));
}
await b.close();