/** Removes only the rows this audit created. Temporary - deleted after use. */
import { sql } from "./_harness.mts";

const like = "%ZZAudit%";
const slugLike = "%zz-audit%";

const tables: Array<[string, string, string]> = [
  ["product_projects", "project_id", "projects"],
  ["project_images", "project_id", "projects"],
  ["project_industries", "project_id", "projects"],
  ["product_services", "service_id", "services"],
  ["service_images", "service_id", "services"],
  ["blog_categories", "slug", "blog_posts"],
  ["blog_post_images", "blog_post_id", "blog_posts"],
];

// Collect the ids first so child rows can go before parents.
const ids = await sql<{ id: number }>(
  `select id from pages where title like $1 or slug like $2
   union all select id from services where name like $1 or slug like $2
   union all select id from projects where title like $1 or slug like $2
   union all select id from blog_posts where title like $1 or slug like $2`,
  [like, slugLike],
);
const idList = ids.map((r) => r.id);
console.log("audit ids to remove:", idList.join(",") || "(none)");

if (idList.length) {
  const p = idList.join(",");
  for (const [table, col] of tables) {
    try {
      const res = await sql(`delete from ${table} where ${col} in (${p}) returning 1`);
      if (res.length) console.log(`  ${table}: deleted ${res.length}`);
    } catch (error) {
      console.log(`  ${table}: skipped (${(error as Error).message.slice(0, 60)})`);
    }
  }
  for (const [table, col] of [["pages", "id"], ["services", "id"], ["projects", "id"], ["blog_posts", "id"]] as const) {
    const res = await sql(`delete from ${table} where ${col} in (${p}) returning ${col}`);
    console.log(`  ${table}: deleted ${res.length}`);
  }
}

const check = await sql(
  `select 'pages' t, count(*)::int n from pages where title like $1 or slug like $2
   union all select 'services', count(*)::int from services where name like $1 or slug like $2
   union all select 'projects', count(*)::int from projects where title like $1 or slug like $2
   union all select 'blog_posts', count(*)::int from blog_posts where title like $1 or slug like $2
   union all select 'testimonials', count(*)::int from testimonials where client_name like $1
   union all select 'faqs', count(*)::int from faqs where answer like $1
   union all select 'client_logos', count(*)::int from client_logos where name like $1
   union all select 'gallery', count(*)::int from gallery where title like $1
   union all select 'home_offer_cards', count(*)::int from home_offer_cards where title like $1
   union all select 'about_sections', count(*)::int from about_sections where title like $1 or label like $1
   union all select 'homepage_sections', count(*)::int from homepage_sections where title like $1 or section_key like $2
   union all select 'home_sliders', count(*)::int from home_sliders where eyebrow like $1
   union all select 'industries', count(*)::int from industries where name like $1 or slug like $2`,
  [like, slugLike],
);
console.log("\nresidue after cleanup:");
for (const row of check) console.log(`  ${row.t}: ${row.n}`);
process.exit(0);