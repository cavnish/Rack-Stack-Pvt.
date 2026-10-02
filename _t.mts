import { pubGet } from "./_harness.mts";
for (const p of ["/zz-unknown-param","/products/zz-cat/zz-prod","/blog/zz-post","/a/b/c/deep","/about","/"]) {
  const r = await pubGet(p);
  console.log(`${p.padEnd(26)} status=${r.status} bytes=${r.text.length}`);
}
process.exit(0);
