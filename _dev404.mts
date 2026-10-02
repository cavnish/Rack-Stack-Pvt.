import { pubGet } from "./_harness.mts";
console.log("--- dev server (port 3000), unknown slugs ---");
for (const p of ["/a/b/c/deep","/zz-unknown-param","/products/zz-cat/zz-prod"]) {
  const r = await pubGet(p);
  const body = r.text.replace(/<script[\s\S]*?<\/script>/g,"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
  console.log(`${p.padEnd(26)} status=${r.status} bytes=${String(r.text.length).padStart(6)} notFoundText=${/Page Not Found/i.test(body)}`);
}
process.exit(0);
