import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const databaseDir = path.join(root, ".local-pg");
const DB_NAME = "rackstack";
const PORT = Number(process.env.PGPORT ?? 5433);
const USER = "postgres";
const PASSWORD = "postgres";
const HOST = "localhost";

const mode = process.argv[2] ?? "start";

const makePg = () =>
  new EmbeddedPostgres({
    databaseDir,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
    authMethod: "password",
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
  });

function connectionUrl(database = DB_NAME) {
  return `postgresql://${USER}:${PASSWORD}@${HOST}:${PORT}/${database}`;
}

async function start() {
  const pg = makePg();
  if (!existsSync(path.join(databaseDir, "PG_VERSION"))) {
    console.log("Initialising local PostgreSQL cluster...");
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase(DB_NAME);
    console.log(`Created database "${DB_NAME}".`);
  } catch (error) {
    if (!/already exists|duplicate/i.test(String(error?.message ?? error))) {
      console.log(`Note: ${String(error?.message ?? error)}`);
    }
  }
  console.log(`Embedded PostgreSQL ready -> ${connectionUrl()}`);
  console.log("Keep this process running while you develop.");
  await new Promise(() => {});
}

function stop() {
  const pg = makePg();
  const pgHome = path.join(
    root,
    "node_modules",
    "@embedded-postgres",
    "windows-x64",
    "native"
  );
  const pgCtl = path.join(pgHome, "bin", "pg_ctl.exe");

  if (existsSync(databaseDir)) {
    const result = spawnSync(pgCtl, ["-D", databaseDir, "stop", "-m", "fast"], {
      stdio: "inherit",
      shell: false,
    });
    console.log(result.status === 0 ? "Local PostgreSQL stopped." : "No running cluster to stop.");
  } else {
    console.log("No local cluster data directory found; nothing to stop.");
  }

  const powerShell = [
    "-NoProfile",
    "-Command",
    "Get-CimInstance Win32_Process -Filter \"Name='postgres.exe'\" | Where-Object { $_.ExecutablePath -like '*@embedded-postgres*windows-x64*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }",
  ];
  spawnSync("powershell.exe", powerShell, { stdio: "ignore", shell: false });
}

async function main() {
  if (mode === "stop") {
    stop();
    return;
  }
  await start();
}

main().catch((error) => {
  console.error("db-local failed:", error);
  process.exitCode = 1;
});