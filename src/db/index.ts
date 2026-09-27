import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { resolveDatabaseUrl } from "./url";

const databaseUrl = resolveDatabaseUrl();

if (process.env.DATABASE_URL && !databaseUrl) {
  console.warn(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "warn",
      event: "db.url.unusable",
      message: "No usable database connection string found; the site will serve static content only.",
    }),
  );
}

/**
 * The public site runs fully from published static content, so a missing DATABASE_URL
 * must not break the build or a request. When no URL is configured we hand out a pool
 * that points at a closed port: construction stays lazy, every query fails fast with a
 * connection error, and the callers in src/lib/data.ts fall back to static/curated data.
 */
export const dbConfigured = Boolean(databaseUrl);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl ?? "postgresql://offline:offline@127.0.0.1:1/offline",
    max: 10,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 30000,
  });

if (dbConfigured) {
  pool.on("error", (error) => {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: "error", event: "db.pool.idle_error", message: error instanceof Error ? error.message : "unknown" }));
  });
}

if (process.env.NODE_ENV !== "production" && dbConfigured) {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool, { schema });
