type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();
export function rateLimit(key: string, limit = 8, windowMs = 60_000) {
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) { store.set(key, { count: 1, resetAt: now + windowMs }); return { allowed: true, remaining: limit - 1 }; }
  if (current.count >= limit) return { allowed: false, remaining: 0, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}
export function requestKey(request: Request, scope: string) { return `${scope}:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"}`; }
export function hasValidOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try { return new URL(origin).host === host; } catch { return false; }
}
