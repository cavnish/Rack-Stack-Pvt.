/**
 * The site's own origin, used for canonical URLs, the sitemap, robots and
 * structured data.
 *
 * This exists because the base URL was read from `NEXT_PUBLIC_SITE_URL` in four
 * separate places, each with its own `?? "http://localhost:3000"` fallback. That
 * value is a *development* setting, so a production deploy that inherited the
 * shipped `.env` published `http://localhost:3000` as the canonical origin of
 * every page — all 114 sitemap URLs, every `robots.txt` `Host` and `Sitemap`, and
 * the `metadataBase` that makes Next resolve every relative canonical and Open
 * Graph URL. The site would have told search engines its canonical address is
 * localhost, and no single place reported the problem.
 *
 * Two rules now apply, together:
 *
 *  - Development keeps working. `localhost` and `127.0.0.1` are accepted when
 *    `NODE_ENV` is not production, so a local checkout needs no configuration.
 *  - Production can never emit a localhost origin. A missing or localhost value
 *    falls back to the real production host and says so once, loudly, because
 *    silently emitting the wrong canonical is exactly the failure this prevents.
 */

/** The production origin. Used whenever the configured value is unusable. */
const PRODUCTION_ORIGIN = "https://www.rackandstack.in";

/** Hosts that are this site itself, so a link to them is an internal route. */
const CANONICAL_HOSTS = new Set(["www.rackandstack.in", "rackandstack.in"]);

let warned = false;

function isLoopback(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

/**
 * Vercel preview/deployment hosts (`*.vercel.app`).
 *
 * These are per-deployment cockpit URLs, not the customer-facing origin. A build
 * that inherited one as `NEXT_PUBLIC_SITE_URL` would publish it as the canonical
 * address of every page — the same class of failure as a localhost origin, so it
 * is rejected alongside it.
 */
function isPreviewHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "vercel.app" || host.endsWith(".vercel.app");
}

function normalize(value: string) {
  return value.replace(/\/+$/, "");
}

/** The raw configured value, without any production safety net. */
function configuredValue() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return raw ? normalize(raw) : "";
}

/**
 * The origin to emit in canonical URLs, the sitemap and structured data.
 *
 * Always returns a valid absolute origin with no trailing slash.
 */
export function siteOrigin(): string {
  const configured = configuredValue();
  if (!configured) {
    if (process.env.NODE_ENV === "production") warnOnce(`NEXT_PUBLIC_SITE_URL is unset; using ${PRODUCTION_ORIGIN}`);
    return PRODUCTION_ORIGIN;
  }

  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    if (process.env.NODE_ENV === "production") {
      warnOnce(`NEXT_PUBLIC_SITE_URL is not a valid URL ("${configured}"); using ${PRODUCTION_ORIGIN}`);
    }
    return PRODUCTION_ORIGIN;
  }

  if ((isLoopback(parsed.hostname) || isPreviewHost(parsed.hostname)) && process.env.NODE_ENV === "production") {
    warnOnce(
      `NEXT_PUBLIC_SITE_URL is "${configured}", which is not the public origin ` +
        `(localhost or a Vercel preview host). Canonical URLs, the sitemap and robots.txt would all ` +
        `advertise the wrong host in production, so ${PRODUCTION_ORIGIN} is being used instead. ` +
        `Set NEXT_PUBLIC_SITE_URL to the real origin.`,
    );
    return PRODUCTION_ORIGIN;
  }

  return normalize(configured);
}

/**
 * A same-site URL rendered as a safe relative route.
 *
 * CMS fields (hero buttons, section CTAs, rich links) are free text, so an editor
 * can paste an absolute URL that points at this very site — including a stale
 * preview host such as `https://rackandstack.vercel.app/...`. Following that link
 * leaves the canonical domain and can leak preview pages, so any link whose host
 * is this site (apex, `www`, localhost, or a `*.vercel.app` preview) is rewritten
 * to just its path. External hosts are returned untouched.
 */
export function internalHref(value: string | null | undefined, fallback = "/"): string {
  const raw = (value ?? "").trim();
  if (!raw) return fallback;
  if (raw.startsWith("/") || raw.startsWith("#") || raw.startsWith("?")) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }

  const host = url.hostname.toLowerCase();
  if (CANONICAL_HOSTS.has(host) || isLoopback(host) || isPreviewHost(host)) {
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path === "" || path === "/" ? fallback : path;
  }
  return raw;
}

/** `siteOrigin()` as a `URL`, for Next's `metadataBase`. */
export function siteUrl(): URL {
  return new URL(siteOrigin());
}

/** An absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${siteOrigin()}${suffix}`;
}

function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  // Deliberately loud: this is a deployment misconfiguration, not a runtime fault.
  console.warn(`[site-url] ${message}`);
}