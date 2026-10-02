import { pubGet, publish } from "./_harness.mts";
console.log("--- publish to regenerate collections (empty-project bug fix) ---");
const p = await publish();
console.log("publish:", p.status, p.text.slice(0, 180));

console.log("\n--- route check ---");
for (const path of ["/","/about","/privacy-policy","/terms-and-conditions","/cookie-policy","/services","/services/storage-planning","/services/warehouse-optimization","/projects","/zz-unknown-param","/a/b/c/deep"]) {
  const r = await pubGet(path);
  console.log(`${path.padEnd(32)} ${r.status} ${String(r.text.length).padStart(7)}B`);
}
process.exit(0);
