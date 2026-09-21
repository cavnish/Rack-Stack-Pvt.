import "server-only";
import { createHash, randomBytes, randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "rackstack_admin_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + THIRTY_DAYS * 1000);
  const requestHeaders = await headers();
  await db.insert(sessions).values({ id, userId, tokenHash: hashToken(token), expiresAt, ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0], userAgent: requestHeaders.get("user-agent")?.slice(0, 500) });
  (await cookies()).set(SESSION_COOKIE, `${id}.${token}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: THIRTY_DAYS });
}

export async function getCurrentUser() {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const [id, token] = value.split(".");
  if (!id || !token) return null;
  const row = (await db.select({ session: sessions, user: users }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(eq(sessions.id, id), eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()), eq(users.isActive, true))).limit(1))[0];
  return row?.user ?? null;
}
export async function requireUser(roles?: Array<"SUPER_ADMIN" | "ADMIN" | "EDITOR">) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (roles && !roles.includes(user.role)) redirect("/admin?error=permission");
  return user;
}
export async function destroySession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  const id = value?.split(".")[0];
  if (id) await db.delete(sessions).where(eq(sessions.id, id));
  cookieStore.delete(SESSION_COOKIE);
}
export function canManageUsers(role: string) { return role === "SUPER_ADMIN"; }
export function canDelete(role: string) { return role === "SUPER_ADMIN" || role === "ADMIN"; }
