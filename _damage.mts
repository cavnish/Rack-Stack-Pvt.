import { sql } from "./_harness.mts";
for (const t of ["pages","services","projects","blog_posts","products","industries"]) {
  const r = await sql(`select count(*)::int n from ${t}`);
  console.log(`${t}: ${r[0].n} rows`);
}
console.log("\ncurrent pages:");
console.log(JSON.stringify(await sql(`select id,title,slug,status from pages order by id`)));
console.log("\ncurrent services:");
console.log(JSON.stringify(await sql(`select id,name,slug,status from services order by id`)));
process.exit(0);
