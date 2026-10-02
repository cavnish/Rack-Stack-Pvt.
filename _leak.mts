import { pubGet } from "./_harness.mts";
const paths = ["/projects","/services","/blog","/industries","/zz-audit-page-43173193","/zz-audit-project-43173193","/zz-audit-service-43173193","/zz-audit-post-43173193","/zz-audit-industry-43173193"];
for (const p of paths) {
  const r = await pubGet(p);
  const leaked = /ZZAudit/.test(r.text);
  console.log(`${p.padEnd(34)} status=${r.status} bytes=${String(r.text.length).padStart(7)} ZZAuditLeak=${leaked}`);
}
process.exit(0);
