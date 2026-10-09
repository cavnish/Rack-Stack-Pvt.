import { sql } from "drizzle-orm";
import { db, dbConfigured } from "@/db";
import { rateLimits } from "@/db/schema";

type RateLimitResult = { allowed: boolean; remaining: number; retryAfter?: number };

/** Process-local fallback, used when there is no database or it is unreachable. */
const store = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (current.count >= limit) return { allowed: false, remaining: 0, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}

/**
 * Fixed-window rate limit shared through Postgres.
 *
 * The in-memory Map this replaces only bounded load within one process, and a
 * serverless host runs many instances — an attacker could multiply a limit by
 * the number of warm instances. The counter is now a single row per key, advanced
 * atomically by an upsert, so the window is global. When there is no database,
 * or a query fails, it degrades to the process-local limiter rather than failing
 * the request: a limiter outage must not take the public endpoints down with it.
 */
export async function rateLimit(key: string, limit = 8, windowMs = 60_000): Promise<RateLimitResult> {
  if (!dbConfigured) return memoryRateLimit(key, limit, windowMs);
  const now = new Date();
  const nextReset = new Date(now.getTime() + windowMs);
  try {
    const [row] = await db
      .insert(rateLimits)
      .values({ key, count: 1, resetAt: nextReset })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`case when ${rateLimits.resetAt} <= ${now} then 1 else ${rateLimits.count} + 1 end`,
          resetAt: sql`case when ${rateLimits.resetAt} <= ${now} then ${nextReset} else ${rateLimits.resetAt} end`,
        },
      })
      .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });
    if (!row) return memoryRateLimit(key, limit, windowMs);
    if (row.count > limit) {
      return { allowed: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000)) };
    }
    return { allowed: true, remaining: Math.max(0, limit - row.count) };
  } catch {
    return memoryRateLimit(key, limit, windowMs);
  }
}

export function requestKey(request: Request, scope: string) {
  return `${scope}:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"}`;
}

export function hasValidOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    // A browser attaches Origin to every non-GET request, so a state-changing
    // request without one cannot be proven same-site and is refused. Reads stay
    // allowed: they are safe, and server-side callers have no Origin to send.
    return request.method === "GET" || request.method === "HEAD";
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try { return new URL(origin).host === host; } catch { return false; }
}
