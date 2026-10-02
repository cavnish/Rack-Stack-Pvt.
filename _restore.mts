/**
 * Restore pages and services from their published JSON.
 *
 * An earlier cleanup deleted by `id IN (...)` across several tables at once, so
 * it removed real pages (ids 1-4) and services (ids 1-6) along with the audit
 * rows. `src/data/<collection>.json` was written before that delete and still
 * holds every original row, so it is the restore source.
 */
import { readFile } from "node:fs/promises";
import { sql } from "./_harness.mts";

const cols: Record<string, string[]> = {
  pages: ["id", "title", "slug", "content", "hero_title", "hero_description", "hero_image", "hero_image_public_id", "meta_title", "meta_description", "canonical_url", "status", "deleted_at", "created_at", "updated_at"],
  services: ["id", "name", "slug", "short_description", "description", "hero_image", "hero_image_public_id", "status", "display_order", "created_at", "updated_at"],
};

// Map the published JSON keys onto the real column names.
const alias: Record<string, string> = {
  heroTitle: "hero_title",
  heroDescription: "hero_description",
  heroImage: "hero_image",
  heroImagePublicId: "hero_image_public_id",
  metaTitle: "meta_title",
  metaDescription: "meta_description",
  canonicalUrl: "canonical_url",
  deletedAt: "deleted_at",
  createdAt: "created_at",
  updatedAt: "updated_at",
  shortDescription: "short_description",
  description: "description",
  image: "hero_image",
  imagePublicId: "hero_image_public_id",
  displayOrder: "display_order",
};

function toColumn(key: string): string {
  if (alias[key]) return alias[key];
  return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

for (const table of ["pages", "services"]) {
  const raw = JSON.parse(await readFile(`src/data/${table}.json`, "utf8")) as Array<Record<string, unknown>>;
  const existing = await sql<{ id: number }>(`select id from ${table}`);
  const have = new Set(existing.map((r) => r.id));

  for (const row of raw) {
    if (have.has(Number(row.id))) continue;

    const keys = Object.keys(row).map(toColumn).filter((c) => cols[table].includes(c));
    const values = keys.map((c) => {
      const sourceKey = Object.keys(row).find((k) => toColumn(k) === c)!;
      const v = row[sourceKey];
      return v === undefined ? null : v;
    });

    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const res = await sql(
      `insert into ${table} (${keys.join(", ")}) values (${placeholders}) returning id`,
      values,
    );
    console.log(`  restored ${table} id=${row.id} (${row.slug ?? row.title})`);
    if (!res.length) console.log(`  !! ${table} id=${row.id} reported no insert`);
  }
}

const counts = await sql<{ t: string; n: number }>(
  `select 'pages' t, count(*)::int n from pages
   union all select 'services', count(*)::int from services`,
);
console.log("\ncounts after restore:");
for (const c of counts) console.log(`  ${c.t}: ${c.n}`);

console.log("\npages:", JSON.stringify(await sql(`select id, slug, status from pages order by id`)));
console.log("services:", JSON.stringify(await sql(`select id, slug, status from services order by id`)));
process.exit(0);