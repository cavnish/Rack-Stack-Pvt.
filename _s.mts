import { sql } from "./_harness.mts";
const r = await sql("select social_links, brochure_url, whatsapp, primary_phone from site_settings limit 1");
console.log(JSON.stringify(r[0], null, 1));
process.exit(0);
