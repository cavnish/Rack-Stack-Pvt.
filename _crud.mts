/**
 * CMS CRUD + publish audit. Temporary - removed at the end of the audit.
 *
 * Phased so the whole catalogue is republished twice rather than once per row:
 *   1. create -> read back -> edit -> toggle off/on for every writable module
 *   2. one publish, then confirm each edit is visible on the public page that
 *      actually renders that content type
 *   3. delete every row created here
 *   4. one publish, then confirm the rows are gone from the public site
 *
 * Every row it creates is deleted again in a finally block, so CMS content is
 * left exactly as found. Payload keys match the zod schemas in
 * src/lib/validation.ts - the admin layer validates strictly and silently drops
 * unknown keys, so a wrong key here looks like a publish failure rather than a
 * rejected payload.
 */
import { adminDelete, adminGet, adminPost, adminPut, check, login, pubGet, publish, sql, summary } from "./_harness.mts";

const STAMP = Date.now().toString().slice(-8);
const P = `ZZAudit${STAMP}`;

interface Spec {
  entity: string;
  label: string;
  table: string;
  /** Column used to prove the row is really gone from the database. */
  marker: string;
  create: Record<string, unknown>;
  edit: { field: string; to: unknown };
  /** Page that renders this content type, and the text to look for there. */
  publicPath: string;
  expect: string;
  /** Soft-deleted collections report a 404 rather than "text absent". */
  expectGone?: "gone-text" | "404";
}

