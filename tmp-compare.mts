import { catalogueProducts, catalogueCategories } from "./src/lib/catalogue";
import { readFileSync } from "node:fs";

const cms = JSON.parse(readFileSync("src/data/products.json", "utf8")) as Array<{slug:string;category:string}>;
const cmsBySlug = new Map(cms.map((p) => [p.slug, p]));

console.log(`catalogue products: ${catalogueProducts.length}`);
console.log(`CMS products:       ${cms.length}`);

const broken = catalogueProducts.filter((p) => !cmsBySlug.has(p.slug));
console.log(`\ncatalogue entries with NO CMS product -> navbar link 404s: ${broken.length}`);
for (const p of broken) console.log(`  ${p.slug} (catalogue category: ${p.category})`);

const mismatch = catalogueProducts.filter((p) => cmsBySlug.has(p.slug) && cmsBySlug.get(p.slug)!.category !== p.category);
console.log(`\ncatalogue/CMS category mismatches -> navbar link 404s: ${mismatch.length}`);
for (const p of mismatch) console.log(`  ${p.slug}: catalogue=${p.category} cms=${cmsBySlug.get(p.slug)!.category}`);

const catSlugs = new Set(catalogueCategories.map((c) => c.slug));
console.log(`\nCMS categories: ${[...new Set(cms.map((p)=>p.category))].sort().join(", ")}`);
console.log(`catalogue categories: ${[...catSlugs].join(", ")}`);
