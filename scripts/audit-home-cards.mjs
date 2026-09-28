/**
 * Audits every homepage product card against the page it links to.
 *
 * For each card it checks:
 *   A. image   - the card's image vs the product page's primary image
 *   B. title   - the card's title vs the product page's <title>
 *   C. routing - every link on the card is the product, the quote form, or a tel/WhatsApp
 *   D. quote   - the quote CTA points at /request-a-quote?product=<slug>
 *
 * Next.js `fill` images expose their URL on `srcSet` (with `src` often absent in
 * the streamed HTML), and the optimiser double-encodes paths that are already
 * percent-encoded, so both are normalised before comparing.
 *
 * Usage: BASE=http://localhost:3000 node scripts/audit-home-cards.mjs
 */
const BASE = process.env.BASE ?? "http://localhost:3000";

const get = async (path) => {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), html: await res.text() };
};

/**
 * The underlying asset path behind a rendered <img>.
 *
 * `src` is preferred; otherwise the first entry of `srcSet`. The
 * `/_next/image?url=` wrapper is stripped and the result is decoded twice,
 * because a path that already contains `%20` is encoded a second time.
 */
function imagePathOf(tag) {
  const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
  const set = tag.match(/\ssrcSet="([^"]+)"/)?.[1];
  const raw = src ?? set?.split(",")[0]?.trim().split(/\s+/)[0];
  if (!raw) return null;
  const inner = raw.match(/\/_\/next\/image\?url=([^&]+)/)?.[1] ?? raw;
  try { return decodeURIComponent(decodeURIComponent(inner)); } catch { return inner; }
}

const ALLOWED_PREFIXES = ["/request-a-quote", "/tel:", "https://wa.me", "https://api.whatsapp", "#", "mailto:"];

const home = await get("/");
console.log(`GET / -> ${home.status}\n`);

const hrefRe = /href="(\/products\/[^"#?]+)"/g;
const hrefs = [...new Set([...home.html.matchAll(hrefRe)].map((m) => m[1]))];
console.log(`product URLs linked from the homepage: ${hrefs.length}\n`);

/** Every anchor offset, so a card can be bounded by the links around it. */
const allHrefOffsets = [...home.html.matchAll(/href="([^"]+)"/g)].map((m) => ({ href: m[1], index: m.index }));

let failures = 0;
const fail = (msg) => { failures += 1; console.log(`   !! ${msg}`); };

for (const href of hrefs) {
  console.log(`=== ${href}`);
  const page = await get(href);
  if (page.status !== 200) fail(`product page returned ${page.status}`);
  if (page.location) fail(`product page redirected to ${page.location}`);

  // The card's own region: from its first link up to the next link to a
  // *different* product. Padding is deliberately absent — the grid emits the
  // cards back to back, so any slack on either side pulls in the neighbouring
  // card's links and reports them as this card's.
  const own = allHrefOffsets.filter((o) => o.href === href);
  const others = allHrefOffsets.filter((o) => o.href.startsWith("/products/") && o.href !== href);
  const start = own.length ? own[0].index : 0;
  const nextOther = others.find((o) => o.index > start)?.index ?? home.html.length;
  const region = home.html.slice(start, Math.min(nextOther, start + 4000));

  const cardImage = [...region.matchAll(/<img[^>]*>/g)].map((m) => imagePathOf(m[0])).find(Boolean) ?? null;
  const cardHrefs = [...new Set([...region.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))];
  const cardText = region.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  // The product page's primary image is the first <img> whose alt names image 1.
  const tags = [...page.html.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
  const detailImage =
    imagePathOf(tags.find((t) => /alt="[^"]*image 1"/.test(t)) ?? "") ??
    imagePathOf(tags.find((t) => /\/products?\//.test(t) || /folder|storage|locker|rack/i.test(t)) ?? "");
  const detailTitle = page.html
    .match(/<title>([^<]*)<\/title>/)?.[1]
    ?.replace(/\s*\|\s*Rack &amp; Stack.*$/, "")
    .trim() ?? null;

  const imageOk = Boolean(cardImage && detailImage && cardImage === detailImage);
  console.log(`   card image      : ${cardImage ?? "(none)"}`);
  console.log(`   page image #1   : ${detailImage ?? "(none)"}`);
  console.log(`   A. IMAGE MATCH  : ${imageOk ? "YES" : "NO"}`);
  if (!imageOk) fail("card image does not match the product page's first image");

  console.log(`   page title      : ${detailTitle}`);
  const titleOk = Boolean(detailTitle && cardText.toLowerCase().includes(detailTitle.toLowerCase()));
  console.log(`   B. TITLE MATCH  : ${titleOk ? "YES" : "NO"}`);
  if (!titleOk) fail(`card text does not name "${detailTitle}"`);

  const stray = cardHrefs.filter((h) => h !== href && !ALLOWED_PREFIXES.some((p) => h.startsWith(p)));
  console.log(`   C. ROUTING       : ${stray.length === 0 ? "all links consistent" : `INCONSISTENT -> ${stray.join(", ")}`}`);
  if (stray.length) fail(`card links outside the product/quote/tel set: ${stray.join(", ")}`);

  const quote = cardHrefs.find((h) => h.startsWith("/request-a-quote"));
  const slug = href.split("/").pop();
  const quoteOk = quote ? decodeURIComponent(quote).includes(`product=${slug}`) : null;
  console.log(`   D. QUOTE LINK    : ${quote ?? "(none)"} -> ${quoteOk === null ? "n/a" : quoteOk ? "OK" : "WRONG PRODUCT"}`);
  if (quoteOk === false) fail(`quote link does not target ${slug}`);

  console.log("");
}

console.log("=".repeat(64));
console.log(failures === 0 ? "RESULT: PASS" : `RESULT: ${failures} PROBLEM(S)`);
process.exitCode = failures === 0 ? 0 : 1;
