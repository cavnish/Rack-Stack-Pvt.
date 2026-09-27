import { db, dbConfigured } from "@/db";
import { activityLogs } from "@/db/schema";
export function logServer(level: "info" | "warn" | "error", event: string, context: Record<string, unknown> = {}) { console[level](JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...context })); }
export async function logActivity(action: string, entity: string, entityId?: string | number, userId?: number, metadata: Record<string, unknown> = {}, ipAddress?: string) {
  if (!dbConfigured) return;
  try {
    await db.insert(activityLogs).values({ action, entity, entityId: entityId == null ? null : String(entityId), userId, metadata, ipAddress });
  } catch (error) {
    logServer("warn", "activity_log.failed", { action, entity, message: error instanceof Error ? error.message : "unknown" });
  }
}
