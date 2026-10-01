import "dotenv/config";
import { publish, type PublishScope } from "@/lib/publish";

const scopes: PublishScope[] = [
  "all",
  "settings",
  "seo",
  "homepage",
  "sliders",
  "products",
  "services",
  "projects",
  "client-logos",
  "industries",
  "gallery",
  "videos",
  "testimonials",
  "blog",
  "faqs",
  "pages",
  "redirects",
];

const [requested, ...flags] = process.argv.slice(2);
const scope: PublishScope = (scopes as string[]).includes(requested) ? (requested as PublishScope) : "all";
const force = flags.includes("--force");

async function main() {
  const result = await publish(scope, { force });
  if (result.skipped) {
    console.error(`publish skipped: ${result.error ?? "nothing to do"}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    JSON.stringify(
      {
        scope: result.scope,
        written: result.collections,
        assetsCached: result.assetsCached,
        assetsReused: result.assetsReused,
        assetsFailed: result.assetsFailed,
        durationMs: result.durationMs,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
