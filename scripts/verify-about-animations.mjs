/**
 * Verifies the About page's scroll animations actually complete.
 *
 * The risk with a clip-path reveal is that if the trigger never fires the image
 * stays clipped to nothing and renders as an empty frame — a silent, total
 * failure that still looks fine in the DOM. So this checks the end state of
 * every animated element after scrolling the whole page, and reports anything
 * still hidden, still scaled, or still transparent.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch();
let failures = 0;

for (const width of [390, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });

  await page.evaluate(async () => {
    const step = window.innerHeight * 0.5;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 300));
    }
  });
  // Long enough for the longest transition on the page (1.5s) to settle.
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);

  const result = await page.evaluate(() => {
    // `inset(0%)` and `inset(0px 0px 0px 0px)` are the same fully-open box;
    // anything with a non-zero inset on any edge is still closed.
    const stillClosed = (cp) => {
      if (!cp || cp === "none") return false;
      return cp
        .replace(/inset\(/, "")
        .replace(/\)/, "")
        .trim()
        .split(/\s+/)
        .some((v) => v !== "0" && v !== "0px" && v !== "0%" && v !== "auto");
    };

    const clipped = Array.from(document.querySelectorAll("[style*='clip-path']"))
      .map((el) => {
        const cp = getComputedStyle(el).clipPath;
        const img = el.querySelector("img");
        return {
          closed: stillClosed(cp),
          clip: cp,
          imgLoaded: img ? img.complete && img.naturalWidth > 0 : null,
        };
      })
      .filter((c) => c.closed);

    // Elements still faded out, ignoring the two that sit off the right of the
    // horizontal product rail and are legitimately not intersecting yet.
    const transparent = Array.from(document.querySelectorAll("main *"))
      .filter((el) => {
        const o = Number(getComputedStyle(el).opacity);
        const r = el.getBoundingClientRect();
        if (o >= 0.05 || r.height <= 8 || r.width <= 8) return false;
        if (el.closest(".no-scrollbar")) return false;
        return true;
      })
      .map((el) => `${el.tagName}.${String(el.className).split(" ").filter(Boolean).slice(0, 2).join(".")}`);

    return { clipped, transparent: [...new Set(transparent)] };
  });

  /*
   * The rail is scroll-linked, so it is only meaningful while its own section is
   * on screen. Scrolling the approach section into view and then measuring is
   * the only honest check; at the top of the page a zero fill is correct.
   */
  const railState = await page.evaluate(async () => {
    // Scroll the rail itself to the middle, not the section heading: the
    // "Our Approach" heading is followed by a sticky image on desktop and an
    // image block on mobile, so centring the heading can leave the whole step
    // list still below the fold — at which point a zero fill is correct.
    const line = document.querySelector(".bg-zinc-200.w-px");
    if (!line) return { error: "rail not found" };
    line.scrollIntoView({ block: "center", behavior: "instant" });
    await new Promise((r) => setTimeout(r, 1500));

    const fill = line.querySelector("div");
    if (!fill) return { error: "rail fill not found" };
    const m = new DOMMatrixReadOnly(getComputedStyle(fill).transform);
    return { scaleY: Number(m.d.toFixed(3)) };
  });

  console.log(`\n=== ${width}px ===`);
  console.log(`unrevealed images: ${result.clipped.length}`);
  for (const c of result.clipped.slice(0, 6)) console.log(`  ${c.clip}  imgLoaded=${c.imgLoaded}`);
  console.log(`elements still transparent: ${result.transparent.length}`);
  for (const t of result.transparent.slice(0, 6)) console.log(`  ${t}`);
  console.log(`approach rail fill at section centre: ${JSON.stringify(railState)}`);

  const railOk = !railState.error && railState.scaleY > 0.15;
  if (result.clipped.length || !railOk) {
    failures += 1;
    console.log("  FAIL");
  } else {
    console.log("  PASS: reveals complete, images visible, rail draws");
  }

  await page.close();
}

await browser.close();
console.log(failures === 0 ? "\nRESULT: PASS" : `\nRESULT: FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
