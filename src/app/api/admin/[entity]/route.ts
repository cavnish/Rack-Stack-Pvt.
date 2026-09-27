import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createEntity, isAdminEntity, listEntity } from "@/lib/admin-entities";
import { hasValidOrigin } from "@/lib/rate-limit";
import { logActivity, logServer } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { publishSerialized, scopeForAdminEntity } from "@/lib/publish";
import { InstagramValidationError } from "@/lib/instagram";
import { UserFacingError } from "@/lib/validation";

/** Rebuilds the static layer for the changed entity and reports failures without blocking the admin. */
async function publishEntity(entity: string) {
  try {
    const result = await publishSerialized(scopeForAdminEntity(entity));
    return { scope: result.scope, collections: result.collections, assetsCached: result.assetsCached, assetsReused: result.assetsReused, skipped: result.skipped };
  } catch (error) {
    logServer("warn", "admin.publish_failed", { entity, message: error instanceof Error ? error.message : "unknown" });
    return { scope: null, error: "static publish failed" };
  }
}

export async function GET(_: Request, context: { params: Promise<{ entity: string }> }) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const { entity } = await context.params; if (!isAdminEntity(entity)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 }); if (entity === "users" && user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 }); return NextResponse.json(await listEntity(entity)); }
/**
 * Messages that are safe and useful to show verbatim. Everything else is
 * collapsed into a generic message so validation internals are not leaked.
 */
function publicErrorMessage(error: unknown, generic: string) {
  const message = error instanceof Error ? error.message : "";
  // A typed validation failure carries a reason written for the person filling
  // in the form, so it is safe to pass through.
  if (error instanceof InstagramValidationError || error instanceof UserFacingError || message.includes("Password")) return message;
  return generic;
}
export async function POST(request: Request, context: { params: Promise<{ entity: string }> }) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 }); const { entity } = await context.params; if (!isAdminEntity(entity)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 }); if (entity === "users" && user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 }); try { const item = await createEntity(entity, await request.json(), user.id); await logActivity(`${entity.toUpperCase()}_CREATED`, entity, (item as { id?: number })?.id, user.id); const publish = await publishEntity(entity); revalidatePath("/", "layout"); return NextResponse.json({ ...(item as object), publish }, { status: 201 }); } catch (error) { logServer("error", "admin.create_failed", { entity, message: error instanceof Error ? error.message : "unknown" }); return NextResponse.json({ error: publicErrorMessage(error, "Unable to create this record. Check required fields and unique values.") }, { status: 400 }); } }
