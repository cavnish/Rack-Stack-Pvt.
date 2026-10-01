import { request as httpRequest } from "node:http";
import { brotliDecompressSync, gunzipSync } from "node:zlib";

const HOST = "127.0.0.1";
const PORT = 3000;

/** Raw HTTP so nothing auto-decompresses and hides the truth. */
function raw(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: HOST, port: PORT, path, method: headers.__method || "GET", headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () =>
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) })
      );
    });
    req.on("error", reject);
    req.end();
  });
}

const ROUTES = ["/", "/about", "/products", "/products/heavy-duty-long-span-racks", "/products/slotted-angle-racks", "/services", "/industries", "/projects", "/clients", "/gallery", "/contact", "/request-a-quote", "/blog", "/catalog"];

console.log("=== HTML compression (raw wire bytes) ===");
console.log("route".padEnd(40), "identity".padStart(9), "brotli".padStart(8), "gzip".padStart(8), "br-saved".padStart(10), "ce/br");
for (const r of ROUTES) {
  const id = await raw(r, { "Accept-Encoding": "identity" });
  const br = await raw(r, { "Accept-Encoding": "br, gzip" });
  const gz = await raw(r, { "Accept-Encoding": "gzip" });
  const saved = (100 - (br.body.length / id.body.length) * 100).toFixed(1) + "%";
  console.log(
    r.padEnd(40),
    String(id.body.length).padStart(9),
    String(br.body.length).padStart(8),
    String(gz.body.length).padStart(8),
    saved.padStart(10),
    (br.headers["content-encoding"] || "-") + " / " + (gz.headers["content-encoding"] || "-")
  );
  // integrity
  const dec = brotliDecompressSync(br.body);
  const decGz = gunzipSync(gz.body);
  if (Buffer.compare(dec, id.body) !== 0) throw new Error("BROTLI ROUNDTRIP MISMATCH on " + r);
  if (Buffer.compare(decGz, id.body) !== 0) throw new Error("GZIP ROUNDTRIP MISMATCH on " + r);
  if (br.headers["content-length"]) throw new Error("Content-Length should be removed when compressing: " + r);
}
console.log("(brotli + gzip round-trips byte-identical on all routes, Content-Length removed) ");

const html = (await raw("/", { "Accept-Encoding": "identity" })).body.toString();
const assets = [...new Set([...html.matchAll(/["'](\/_next\/static\/[^"']+\.(?:js|css))["']/g)].map((m) => m[1]))];
console.log("\n=== JS/CSS chunks: compress text, never double-encode ===");
for (const f of assets.slice(0, 6)) {
  const id = await raw(f, { "Accept-Encoding": "identity" });
  const br = await raw(f, { "Accept-Encoding": "br" });
  const ok = Buffer.compare(brotliDecompressSync(br.body), id.body) === 0;
  console.log(
    decodeURIComponent(f.split("/").pop()).slice(0, 30).padEnd(32),
    "raw=" + String(id.body.length).padStart(7),
    "br=" + String(br.body.length).padStart(6),
    "ce=" + String(br.headers["content-encoding"]).padEnd(5),
    "vary=" + String(br.headers["vary"]).slice(0, 46).padEnd(46),
    ok ? "ok" : "*** MISMATCH ***"
  );
}

console.log("\n=== images must NOT be recompressed ===");
const imgs = [...new Set([...html.matchAll(/\/_next\/image\?[^"')\s]+/g)].map((m) => m[0]))].slice(0, 3);
for (const u of imgs) {
  const id = await raw(u, { "Accept-Encoding": "identity" });
  const br = await raw(u, { "Accept-Encoding": "br" });
  console.log(
    u.slice(0, 46).padEnd(48),
    "raw=" + String(id.body.length).padStart(7),
    "br=" + String(br.body.length).padStart(7),
    "ce=" + String(br.headers["content-encoding"] || "-").padEnd(5),
    id.body.equals(br.body) ? "IDENTICAL ok" : "*** RECOMPRESSED ***"
  );
}

console.log("\n=== edge cases ===");
const head = await raw("/", { "Accept-Encoding": "br", __method: "HEAD" });
console.log("HEAD /                 ce=" + (head.headers["content-encoding"] || "-"));
console.log("br;q=0,gzip            ce=" + (await raw("/", { "Accept-Encoding": "br;q=0, gzip" })).headers["content-encoding"]);
console.log("identity only          ce=" + ((await raw("/", { "Accept-Encoding": "identity" })).headers["content-encoding"] || "-"));
console.log("*  (wildcard)          ce=" + ((await raw("/", { "Accept-Encoding": "*" })).headers["content-encoding"] || "-"));
console.log("gzip;q=0.5,br;q=0.9    ce=" + (await raw("/", { "Accept-Encoding": "gzip;q=0.5, br;q=0.9" })).headers["content-encoding"]);
console.log("gzip;q=0.9,br;q=0.4    ce=" + (await raw("/", { "Accept-Encoding": "gzip;q=0.9, br;q=0.4" })).headers["content-encoding"]);
const rsc = await raw("/products?_rsc=abc", { "Accept-Encoding": "br", RSC: "1" });
console.log("RSC payload            ce=" + rsc.headers["content-encoding"] + " ct=" + rsc.headers["content-type"] + " bytes=" + rsc.body.length);
const range = await raw("/", { "Accept-Encoding": "br", Range: "bytes=0-99" });
console.log("Range request          ce=" + (range.headers["content-encoding"] || "-") + " status=" + range.status);
const cf = await raw("/", { "Accept-Encoding": "br", "Content-Encoding": "identity" });
console.log("cache-control          " + cf.headers["cache-control"]);
console.log("vary                   " + cf.headers["vary"]);
console.log("x-powered-by           " + (cf.headers["x-powered-by"] || "(none)"));

console.log("\n=== 404 still fine ===");
const nf = await raw("/definitely-not-a-page-xyz", { "Accept-Encoding": "br" });
console.log("status=" + nf.status + " ce=" + (nf.headers["content-encoding"] || "-") + " bytes=" + nf.body.length);