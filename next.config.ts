import type { NextConfig } from "next";

/**
 * Content-Security-Policy, reported but not yet enforced.
 *
 * Shipped as `Report-Only` on purpose: the correct policy for this app (inline
 * Next.js bootstrap scripts, Cloudinary media, Pexels placeholders) has to be
 * confirmed against real reports before it is allowed to break a page. The
 * `connect-src`/`img-src` hosts are the third parties the site actually loads.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.pexels.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Only honoured over HTTPS; harmless on plain HTTP and set from the first
  // response so the preload window starts immediately.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const noStore = [{ key: "Cache-Control", value: "no-store, must-revalidate" }];

/**
 * Cache policy for static media in `public/`.
 *
 * `next start` (and the custom server) serve `public/` files with
 * `Cache-Control: public, max-age=0`, so every logo, hero photo and client logo
 * is revalidated on every navigation — Lighthouse flags these as "serve static
 * assets with an efficient cache policy". These files are content that changes
 * only on a redeploy, so a week-long in-memory TTL with a background revalidate
 * is safe and removes the repeat-visit round trips.
 */
const staticMedia = [
  { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "www.rackandstack.in" },
    ],
  },
  poweredByHeader: false,
  /**
   * Canonical-host redirects.
   *
   * The apex host (`rackandstack.in`) and the preferred host
   * (`www.rackandstack.in`) serve the same site, which is what let Google pick
   * the apex as canonical while the `www` URL was submitted. Both hosts must
   * resolve to this deployment (see the deployment notes); when they do, this
   * sends every apex request to its `www` equivalent with a permanent 308, so
   * there is exactly one indexable host.
   *
   * The second rule covers plain HTTP for proxies that terminate TLS and report
   * the original scheme in `x-forwarded-proto`. It only fires when the header is
   * exactly `http`, so an HTTPS request cannot be redirected to itself.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "rackandstack.in" }],
        destination: "https://www.rackandstack.in/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "header", key: "x-forwarded-proto", value: "http" }],
        destination: "https://www.rackandstack.in/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Admin screens and API responses are per-user or per-request; a shared or
      // browser cache must never retain them.
      { source: "/admin/:path*", headers: noStore },
      { source: "/api/:path*", headers: noStore },
      // Root-level static media (`/logo.png`, `/Hero.jpeg`, …).
      { source: "/:file([^/]+\\.(?:png|jpe?g|webp|avif|svg|ico|gif|pdf))", headers: staticMedia },
      // Generated/cached media directories.
      { source: "/assets/:path*", headers: staticMedia },
      { source: "/rack-and-stack-clients/:path*", headers: staticMedia },
    ];
  },
};

export default nextConfig;
