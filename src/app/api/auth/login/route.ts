import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { hasValidOrigin, rateLimit, requestKey } from "@/lib/rate-limit";
import { logActivity, logServer } from "@/lib/logger";

export async function POST(request: Request) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const limit = rateLimit(requestKey(request, "admin-login"), 5, 15 * 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  try {
    const input = loginSchema.parse(await request.json());
    const user = (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
    const valid = user && user.isActive && await compare(input.password, user.passwordHash);
    if (!valid) {
      await logActivity("LOGIN_FAILED", "AUTH", undefined, user?.id, {}, request.headers.get("x-forwarded-for") ?? undefined);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    await createSession(user.id);
    await db.update(users).set({ lastLogin: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
    await logActivity("LOGIN_SUCCESS", "AUTH", undefined, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    logServer("warn", "login.invalid", { message: error instanceof Error ? error.message : "invalid" });
    return NextResponse.json({ error: "Unable to sign in with those details" }, { status: 400 });
  }
}
