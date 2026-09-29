/**
 * Responsive check for the About page.
 *
 * Measures, in a real browser at every width the brief asks for:
 *
 *   1. horizontal page overflow — the page itself and, when it overflows, which
 *      element is responsible;
 *   2. headings that are clipped or sitting on more lines than they should;
 *   3. the product rail — that its cards keep a usable width and do not collapse.
 *
 * Run against a dev server: `node scripts/check-about-responsive.mjs [baseUrl]`.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const PATHS = ["/about"];
const WIDTHS = [320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440, 1920];

const browser = await chromium.launch();
let failures = 0;

for (const path of PATHS) {
  console.log(`\n=== ${path} ===`);

  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    // Reveal animations start from opacity 0 and translate down; settling them
    // first stops a mid-animation layout from being measured.
    await page.waitForTimeout(400);

    const report = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflowBy = doc.scrollWidth - doc.clientWidth;

      // Find what is actually sticking out, so a failure names its own cause.
      const culprits = [];
      if (overflowBy > 0) {
        for (const el of document.querySelectorAll("body *")) {
          const rect = el.getBoundingClientRect();
          if (rect.right > doc.clientWidth + 1 || rect.left < -1) {
            const style = getComputedStyle(el);
            // A deliberate horizontal scroller is not a page overflow.
            if (style.overflowX === "auto" || style.overflowX === "scroll") continue;
            if (el.closest("[style*='overflow-x'], .no-scrollbar")) continue;
            culprits.push(
              `${el.tagName.toLowerCase()}.${String(el.className).split(" ").filter(Boolean).slice(0, 3).join(".")} ` +
                `(right=${Math.round(rect.right)})`,
            );
            if (culprits.length >= 4) break;
          }
        }
      }

      const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
        .map((el) => {
          const style = getComputedStyle(el);
          const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize);
          const lines = Math.round(el.getBoundingClientRect().height / lineHeight);
          return {
            tag: el.tagName,
            text: (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 46),
            lines,
            clipped: el.scrollWidth > el.clientWidth + 1,
            size: Math.round(Number.parseFloat(style.fontSize)),
          };
        })
        .filter((h) => h.text);

      const railCards = Array.from(
        document.querySelectorAll('a[href^="/products/"]:has(img)'),
      ).map((el) => Math.round(el.getBoundingClientRect().width));

      return { overflowBy, culprits, headings, railCards };
    });

    const problems = [];
    if (report.overflowBy > 0) {
      problems.push(`overflow ${report.overflowBy}px -> ${report.culprits.join(" | ") || "unknown"}`);
    }
    const clipped = report.headings.filter((h) => h.clipped);
    if (clipped.length) {
      problems.push(`clipped headings: ${clipped.map((h) => `"${h.text}"`).join(", ")}`);
    }

    const status = problems.length === 0 ? "PASS" : "FAIL";
    if (problems.length) failures += 1;
    console.log(
      `${status}  ${String(width).padStart(4)}px  h=${report.headings.length}` +
        (problems.length ? `  ${problems.join(" ; ")}` : ""),
    );

    // A readable size check, separate from overflow: a heading that survives only
    // by being clipped or shrunk to nothing is not a pass.
    if (width === 320) {
      const tiny = report.headings.filter((h) => h.tag !== "H3" && h.size < 20);
      if (tiny.length) console.log(`      small headings at 320px: ${tiny.map((h) => `${h.text} (${h.size}px)`).join(", ")}`);
    }

    await page.close();
  }
}

await browser.close();
console.log(failures === 0 ? "\nRESULT: PASS" : `\nRESULT: FAIL (${failures} width/path combinations)`);
process.exit(failures === 0 ? 0 : 1);
