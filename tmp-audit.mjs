import { chromium } from "playwright";
import { appendFileSync, writeFileSync } from "node:fs";

const OUT = "C:/Users/AIS/AppData/Local/Temp/opencode/audit.txt";
writeFileSync(OUT, "");
const log = (s) => { appendFileSync(OUT, s + "\n"); console.log(s); };

const WIDTHS = (process.env.WIDTHS || "320,375,390,414,430,768,810").split(",").map(Number);
const BASE = process.env.BASE_URL || "http://localhost:3000";
const PAGES = (process.env.PAGES || "product:/products/slotted-angle-racks,home:/")
  .split(",")
  .map((s) => { const i = s.indexOf(":"); return { name: s.slice(0, i), url: s.slice(i + 1) }; });

const probe = () => {
  const vw = document.documentElement.clientWidth;
  const isClipped = (el) => {
    let n = el.parentElement;
    while (n && n !== document.documentElement) {
      const s = getComputedStyle(n);
      if (/hidden|clip|auto|scroll/.test(s.overflowX)) return true;
      n = n.parentElement;
    }
    return false;
  };
  const label = (el) => {
    const t = (el.textContent || "").trim().replace(/\s+/g, " ");
    const cls = typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 4).join(".") : "";
    return `${el.tagName.toLowerCase()}${cls}${t ? ` "${t.slice(0, 40)}"` : ""}`;
  };

  const overflow = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if ((r.right > vw + 1 || r.left < -1) && !isClipped(el))
      overflow.push({ el: label(el), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) });
  }

  const images = [];
  for (const img of document.querySelectorAll("img")) {
    const r = img.getBoundingClientRect();
    images.push({ src: img.getAttribute("src"), natural: img.naturalWidth + "x" + img.naturalHeight, ok: img.complete && img.naturalWidth > 0, box: `${Math.round(r.width)}x${Math.round(r.height)}` });
  }

  const fixed = [];
  for (const el of document.querySelectorAll("body *")) {
    const s = getComputedStyle(el);
    if (s.position !== "fixed" || s.display === "none") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    fixed.push({ el: label(el), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, z: s.zIndex });
  }

  const logoLink = document.querySelector('header a[aria-label="Rack & Stack home"]');
  const logoImg = logoLink ? logoLink.querySelector("img") : null;
  const burger = document.querySelector('header button[aria-label="Open menu"]');
  const wordmark = logoLink ? [...logoLink.querySelectorAll("span")].find((s) => (s.textContent || "").includes("RACK")) : null;
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), display: s.display, visibility: s.visibility, opacity: s.opacity };
  };

  const gallery = (() => {
    const main = document.querySelector('[role="group"][aria-roledescription="carousel"] > div');
    if (!main) return null;
    const r = main.getBoundingClientRect();
    const img = main.querySelector("img");
    return { x: Math.round(r.x), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height), fits: r.left >= -1 && r.right <= vw + 1, imgOk: img ? img.complete && img.naturalWidth > 0 : null };
  })();

  return {
    vw, scrollWidth: document.documentElement.scrollWidth, overflow: overflow.slice(0, 10), overflowCount: overflow.length,
    images, broken: images.filter((i) => !i.ok), fixed,
    logo: logoImg ? { link: box(logoLink), img: box(logoImg), wordmark: box(wordmark), src: logoImg.getAttribute("src"), natural: logoImg.naturalWidth + "x" + logoImg.naturalHeight, ok: logoImg.complete && logoImg.naturalWidth > 0, fit: getComputedStyle(logoImg).objectFit } : null,
    burger: box(burger),
    gallery,
    title: (() => {
      const h1 = document.querySelector("h1"); if (!h1) return null;
      const r = h1.getBoundingClientRect();
      return { text: (h1.textContent || "").trim(), x: Math.round(r.x), w: Math.round(r.width), right: Math.round(r.right), scrollW: h1.scrollWidth, fs: getComputedStyle(h1).fontSize, h: Math.round(r.height) };
    })(),
  };
};

