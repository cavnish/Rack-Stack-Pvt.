import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasValidOrigin } from "@/lib/rate-limit";
import { logServer } from "@/lib/logger";
import { publishSerialized, type PublishScope } from "@/lib/publish";

export const runtime = "nodejs";

const SCOPES: PublishScope[] = [
  "all",
  "settings",
  "seo",
  "homepage",
  "sliders",
  "products",
  "services",
  "projects",
  "clients",
  "client-logos",
  "industries",
  "gallery",
  "testimonials",
  "blog",
  "faqs",
  "pages",
  "redirects",
];

function parseScope(value: unknown): PublishScope | null {
  return typeof value === "string" && (SCOPES as string[]).includes(value) ? (value as PublishScope) : null;
}

/**
 * Manual publish trigger for the static content layer.
 *
 * Admin mutations already publish their own scope, so this endpoint exists for
 * the first publish, for recovery after a deploy, and for CI jobs that want to
 * rebuild everything after a content migration.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  let scope: PublishScope = "all";
  let force = false;
  try {
    const body = (await request.json().catch(() => ({}))) as { scope?: unknown; force?: unknown };
    if (body.scope !== undefined) {
      const parsed = parseScope(body.scope);
      if (!parsed) return NextResponse.json({ error: `Unknown scope. Use one of: ${SCOPES.join(", ")}` }, { status: 400 });
      scope = parsed;
    }
    force = body.force === true || body.force === "true";
  } catch {
    // An unreadable body falls back to a full publish.
  }

  try {
    const result = await publishSerialized(scope, { force });
    logServer("info", "publish.manual", { scope, by: user.id, collections: result.collections.join(",") });
    return NextResponse.json(result);
  } catch (error) {
    logServer("error", "publish.manual_failed", { scope, message: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Publish failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405, headers: { Allow: "POST" } });
}
