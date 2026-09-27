import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { resolveDatabaseUrl } from "./src/db/url";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Same resolution as the runtime pool, so `db:migrate` can never target a
    // different database than the app.
    url: resolveDatabaseUrl() ?? "",
  },
  strict: true,
  verbose: true,
});