const bottomCheck = () => {
  const de = document.documentElement;
  const prev = de.style.scrollBehavior;
  de.style.scrollBehavior = "auto"; // the site sets scroll-behavior:smooth, which would leave us mid-scroll
  window.scrollTo(0, de.scrollHeight);
  return new Promise((res) => setTimeout(() => {
    const bar = document.querySelector(".mp-action-bar");
    const barRect = bar && getComputedStyle(bar).display !== "none" ? bar.getBoundingClientRect() : null;
    const spacer = document.querySelector(".mp-action-bar-spacer");
    const covered = [];
    if (barRect) {
      const cand = [...document.querySelectorAll("footer *, main *")].filter((el) => {
        const s = getComputedStyle(el);
        if (s.display === "none" || s.visibility === "hidden") return false;
        if (el.closest(".mp-action-bar")) return false; // the bar's own contents
        return el.children.length === 0 && (el.textContent || "").trim().length > 0;
      });
      for (const el of cand) {
        const r = el.getBoundingClientRect();
        if (r.height === 0) continue;
        const oy = Math.min(r.bottom, barRect.bottom) - Math.max(r.top, barRect.top);
        const ox = Math.min(r.right, barRect.right) - Math.max(r.left, barRect.left);
        if (oy > 2 && ox > 2) covered.push({ text: (el.textContent || "").trim().slice(0, 45), oy: Math.round(oy), ox: Math.round(ox) });
      }
    }
    const fab = document.querySelector(".mp-fab");
    const fabRect = fab ? fab.getBoundingClientRect() : null;
    const fabHitsBar = !!(barRect && fabRect && Math.min(fabRect.bottom, barRect.bottom) - Math.max(fabRect.top, barRect.top) > 1 && Math.min(fabRect.right, barRect.right) - Math.max(fabRect.left, barRect.left) > 1);
    const cookie = document.querySelector(".mp-cookie-consent");
    const cookieHitsBar = !!(barRect && cookie && (() => { const c = cookie.getBoundingClientRect(); return Math.min(c.bottom, barRect.bottom) - Math.max(c.top, barRect.top) > 1 && Math.min(c.right, barRect.right) - Math.max(c.left, barRect.left) > 1; })());

    res({
      bar: barRect && { x: Math.round(barRect.x), y: Math.round(barRect.y), w: Math.round(barRect.width), h: Math.round(barRect.height) },
      spacerH: spacer ? Math.round(spacer.getBoundingClientRect().height) : null,
      at: Math.round(window.scrollY), maxScroll: Math.round(de.scrollHeight - innerHeight),
      atBottom: Math.abs(window.scrollY - (de.scrollHeight - innerHeight)) < 3,
      covered: covered.slice(0, 10), coveredCount: covered.length,
      fabHitsBar, cookieHitsBar,
      fabRect: fabRect && { y: Math.round(fabRect.y), bottom: Math.round(fabRect.bottom), x: Math.round(fabRect.x) },
    });
    de.style.scrollBehavior = prev;
  }, 900));
};

// scroll the whole page so every lazy image is requested, then report real failures
const imageSweep = async () => {
  const de = document.documentElement;
  const prev = de.style.scrollBehavior;
  de.style.scrollBehavior = "auto";
  const step = Math.max(300, Math.floor(innerHeight * 0.8));
  for (let y = 0; y < de.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 90));
  }
  window.scrollTo(0, de.scrollHeight);
  await new Promise((r) => setTimeout(r, 400));
  const pending = Array.from(document.images).filter((i) => !i.complete);
  await Promise.race([
    Promise.all(pending.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))),
    new Promise((r) => setTimeout(r, 15000)),
  ]);
  const bad = [];
  let skipped = 0;
  for (const img of document.querySelectorAll("img")) {
    // images inside a display:none subtree are never fetched, so an unloaded
    // one there is expected, not a broken URL
    if (!img.getClientRects().length) { skipped++; continue; }
    if (!(img.complete && img.naturalWidth > 0)) bad.push({ src: (img.getAttribute("src") || "").slice(-85), currentSrc: (img.currentSrc || "").slice(-85) });
  }
  const total = document.querySelectorAll("img").length;
  de.style.scrollBehavior = prev;
  return { total, skipped, badCount: bad.length, bad: bad.slice(0, 15) };
};

const browser = await chromium.launch();

