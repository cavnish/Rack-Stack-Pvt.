/**
 * Resolves which database connection string to actually use.
 *
 * Shared by the runtime pool (`src/db/index.ts`) and the Drizzle CLI
 * (`drizzle.config.ts`) so the two can never disagree — a migration run against
 * a different database than the app is exactly the kind of failure that looks
 * like a phantom "table does not exist" error hours later.
 */

const PLACEHOLDER_PART = /^(USER|PASSWORD|HOST|DATABASE|DATABASE_URL|your-.*)$/i;

/**
 * True only for something that could plausibly be a real connection string.
 *
 * Rejects a value that is empty, is missing the `postgres://` scheme, has no
 * credentials, or still contains the literal `USER`/`PASSWORD`/`HOST`/
 * `DATABASE` tokens that ship in `.env.example`.
 */
export function isUsableConnectionString(value: string | undefined | null): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!/^postgres(ql)?:\/\//i.test(trimmed)) return false;

  const afterScheme = trimmed.replace(/^postgres(ql)?:\/\//i, "");
  const authority = afterScheme.split(/[/?#]/)[0] ?? "";
  if (!authority.includes("@")) return false;

  const [credentials, host = ""] = authority.split("@");
  if (!credentials || !host) return false;
  if (credentials.split(":").some((part) => PLACEHOLDER_PART.test(part))) return false;
  if (host.split(":")[0]?.split(".").some((part) => PLACEHOLDER_PART.test(part))) return false;

  const database = afterScheme.split("?")[0]?.split("/").slice(1).join("/") ?? "";
  if (!database || PLACEHOLDER_PART.test(database)) return false;

  return true;
}

/**
 * The first usable of `DATABASE_URL` and `NEON_DATABASE_URL`.
 *
 * A placeholder `DATABASE_URL` is ignored rather than allowed to shadow a
 * working `NEON_DATABASE_URL`. That precedence bug is not hypothetical: it
 * shipped here, and because the enquiry route writes to the database before it
 * sends mail, the effect was a form that returned success to the visitor while
 * storing nothing and emailing nobody.
 */
export function resolveDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  return [env.DATABASE_URL, env.NEON_DATABASE_URL].find(isUsableConnectionString);
}
