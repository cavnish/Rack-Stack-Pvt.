import { NextResponse } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { hasValidOrigin } from "@/lib/rate-limit";
import { logActivity } from "@/lib/logger";
export async function POST(request: Request) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const user = await getCurrentUser();
  await destroySession();
  if (user) await logActivity("LOGOUT", "AUTH", undefined, user.id);
  return NextResponse.json({ ok: true });
}