for (const p of PAGES) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 780 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 130)); });
    page.on("requestfailed", (r) => errors.push("REQFAIL " + r.url().slice(-60) + " " + (r.failure()?.errorText || "")));

    let status = 0;
    try {
      const resp = await page.goto(BASE + p.url, { waitUntil: "domcontentloaded", timeout: 120000 });
      status = resp ? resp.status() : 0;
      await page.waitForTimeout(1500);
      // force-load only images already near the viewport (lazy ones stay lazy)
      await page.evaluate(async () => {
        const list = Array.from(document.images).filter((i) => { const r = i.getBoundingClientRect(); return r.top < innerHeight * 2 && r.bottom > -innerHeight && !i.complete; });
        await Promise.race([Promise.all(list.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 2500))]);
      });
      await page.waitForTimeout(300);

      const d = await page.evaluate(probe);
      const sweep = await page.evaluate(imageSweep);
      const b = await page.evaluate(bottomCheck);

      const ovf = d.scrollWidth > d.vw + 1;
      log(`\n===== ${p.name} @ ${w}px [HTTP ${status}] =====`);
      log(`  overflowX: scrollWidth=${d.scrollWidth} clientWidth=${d.vw} ${ovf ? "*** HORIZONTAL OVERFLOW ***" : "ok"}  (unclipped offenders=${d.overflowCount})`);
      for (const o of d.overflow) log(`    OVERFLOW ${o.el} [${o.left}..${o.right}] w=${o.w}`);
      if (d.logo) {
        const L = d.logo;
        log(`  logo link: x=${L.link.x} w=${L.link.w} h=${L.link.h} display=${L.link.display} vis=${L.link.visibility} op=${L.link.opacity}`);
        log(`  logo img : ${L.img.w}x${L.img.h} natural=${L.natural} loaded=${L.ok} fit=${L.fit} src=${L.src}`);
        log(`  wordmark : ${L.wordmark ? `x=${L.wordmark.x} w=${L.wordmark.w} display=${L.wordmark.display} ${L.wordmark.display === "none" ? "*** HIDDEN ***" : "visible"}` : "** NOT FOUND **"}`);
        log(`  TOTAL LOCKUP WIDTH: ${L.link.w}px ${w >= 768 ? "(desktop/tablet - unchanged)" : L.link.w >= 110 && L.link.w <= 145 ? "(in 110-145 range)" : "*** OUT OF 110-145 RANGE ***"}`);
      } else log("  logo: ** NOT FOUND **");
      if (d.burger) log(`  burger   : x=${d.burger.x} w=${d.burger.w} display=${d.burger.display} ${d.burger.x > d.logo.link.x + d.logo.link.w ? "RIGHT of logo ok" : "*** NOT RIGHT ***"}`);
      if (d.gallery) log(`  gallery  : x=${d.gallery.x} right=${d.gallery.right} ${d.gallery.w}x${d.gallery.h} fitsViewport=${d.gallery.fits} imgLoaded=${d.gallery.imgOk}`);
      if (d.title) log(`  h1       : "${d.title.text}" x=${d.title.x} w=${d.title.w} right=${d.title.right} scrollW=${d.title.scrollW} fs=${d.title.fs} ${d.title.right > d.vw + 1 || d.title.scrollW > d.title.w + 1 ? "*** OVERFLOWS ***" : "ok"}`);
      log(`  images   : swept ${sweep.total} total, ${sweep.badCount} genuinely broken`);
      for (const x of sweep.bad.slice(0, 6)) log(`    BROKEN ${x.currentSrc || x.src}`);
      for (const f of d.fixed) log(`  fixed z=${f.z} [${f.rect.x},${f.rect.y} ${f.rect.w}x${f.rect.h}] ${f.el.slice(0, 80)}`);
      log(`  bottom   : bar=${JSON.stringify(b.bar)} spacerH=${b.spacerH} at=${b.at}/${b.maxScroll} atBottom=${b.atBottom}`);
      log(`  overlap  : fabOverBar=${b.fabHitsBar} cookieOverBar=${b.cookieHitsBar} contentCoveredByBar=${b.coveredCount}`);
      for (const c of b.covered.slice(0, 6)) log(`    COVERED "${c.text}" oy=${c.oy} ox=${c.ox}`);
      for (const e of [...new Set(errors)].slice(0, 5)) log(`  ERR ${e}`);
    } catch (e) {
      log(`\n===== ${p.name} @ ${w}px FAILED ===== ${e.message.split("\n")[0]}`);
    }
    await ctx.close();
  }
}
await browser.close();
log("\nDONE");