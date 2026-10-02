/**
 * Audit harness. Temporary - removed at the end of the audit.
 *
 * Exists because the admin session cookie is `Secure`, so PowerShell's cookie
 * container silently drops it over plain http and every admin page looks like a
 * redirect to the login screen. Handling the cookie by hand in Node is the only
 * reliable way to drive the CMS end to end locally.
 */
import pg from "pg";

export const BASE = process.env.TEST_BASE ?? "http://127.0.0.1:3150";

/** `.env` has an empty DATABASE_URL; the real connection string is NEON_DATABASE_URL. */
export function dbUrl(): string {
  return process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "";
}

export async function sql<T = Record<string, unknown>>(query: string, params: unknown[] = []): Promise<T[]> {
  const client = new pg.Client({ connectionString: dbUrl(), connectionTimeoutMillis: 15000 });
  await client.connect();
  try {
    const res = await client.query(query, params);
    return res.rows as T[];
  } finally {
    await client.end();
  }
}

let cookie = "";

/** One login for the whole run: the endpoint allows 5 attempts per 15 minutes. */
export async function login(): Promise<string> {
  if (cookie) return cookie;
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
    signal: AbortSignal.timeout(30000),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  cookie = setCookie.split(";")[0];
  if (res.status !== 200 || !cookie) {
    throw new Error(`login failed: ${res.status} ${await res.text().catch(() => "")} cookieLen=${cookie.length}`);
  }
  return cookie;
}

export function authCookie(): string {
  if (!cookie) throw new Error("call login() first");
  return cookie;
}

export interface Res<T = unknown> {
  status: number;
  ok: boolean;
  body: T;
  text: string;
  headers: Headers;
}

export async function adminFetch<T = unknown>(method: string, path: string, payload?: unknown): Promise<Res<T>> {
  const c = await login();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      cookie: c,
      origin: BASE,
      ...(payload === undefined ? {} : { "content-type": "application/json" }),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, ok: res.ok, body: body as T, text, headers: res.headers };
}

export const adminGet = <T = unknown>(p: string) => adminFetch<T>("GET", p);
export const adminPost = <T = unknown>(p: string, b: unknown) => adminFetch<T>("POST", p, b);
export const adminPut = <T = unknown>(p: string, b: unknown) => adminFetch<T>("PUT", p, b);
export const adminDelete = <T = unknown>(p: string) => adminFetch<T>("DELETE", p);

export async function pubGet(path: string): Promise<Res<string>> {
  const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(60000), redirect: "manual" });
  const text = await res.text();
  return { status: res.status, ok: res.ok, body: text, text, headers: res.headers };
}

/** Force a full republish through the real publish endpoint. */
export async function publish(): Promise<Res<{ ok?: boolean; error?: string }>> {
  const c = await login();
  const res = await fetch(`${BASE}/api/publish`, {
    method: "POST",
    headers: { cookie: c, origin: BASE, "content-type": "application/json" },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(180000),
  });
  const text = await res.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, ok: res.ok, body: body as { ok?: boolean; error?: string }, text, headers: res.headers };
}

export const results: Array<{ area: string; name: string; pass: boolean; detail: string }> = [];

export function check(area: string, name: string, pass: boolean, detail = ""): boolean {
  results.push({ area, name, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
  return pass;
}

export function summary(): boolean {
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${"=".repeat(72)}`);
  console.log(`TOTAL ${results.length}   PASS ${results.length - failed.length}   FAIL ${failed.length}`);
  if (failed.length) {
    console.log("\nFAILURES:");
    for (const f of failed) console.log(`  [${f.area}] ${f.name} — ${f.detail}`);
  }
  return failed.length === 0;
}
