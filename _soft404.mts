import { pubGet } from "./_harness.mts";
for (const p of ["/zz-audit-page-43173193","/zz-audit-project-43173193","/this-page-definitely-does-not-exist-xyz"]) {
  const r = await pubGet(p);
  const title = (/<title>([^<]*)<\/title>/.exec(r.text)?.[1] ?? "(none)");
  const canon = (/<link rel="canonical" href="([^"]*)"/.exec(r.text)?.[1] ?? "(none)");
  const robots = (/<meta name="robots" content="([^"]*)"/.exec(r.text)?.[1] ?? "(none)");
  const h1 = (/<h1[^>]*>([\s\S]{0,120}?)<\/h1>/.exec(r.text)?.[1] ?? "(none)").replace(/\s+/g," ").trim();
  console.log(`\n${p}\n  status=${r.status}\n  title=${title}\n  canonical=${canon}\n  robots=${robots}\n  h1=${h1}`);
}
process.exit(0);
