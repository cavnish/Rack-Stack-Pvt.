import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

/**
 * SEO / indexing verification against a real production build.
 *
 *   node scripts/validate-seo.mjs              # boots server.mjs itself
 *   SEO_BASE_URL=https://... node scripts/...  # checks a running instance
 *
 * Exit code is non-zero if any check fails. The body reader is capped and
 * requests identity encoding so a misbehaving response cannot exhaust memory.
 */

const CANONICAL_ORIGIN = "https://www.rackandstack.in";
const BASE = (process.env.SEO_BASE_URL || "").replace(/\/+$/, "");
const PORT = process.env.SEO_PORT || "3400";
const SAMPLE_LIMIT = Number.parseInt(process.env.SEO_SAMPLE || "14", 10);
const MAX_BODY_BYTES = 4000000;

const FORBIDDEN_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", ".vercel.app"];
const PRIVATE_PATHS = ["/admin", "/api", "/search", "/thank-you", "/preview"];

const results = [];
let server = null;

function check(name, ok, detail) {
  results.push({ name, ok, detail: detail || "" });
  console.log("  [" + (ok ? "PASS" : "FAIL") + "] " + name + (detail ? " - " + detail : ""));
}

function forbiddenHost(value) {
  const lower = String(value).toLowerCase();
  return FORBIDDEN_HOSTS.find((host) => lower.includes(host)) || null;
}

function origin() {
  return BASE || "http://127.0.0.1:" + PORT;
}

async function readCapped(response) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function fetchText(base, path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(base + path, {
      redirect: "manual",
      headers: { "accept-encoding": "identity" },
      signal: controller.signal,
    });
    return { status: response.status, body: await readCapped(response) };
  } finally {
    clearTimeout(timer);
  }
}

async function startServer() {
  server = spawn(process.execPath, ["server.mjs"], {
    env: Object.assign({}, process.env, {
      NODE_ENV: "production",
      HOSTNAME: "127.0.0.1",
      PORT: PORT,
      DATABASE_URL: "",
      NEON_DATABASE_URL: "",
    }),
    stdio: ["ignore", "pipe", "pipe"],
  });

  let log = "";
  server.stdout.on("data", (chunk) => (log += chunk));
  server.stderr.on("data", (chunk) => (log += chunk));

  const started = Date.now();
  while (Date.now() - started < 60000) {
    try {
      const { status } = await fetchText(origin(), "/robots.txt");
      if (status === 200) return;
    } catch {
      /* not up yet */
    }
    await delay(400);
  }
  throw new Error("server did not become ready.\n" + log);
}

function stopServer() {
  if (server) {
    server.kill();
    server = null;
  }
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractAll(source, regex) {
  const out = [];
  let match;
  while ((match = regex.exec(source)) !== null) {
    out.push(match[1]);
    if (!regex.global) break;
  }
  return out;
}

function ldBlocks(html) {
  return extractAll(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
}

function validJsonLd(html) {
  const blocks = ldBlocks(html);
  if (blocks.length === 0) return { ok: false, detail: "no JSON-LD blocks" };
  for (const raw of blocks) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !("@type" in parsed)) {
        return { ok: false, detail: "block without @type" };
      }
    } catch {
      return { ok: false, detail: "unparseable JSON-LD block" };
    }
  }
  return { ok: true, detail: blocks.length + " block(s)" };
}

