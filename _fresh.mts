import { pubGet } from "./_harness.mts";
for (const p of ["/zz-brand-new-unknown-abc","/services/zz-brand-new-unknown-def"]) {
  const r = await pubGet(p);
  const h = Object.fromEntries(r.headers.entries());
  console.log(`${p} -> ${r.status} bytes=${r.text.length} cache=${h["x-nextjs-cache"]} prerender=${h["x-nextjs-prerender"]} etag=${h["etag"]}`);
}
process.exit(0);