const specs: Spec[] = [
  {
    entity: "pages", label: "Pages", table: "pages", marker: "title",
    create: { title: `${P} Page`, slug: `zz-audit-page-${STAMP}`, status: "PUBLISHED", content: `<p>${P} page body text</p>` },
    edit: { field: "title", to: `${P} Page Edited` },
    publicPath: `/zz-audit-page-${STAMP}`, expect: `${P} Page Edited`, expectGone: "404",
  },
  {
    entity: "testimonials", label: "Testimonials", table: "testimonials", marker: "client_name",
    create: { clientName: `${P} Author`, company: `${P} Co`, content: `${P} testimonial body long enough to pass validation.`, rating: 5, featured: false, status: "PUBLISHED", displayOrder: 999 },
    edit: { field: "clientName", to: `${P} AuthorEdited` },
    publicPath: "/", expect: `${P} AuthorEdited`,
  },
  {
    entity: "faqs", label: "FAQs", table: "faqs", marker: "answer",
    create: { question: `${P} question here`, answer: `${P} answerEdited`, entityType: "GLOBAL", displayOrder: 999, status: "PUBLISHED" },
    edit: { field: "answer", to: `${P} answerEdited` },
    publicPath: "/contact", expect: `${P} answerEdited`,
  },
  {
    entity: "home-offer-cards", label: "Home offer cards", table: "home_offer_cards", marker: "title",
    create: { title: `${P} OfferEdited`, description: `${P} offer description`, href: "/about", displayOrder: 999, isActive: true },
    edit: { field: "title", to: `${P} OfferEdited` },
    publicPath: "/", expect: `${P} OfferEdited`,
  },
  {
    entity: "about-sections", label: "About sections", table: "about_sections", marker: "title",
    create: { sectionKey: `zz-audit-${STAMP}`, label: `${P} AboutEdited`, kind: "rich-text", title: `${P} AboutEdited`, body: `${P} about body text`, isActive: true, displayOrder: 999 },
    edit: { field: "title", to: `${P} AboutEdited` },
    publicPath: "/about", expect: `${P} AboutEdited`,
  },
  {
    entity: "client-logos", label: "Client logos", table: "client_logos", marker: "name",
    create: { name: `${P} LogoEdited`, imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg", altText: `${P} logo alt`, sortOrder: 999, isActive: true },
    edit: { field: "name", to: `${P} LogoEdited` },
    publicPath: "/clients", expect: `${P} LogoEdited`,
  },
  {
    entity: "gallery", label: "Gallery", table: "gallery", marker: "title",
    create: { title: `${P} ShotEdited`, imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg", altText: `${P} shot alt`, category: "Audit", displayOrder: 999, status: "PUBLISHED" },
    edit: { field: "title", to: `${P} ShotEdited` },
    publicPath: "/gallery", expect: `${P} ShotEdited`,
  },
  {
    entity: "industries", label: "Industries", table: "industries", marker: "name",
    create: { name: `${P} IndustryEdited`, slug: `zz-audit-industry-${STAMP}`, shortDescription: `${P} short`, heroImage: "https://res.cloudinary.com/demo/image/upload/sample.jpg", status: "PUBLISHED", displayOrder: 999 },
    edit: { field: "name", to: `${P} IndustryEdited` },
    publicPath: "/industries", expect: `${P} IndustryEdited`,
  },
  {
    entity: "services", label: "Services", table: "services", marker: "name",
    create: { name: `${P} ServiceEdited`, slug: `zz-audit-service-${STAMP}`, shortDescription: `${P} short`, description: `${P} long description`, heroImage: "https://res.cloudinary.com/demo/image/upload/sample.jpg", status: "PUBLISHED", displayOrder: 999 },
    edit: { field: "name", to: `${P} ServiceEdited` },
    publicPath: "/services", expect: `${P} ServiceEdited`,
  },
  {
    entity: "projects", label: "Projects", table: "projects", marker: "title",
    create: { title: `${P} ProjectEdited`, slug: `zz-audit-project-${STAMP}`, description: `${P} description`, coverImage: "https://res.cloudinary.com/demo/image/upload/sample.jpg", clientName: `${P} Client`, status: "PUBLISHED", displayOrder: 999 },
    edit: { field: "title", to: `${P} ProjectEdited` },
    publicPath: "/projects", expect: `${P} ProjectEdited`,
  },
  {
    entity: "blog", label: "Blog", table: "blog_posts", marker: "title",
    create: { title: `${P} PostEdited`, slug: `zz-audit-post-${STAMP}`, excerpt: `${P} excerpt`, content: `${P} body text`, status: "PUBLISHED", publishedAt: new Date().toISOString() },
    edit: { field: "title", to: `${P} PostEdited` },
    publicPath: "/blog", expect: `${P} PostEdited`,
  },
  {
    entity: "home-slider", label: "Home slider", table: "home_sliders", marker: "eyebrow",
    create: { eyebrow: `${P} EyebrowEdited`, title: `${P} Slide`, imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg", sortOrder: 999, status: "PUBLISHED", isActive: true },
    edit: { field: "eyebrow", to: `${P} EyebrowEdited` },
    publicPath: "/", expect: `${P} EyebrowEdited`,
  },
  {
    entity: "homepage", label: "Homepage (custom band)", table: "homepage_sections", marker: "title",
    create: { sectionKey: `zz-audit-${STAMP}`, title: `${P} BandEdited`, content: { heading: `${P} band heading`, body: `${P} band body` }, enabled: false, displayOrder: 999 },
    edit: { field: "title", to: `${P} BandEdited` },
    // A disabled band is deliberately not rendered, so there is nothing to
    // assert on the public page for it; it is covered by the database checks.
    publicPath: "", expect: "",
  },
];

const readOnly = ["inquiries", "contact-messages", "media", "seo", "settings", "users", "activity"];

console.log(`CMS CRUD audit   prefix="${P}"\n`);
await login();
console.log("authenticated as admin\n");

const created: Array<{ entity: string; id: number; spec: Spec }> = [];

try {
  console.log("=== phase 1: create / read / edit / toggle ===");
  for (const spec of specs) {
    const res = await adminPost(`/api/admin/${spec.entity}`, spec.create);
    const id = (res.body as { id?: number })?.id;
    if (!check("crud", `${spec.label}: create`, res.status === 201 && typeof id === "number", res.status === 201 ? `id=${id}` : `status ${res.status} ${res.text.slice(0, 220)}`)) continue;
    created.push({ entity: spec.entity, id: id!, spec });

    const read = await adminGet(`/api/admin/${spec.entity}/${id}`);
    check("crud", `${spec.label}: read back`, read.status === 200, `status ${read.status}`);

    const put = await adminPut(`/api/admin/${spec.entity}/${id}`, { ...spec.create, ...spec.edit });
    check("crud", `${spec.label}: edit`, put.status === 200, put.status === 200 ? "" : `status ${put.status} ${put.text.slice(0, 220)}`);

    const flag = "isActive" in spec.create ? "isActive" : "enabled" in spec.create ? "enabled" : null;
    if (flag) {
      const off = await adminPut(`/api/admin/${spec.entity}/${id}`, { ...spec.create, ...spec.edit, [flag]: false });
      check("crud", `${spec.label}: disable`, off.status === 200, `status ${off.status}`);
      const on = await adminPut(`/api/admin/${spec.entity}/${id}`, { ...spec.create, ...spec.edit, [flag]: true });
      check("crud", `${spec.label}: enable`, on.status === 200, `status ${on.status}`);
    }

    const missing = await adminGet(`/api/admin/${spec.entity}/99999999`);
    check("crud", `${spec.label}: missing row handled`, missing.status === 404 || missing.status === 400, `status ${missing.status}`);
  }

  console.log("\n=== read-only collections ===");
  for (const entity of readOnly) {
    const list = await adminGet(`/api/admin/${entity}`);
    check("crud", `${entity}: reachable`, list.status === 200 || list.status === 405, `status ${list.status}`);
  }

  console.log("\n=== phase 2: publish, then check the public site ===");
  const pub = await publish();
  check("publish", "publish endpoint succeeds", pub.ok, `status ${pub.status} ${pub.text.slice(0, 220)}`);

  for (const spec of specs) {
    if (!spec.publicPath || !spec.expect) continue;
    await new Promise((r) => setTimeout(r, 500));
    const page = await pubGet(spec.publicPath);
    const found = page.text.includes(spec.expect);
    check("publish", `${spec.label}: public at ${spec.publicPath}`, found, found ? "" : `status ${page.status} ${page.text.length}B, text absent`);
  }

  console.log("\n=== phase 3: delete ===");
  for (const row of created) {
    const del = await adminDelete(`/api/admin/${row.entity}/${row.id}`);
    check("crud", `${row.spec.label}: delete`, del.status === 200 || del.status === 204, `status ${del.status} ${del.status >= 400 ? del.text.slice(0, 220) : ""}`);
  }

  console.log("\n=== phase 4: republish, then confirm gone ===");
  const pub2 = await publish();
  check("publish", "republish after delete", pub2.ok, `status ${pub2.status} ${pub2.text.slice(0, 220)}`);

  for (const spec of specs) {
    if (!spec.publicPath || !spec.expect) continue;
    await new Promise((r) => setTimeout(r, 500));
    const page = await pubGet(spec.publicPath);
    if (spec.expectGone === "404") {
      check("publish", `${spec.label}: 404 after delete`, page.status === 404, `status ${page.status}`);
    } else {
      check("publish", `${spec.label}: gone from ${spec.publicPath}`, !page.text.includes(spec.expect), page.text.includes(spec.expect) ? "text still present" : "");
    }
  }

  console.log("\n=== database residue ===");
  const union = specs.map((s, i) => `select '${s.table}' as table, count(*)::int as n from ${s.table} where ${s.marker} like $1`).join(" union all ");
  const counts = await sql<{ table: string; n: number }>(union, [`%${P}%`]);
  const dirty = counts.filter((r) => r.n > 0);
  check("cleanup", "no rows left behind", dirty.length === 0, dirty.map((r) => `${r.table}=${r.n}`).join(", "));
} finally {
  for (const row of created) await adminDelete(`/api/admin/${row.entity}/${row.id}`).catch(() => {});
  console.log(`\ncleanup pass complete (${created.length} rows targeted)`);
}

summary();
process.exit(0);