function validateRobots(base) {
  console.log("\nrobots.txt");
  return fetchText(base, "/robots.txt").then(({ status, body }) => {
    check("robots.txt responds 200", status === 200, "status " + status);
    check("robots advertises canonical sitemap", body.includes("Sitemap: " + CANONICAL_ORIGIN + "/sitemap.xml"));
    check("robots disallows /admin", /Disallow:\s*\/admin/i.test(body));
    check("robots disallows /api", /Disallow:\s*\/api/i.test(body));
    check("robots allows public crawling", /User-Agent:/i.test(body) && /Allow:\<｜begin▁of▁sentence｜>#016/);
    check("robots has no preview/localhost host", !forbiddenHost(body));
  });
}

function validateSitemap(base) {
  console.log("\nsitemap.xml");
  return fetchText(base, "/sitemap.xml").then(({ status, body }) => {
    check("sitemap.xml responds 200", status === 200, "status " + status);
    check("sitemap.xml is well-formed", body.includes("<urlset") && body.includes("</urlset>"));

    const urls = extractAll(body, /<loc>([^<]+)<\/loc>/g).map((url) => decodeXml(url).trim());
    check("sitemap advertises URLs", urls.length > 0, urls.length + " URLs");

    const nonHttps = urls.filter((url) => !url.startsWith("https://"));
    check("all sitemap URLs are absolute HTTPS", nonHttps.length === 0, nonHttps.slice(0, 3).join(", "));

    const offOrigin = urls.filter((url) => {
      const ok = url === CANONICAL_ORIGIN || url === CANONICAL_ORIGIN + "/" || url.startsWith(CANONICAL_ORIGIN + "/");
      return !ok;
    });
    check("all sitemap URLs use the canonical origin", offOrigin.length === 0, offOrigin.slice(0, 3).join(", "));

    const seen = new Set();
    const duplicates = urls.filter((url) => (seen.has(url) ? true : (seen.add(url), false)));
    check("sitemap has no duplicates", duplicates.length === 0, duplicates.slice(0, 3).join(", "));

    const privateHits = urls.filter((url) => {
      const path = url.slice(CANONICAL_ORIGIN.length) || "/";
      return PRIVATE_PATHS.some((prefix) => path === prefix || path.startsWith(prefix + "/"));
    });
    check("sitemap excludes private/unpublished URLs", privateHits.length === 0, privateHits.slice(0, 3).join(", "));
    check("sitemap has no localhost/preview host", !forbiddenHost(body));

    return urls;
  });
}

function samplePages(urls) {
  const paths = [...new Set(urls.map((url) => url.slice(CANONICAL_ORIGIN.length) || "/"))];
  if (paths.length <= SAMPLE_LIMIT) return paths.sort();
  const step = Math.ceil(paths.length / SAMPLE_LIMIT);
  const sampled = [];
  for (let i = 0; i < paths.length; i += step) sampled.push(paths[i]);
  if (!sampled.includes("/")) sampled.unshift("/");
  return sampled.slice(0, SAMPLE_LIMIT);
}

async function validatePages(base, urls) {
  console.log("\npublic pages");
  const titles = new Map();

  for (const path of samplePages(urls)) {
    console.log("  - " + path);
    const { status, body } = await fetchText(base, path);
    if (status !== 200) {
      check(path + " responds 200", false, "status " + status);
      continue;
    }

    const canonical = extractAll(body, /<link\s+rel="canonical"\s+href="([^"]+)"/i)[0];
    const ogUrl = extractAll(body, /<meta\s+property="og:url"\s+content="([^"]+)"/i)[0];
    const titleMatch = extractAll(body, /<title>([^<]*)<\/title>/i)[0];
    const title = titleMatch ? titleMatch.trim() : "";
    const expectedCanonicals = path === "/" ? [CANONICAL_ORIGIN, CANONICAL_ORIGIN + "/"] : [CANONICAL_ORIGIN + path];
    const ld = validJsonLd(body);

    check(path + " responds 200", true);
    check(path + " has a self-referencing canonical", Boolean(canonical) && expectedCanonicals.indexOf(canonical) !== -1, canonical || "missing");
    check(path + " Open Graph URL matches canonical", Boolean(canonical) && ogUrl === canonical, ogUrl || "missing");
    check(path + " has a title", Boolean(title));
    check(path + " emits valid JSON-LD", ld.ok, ld.detail);
    check(path + " has no localhost/preview leak", !forbiddenHost(body));

    if (title) {
      if (titles.has(title)) check(path + " title is unique", false, "same as " + titles.get(title));
      else titles.set(title, path);
    }
  }
}

async function main() {
  if (!BASE) await startServer();
  const base = BASE || "http://127.0.0.1:" + PORT;
  console.log("\nValidating " + base + " (canonical " + CANONICAL_ORIGIN + ")");

  const urls = await validateSitemap(base);
  await validateRobots(base);
  await validatePages(base, urls);

  const failed = results.filter((result) => !result.ok);
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed.");
  if (failed.length) {
    console.error("\n" + failed.length + " check(s) FAILED:");
    for (const item of failed) console.error("  - " + item.name + (item.detail ? " (" + item.detail + ")" : ""));
    return 1;
  }
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error("\nseo validation aborted: " + (error && error.message ? error.message : error));
  process.exitCode = 1;
} finally {
  if (server) server.kill();
}
