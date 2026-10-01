import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "C:/Users/AIS/AppData/Local/Temp/opencode/audit";
const label = process.argv[2] || "before";
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { path: "/", name: "home" },
  { path: "/clients", name: "clients" },
  { path: "/products", name: "products" },
  { path: "/products/office-storage", name: "category" },
  { path: "/industries/warehousing", name: "industry" },
  { path: "/contact", name: "contact" },
  { path: "/admin", name: "admin" },
];

const browser = await chromium.launch();
const results = [];

function perfProbe() {
  return new Promise(function (resolve) {
    var cls = 0;
    var po = new PerformanceObserver(function (l) {
      l.getEntries().forEach(function (e) {
        if (!e.hadRecentInput) cls += e.value;
      });
    });
    try {
      po.observe({ type: "layout-shift", buffered: true });
    } catch (e) {}

    var nav = performance.getEntriesByType("navigation")[0];
    var paints = {};
    performance.getEntriesByType("paint").forEach(function (p) {
      paints[p.name] = Math.round(p.startTime);
    });

    var lcp = 0;
    try {
      new PerformanceObserver(function (l) {
        l.getEntries().forEach(function (e) {
          lcp = Math.round(e.startTime);
        });
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch (e) {}

    setTimeout(function () {
      po.disconnect();
      resolve({
        cls: Number(cls.toFixed(4)),
        fcp: paints["first-contentful-paint"] || null,
        lcp: lcp,
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        loadEvent: nav ? Math.round(nav.loadEventEnd) : null,
        ttfb: nav ? Math.round(nav.responseStart) : null,
        transferBytes: nav ? nav.transferSize : null,
      });
    }, 3000);
  });
}

function byteProbe() {
  var r = performance.getEntriesByType("resource");
  function sum(f) {
    return r
      .filter(f)
      .reduce(function (a, x) {
        return a + (x.transferSize || x.encodedBodySize || 0);
      }, 0);
  }
  function isImg(x) {
    return (
      x.initiatorType === "img" ||
      /\.(png|jpe?g|webp|avif|svg|gif|ico)(\?|$)/i.test(x.name)
    );
  }
  function isJs(x) {
    return x.initiatorType === "script" || /\.js(\?|$)/.test(x.name);
  }
  function isCss(x) {
    return /\.css(\?|$)/.test(x.name);
  }
  function isFont(x) {
    return x.initiatorType === "font" || /\.(woff2?|ttf|otf)(\?|$)/i.test(x.name);
  }
  return {
    js: sum(isJs),
    css: sum(isCss),
    image: sum(isImg),
    font: sum(isFont),
    total: sum(function () {
      return true;
    }),
    imgCount: r.filter(isImg).length,
    requestCount: r.length + 1,
  };
}

function a11yProbe() {
  var imgs = Array.from(document.querySelectorAll("img"));
  var noAlt = imgs.filter(function (i) {
    return !i.hasAttribute("alt");
  }).length;
  var btns = Array.from(document.querySelectorAll("button, a"));
  var noName = btns.filter(function (b) {
    var t = (b.textContent || "").trim();
    return (
      !t &&
      !b.getAttribute("aria-label") &&
      !b.getAttribute("title") &&
      !b.querySelector("img[alt]:not([alt=''])") &&
      !b.getAttribute("aria-labelledby")
    );
  }).length;
  var inputs = Array.from(document.querySelectorAll("input, select, textarea"));
  var unlabelled = inputs.filter(function (i) {
    var id = i.getAttribute("id");
    var hasLabel =
      id && Array.prototype.some.call(document.querySelectorAll("label[for]"), function (l) {
        return l.getAttribute("for") === id;
      });
    return (
      !hasLabel &&
      !i.getAttribute("aria-label") &&
      !i.getAttribute("aria-labelledby") &&
      !i.closest("label")
    );
  }).length;
  var smallTargets = Array.from(document.querySelectorAll("a, button")).filter(function (e) {
    var r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24);
  }).length;
  function attr(sel, name) {
    var m = document.querySelector(sel);
    return m ? m.getAttribute(name) : null;
  }
  var desc = attr('meta[name="description"]', "content");
  var htmlEl = document.documentElement;
  return {
    imgsWithoutAlt: noAlt,
    controlsWithoutName: noName,
    inputsUnlabelled: unlabelled,
    h1Count: document.querySelectorAll("h1").length,
    lang: htmlEl ? htmlEl.getAttribute("lang") : null,
    titleLen: document.title.length,
    descriptionLen: desc ? desc.length : 0,
    canonical: attr('link[rel="canonical"]', "href"),
    ogImage: attr('meta[property="og:image"]', "content"),
    viewport: attr('meta[name="viewport"]', "content"),
    smallTapTargets: smallTargets,
  };
}

for (const p of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  const failed = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      errors.push(m.type() + ": " + m.text().slice(0, 170));
  });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message.slice(0, 170)));
  page.on("requestfailed", (r) =>
    failed.push(r.url().slice(0, 110) + " :: " + ((r.failure() || {}).errorText || "")),
  );

  const t0 = Date.now();
  const resp = await page.goto(BASE + p.path, { waitUntil: "load", timeout: 120000 }).catch(() => null);
  const loadMs = Date.now() - t0;

  const perf = await page.evaluate(perfProbe);
  const bytes = await page.evaluate(byteProbe);
  const a11y = await page.evaluate(a11yProbe);

  results.push({
    page: p.name,
    path: p.path,
    status: resp ? resp.status() : 0,
    loadMs: loadMs,
    cls: perf.cls,
    fcp: perf.fcp,
    lcp: perf.lcp,
    domContentLoaded: perf.domContentLoaded,
    loadEvent: perf.loadEvent,
    ttfb: perf.ttfb,
    js: bytes.js,
    css: bytes.css,
    image: bytes.image,
    font: bytes.font,
    total: bytes.total,
    imgCount: bytes.imgCount,
    requestCount: bytes.requestCount,
    consoleIssues: errors.length,
    consoleSample: errors.slice(0, 8),
    failedRequests: failed.length,
    failedSample: failed.slice(0, 5),
    a11y: a11y,
  });

  console.log(
    p.name.padEnd(10) +
      " status=" +
      (resp ? resp.status() : 0) +
      " LCP=" +
      perf.lcp +
      " CLS=" +
      perf.cls +
      " load=" +
      perf.loadEvent +
      "ms js=" +
      (bytes.js / 1024).toFixed(0) +
      "KB img=" +
      (bytes.image / 1024).toFixed(0) +
      "KB reqs=" +
      bytes.requestCount +
      " console=" +
      errors.length +
      " failed=" +
      failed.length,
  );
  await ctx.close();
}

writeFileSync(OUT + "/" + label + ".json", JSON.stringify(results, null, 2));
await browser.close();
console.log("\nwrote " + OUT + "/" + label + ".json");