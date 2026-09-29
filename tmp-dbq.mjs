import pg from "pg";

const c = new pg.Client({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const q = async (label, sql) => {
  const r = await c.query(sql);
  console.log(`\n=== ${label} ===`);
  console.table(r.rows);
};

await q("products", `select id, slug, name, category, status, display_order, featured,
  hero_image, hero_image_public_id is not null as heroCld,
  primary_cta_label, secondary_cta_label, cta_title,
  meta_title, og_image
  from products order by display_order`);

await q("media counts", `select p.slug,
  (select count(*) from product_gallery_images g where g.product_id=p.id) gallery,
  (select count(*) from product_gallery_images g where g.product_id=p.id and g.is_primary) gprim,
  (select count(*) from product_gallery_images g where g.product_id=p.id and g.cloudinary_public_id is not null) gcld,
  (select count(*) from product_images i where i.product_id=p.id) imgs,
  (select count(*) from product_images i where i.product_id=p.id and i.cloudinary_public_id is not null) icld
  from products p order by p.display_order`);

await q("content counts", `select p.slug,
  (select count(*) from product_specifications s where s.product_id=p.id) specs,
  (select count(*) from product_features f where f.product_id=p.id) feats,
  (select count(*) from product_sections sec where sec.product_id=p.id) sections,
  (select count(*) from product_related_products r where r.product_id=p.id) related
  from products p order by p.display_order`);

await q("pallet gallery rows", `select g.id, g.slot, g.label, g.image_url, g.cloudinary_public_id is not null as cld,
  g.alt_text, g.caption, g.display_order, g.is_primary, g.is_active
  from product_gallery_images g join products p on p.id=g.product_id
  where p.slug='heavy-duty-pallet-racking' order by g.display_order`);

await q("pallet product_images rows", `select i.id, i.image_url, i.cloudinary_public_id is not null as cld,
  i.alt_text, i.caption, i.display_order
  from product_images i join products p on p.id=i.product_id
  where p.slug='heavy-duty-pallet-racking' order by i.display_order`);

await q("pallet specs", `select s.* from product_specifications s join products p on p.id=s.product_id where p.slug='heavy-duty-pallet-racking' order by s.display_order`);
await q("pallet features", `select f.* from product_features f join products p on p.id=f.product_id where p.slug='heavy-duty-pallet-racking' order by f.display_order`);
await q("related rows", `select p.slug as product, rp.slug as related, r.display_order, r.is_active
  from product_related_products r join products p on p.id=r.product_id
  join products rp on rp.id=r.related_product_id order by p.display_order`);

await q("media table sample", `select count(*)::int as n from media`);
await c.end();
