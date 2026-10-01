import { chromium } from "playwright";

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 180000 });
await p.waitForTimeout(2500);

const r = await p.evaluate(() => {
  const sec = document.querySelector("#why-rack-stack");
  const cs = getComputedStyle(sec);
  const pick = (sel, label) => {
    const el = sec.querySelector(sel);
    if (!el) return { label, MISSING: true };
    const s = getComputedStyle(el);
    return { label, color: s.color, bg: s.backgroundColor, border: s.borderColor, bgImage: s.backgroundImage.slice(0, 40), text: (el.textContent || "").trim().slice(0, 40) };
  };
  // any descendant still painting orange (#FF6B1A family)?
  const orange = [];
  for (const el of sec.querySelectorAll("*")) {
    const s = getComputedStyle(el);
    for (const prop of ["color", "backgroundColor", "borderTopColor", "boxShadow"]) {
      const v = s[prop];
      if (!v || v === "none" || v === "rgba(0, 0, 0, 0)" || v === "transparent") continue;
      const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) continue;
      const [R, G, B] = [+m[1], +m[2], +m[3]];
      // orange = high red, mid green, low blue, and clearly not the brand red
      if (R > 150 && G > 50 && G < 190 && B < 110 && R - B > 60 && !(R > 190 && G < 80)) {
        orange.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 45)} ${prop}=${v} "${(el.textContent || "").trim().slice(0, 25)}"`);
      }
    }
  }
  // any background-image (grid pattern) left on the section or its overlay divs?
  const bgs = [];
  for (const el of [sec, ...sec.querySelectorAll("div")]) {
    const bi = getComputedStyle(el).backgroundImage;
    if (bi && bi !== "none" && !/^url\(/.test(bi)) bgs.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} => ${bi.slice(0, 90)}`);
  }
  return {
    sectionBg: cs.backgroundColor,
    sectionBgImage: cs.backgroundImage,
    accentVarOnSection: cs.getPropertyValue("--accent").trim(),
    accentVarOnRoot: getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(),
    redVar: cs.getPropertyValue("--red").trim(),
    button: pick(".btn-accent"),
    headingHighlight: pick("h2 span.text-\\[var\\(--accent\\)\\]"),
    advantageIcon: pick(".group .rounded-lg.bg-\\[color\\:var\\(--red\\)\\]\\/10"),
    statSuffix: pick(".text-\\[var\\(--red\\)\\]"),
    mapLabel: pick(".india-label"),
    overlayDivs: [...sec.querySelectorAll(':scope > div')].map((d) => (d.getAttribute("aria-hidden") ? "decorative " : "") + String(d.className).slice(0, 60)),
    orangeFound: orange,
    bgImageFound: bgs,
  };
});

console.log("section background        :", r.sectionBg, r.sectionBg === "rgb(0, 0, 0)" ? "OK solid black" : "*** NOT BLACK ***");
console.log("section background-image  :", r.sectionBgImage, r.sectionBgImage === "none" ? "OK (no grid)" : "*** HAS IMAGE ***");
console.log("--accent on section       :", r.accentVarOnSection, " | --accent on :root:", r.accentVarOnRoot, " | --red:", r.redVar);
console.log("button                    :", JSON.stringify(r.button));
console.log("heading highlight         :", JSON.stringify(r.headingHighlight));
console.log("advantage icon            :", JSON.stringify(r.advantageIcon));
console.log("stat suffix (+ / %)       :", JSON.stringify(r.statSuffix));
console.log("map label                 :", JSON.stringify(r.mapLabel));
console.log("direct child divs         :");
for (const d of r.overlayDivs) console.log("   -", d);
console.log("remaining ORANGE in section:", r.orangeFound.length);
for (const o of r.orangeFound.slice(0, 10)) console.log("   !!", o);
console.log("remaining grid/gradient bgs:", r.bgImageFound.length);
for (const o of r.bgImageFound.slice(0, 10)) console.log("   !!", o);

// hover state of the button
await p.hover(".btn-accent");
await p.waitForTimeout(400);
console.log("button on hover           :", await p.evaluate(() => {
  const s = getComputedStyle(document.querySelector("#why-rack-stack .btn-accent"));
  return `bg=${s.backgroundColor} border=${s.borderColor} color=${s.color}`;
}));

// global accent must still be orange elsewhere (contact page uses hardcoded orange, but check --accent is untouched)
await p.goto("http://localhost:3000/contact", { waitUntil: "domcontentloaded", timeout: 180000 });
await p.waitForTimeout(1500);
console.log("--accent on contact page  :", await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()));

await b.close();