import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 375, height: 780 } })).newPage();
await p.goto("http://localhost:3000/products/slotted-angle-racks", { waitUntil: "domcontentloaded", timeout: 120000 });
await p.waitForTimeout(2500);
console.log(await p.evaluate(() => {
  const de = document.documentElement;
  const bar = document.querySelector(".mp-action-bar");
  const out = {
    barExists: !!bar,
    barDisplay: bar ? getComputedStyle(bar).display : null,
    htmlHasBar: de.matches(":has(.mp-action-bar)"),
    bodyHasBar: document.body.matches(":has(.mp-action-bar)"),
    bodyPadBottom: getComputedStyle(document.body).paddingBottom,
    cssVar: getComputedStyle(de).getPropertyValue("--mp-action-bar-h"),
    bodyHeight: Math.round(document.body.getBoundingClientRect().height),
    docScrollHeight: de.scrollHeight,
    lastFlowChild: document.body.lastElementChild ? document.body.lastElementChild.tagName + "." + String(document.body.lastElementChild.className).slice(0, 40) : null,
    bodyChildren: [...document.body.children].map((c) => c.tagName + "." + String(c.className).trim().split(/\s+/).slice(0, 2).join(".")),
  };
  // is the rule present in any stylesheet?
  out.matchingRules = [];
  for (const ss of document.styleSheets) {
    let rules;
    try { rules = ss.cssRules; } catch { continue; }
    for (const r of rules || []) {
      if (r.selectorText && /mp-action-bar/.test(r.selectorText)) out.matchingRules.push(r.cssText.slice(0, 220));
      if (r.cssRules) for (const rr of r.cssRules) if (rr.selectorText && /mp-action-bar/.test(rr.selectorText)) out.matchingRules.push("@" + r.conditionText + " { " + rr.cssText.slice(0, 200) + " }");
    }
  }
  return out;
}));
await b.close();