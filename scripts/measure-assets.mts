/**
 * Measures the JavaScript and CSS a public page actually makes the browser
 * download: every <script src> and <link rel=stylesheet> in the served HTML,
 * plus the raw bytes of each asset.
 *
 * This is the number that decides whether a page is heavy - the total of every
 * chunk in `.next/static` is not, because most of those chunks belong to the
 * admin bundle and are never requested by a visitor.
 *
 * Usage: tsx scripts/measure-assets.ts [baseUrl] [route ...]
 */
const BASE = process.argv[2] ?? "http://localhost:3150";
const ROUTES = process.argv.length > 3
  ? process.argv.slice(3)
  : ["/", "/products", "/products/heavy-duty-long-span-racks", "/services", "/industries", "/gallery", "/clients", "/contact"];

type Totals = { js: number; css: number; html: number; count: number };

async function size(url: string): Promise<number> {
  try {
    const response = await fetch(url, { headers: { "accept-encoding": "br" }, signal: AbortSignal.timeout(60_000) });
    if (!response.ok) return 0;
    // `arrayBuffer` is the decompressed body; compress it the way the server
    // would so the figure is what crosses the network.
    const body = Buffer.from(await response.arrayBuffer());
    const { brotliCompressSync, constants } = await import("node:zlib");
    return brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } }).length;
  } catch {
    return 0;
  }
}

console.log(`\n=== Per-page shipped assets (brotli, as transferred) :: ${BASE} ===\n`);
const summary: Array<{ route: string; html: string; js: string; css: string; requests: number }> = [];

for (const route of ROUTES) {
  const html = await (await fetch(`${BASE}${route}`, { signal: AbortSignal.timeout(120_000) })).text();
  const htmlBytes = await size(`${BASE}${route}`);

  /*
   * Match every `/_next/static/...js` reference in the markup rather than
   * per-tag: the browser learns about a chunk from <script src>, from
   * <link rel=preload as=script> or from <link rel=modulepreload>, and the
   * attribute order differs between them, so a per-tag regex silently misses
   * most of the payload and reports a fraction of the real cost.
   */
  const jsUrls = [...new Set([...html.matchAll(/\/_next\/static\/[^"'\s\\]+\.js/g)].map((m) => m[0]))];
  const cssUrls = [...new Set([...html.matchAll(/\/_next\/static\/[^"'\s\\]+\.css/g)].map((m) => m[0]))];

  const jsSizes = await Promise.all(jsUrls.map((url) => size(url.startsWith("http") ? url : `${BASE}${url}`)));
  const cssSizes = await Promise.all(cssUrls.map((url) => size(url.startsWith("http") ? url : `${BASE}${url}`)));

  const js = jsSizes.reduce((a, b) => a + b, 0);
  const css = cssSizes.reduce((a, b) => a + b, 0);

  const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
  console.log(
    `${route.padEnd(42)} html ${kb(htmlBytes).padStart(9)}  js ${kb(js).padStart(9)} (${jsUrls.length} files)  css ${kb(css).padStart(8)} (${cssUrls.length} files)`,
  );
  summary.push({ route, html: kb(htmlBytes), js: kb(js), css: kb(css), requests: jsUrls.length + cssUrls.length });
}

console.log(`\nJS total per page: ${summary.map((s) => `${s.route} ${s.js}`).join(" | ")}`);

