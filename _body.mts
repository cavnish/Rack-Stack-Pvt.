import { pubGet } from "./_harness.mts";
const r = await pubGet("/this-page-definitely-does-not-exist-xyz");
console.log("status", r.status);
console.log("headers:", JSON.stringify(Object.fromEntries(r.headers.entries()), null, 1));
const text = r.text.replace(/<script[\s\S]*?<\/script>/g,"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
console.log("BODY TEXT:", text.slice(0, 600));
process.exit(0);
