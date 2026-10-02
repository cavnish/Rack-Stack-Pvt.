import { pubGet, sql } from "./_harness.mts";
console.log("--- BUG A: archived projects on /projects ---");
const proj = await sql(`select id, title, status from projects order by id`);
console.log(proj.map(r=>`${r.id}:${r.title}(${r.status})`).join(" | "));
const listing = await sql(`select id, title, status from projects where title like $1`, ["%ZZAudit%"]);
console.log("audit projects in db:", JSON.stringify(listing));

console.log("\n--- BUG B: 404 behaviour ---");
for (const p of ["/a/b/c/deep", "/zz-unknown-param", "/products/zz-cat/zz-prod", "/blog/zz-post"]) {
  const r = await pubGet(p);
  const body = r.text.replace(/<script[\s\S]*?<\/script>/g,"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
  console.log(`${p.padEnd(26)} status=${r.status} bytes=${String(r.text.length).padStart(6)} hasNotFoundText=${/Page Not Found/i.test(body)} text="${body.slice(0,60)}"`);
}

console.log("\n--- BUG D: homepage band rows from audit ---");
const hb = await sql(`select id, section_key, title, enabled from homepage_sections where section_key like $1`, ["%zz-audit-%"]);
console.log(JSON.stringify(hb));
process.exit(0);
