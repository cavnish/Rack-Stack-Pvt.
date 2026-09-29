import "dotenv/config";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { asc, eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { productGalleryImages, productImages, products } from "../src/db/schema";

/**
 * One-off: replace the seeded Pexels placeholders in the CMS with the eight real
 * product photographs that the site already serves from
 * `public/assets/images/products/`.
 *
 * The database and the published `src/data/products.json` had drifted apart: the
 * JSON referenced these real local .webp files while the database still held the
 * `npm run db:seed` Pexels URLs. Publishing would therefore have replaced real
 * product photography with generic stock images site-wide.
 *
 * The eight files are uploaded to Cloudinary and the remote URL plus public id
 * are stored, because the admin validators require an absolute URL
 * (`z.url()`), which a local `/assets/...` path fails. That keeps the normal
 * round trip intact: the database holds remote URLs, and publishing downloads
 * local copies for the static site.
 *
 * The authoritative product-to-photo mapping is read from the published
 * `products.json`, so the database ends up matching what the live site serves.
 */
const BACKUP = "db-image-backup-before-cloudinary-seed.json";
const FOLDER = "rack-stack/products";

type PublishedProduct = {
  slug: string;
  heroImage: string | null;
  thumbnail: string | null;
  images: Array<{ imageUrl: string; altText: string }>;
};

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured.");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

async function main() {
  configureCloudinary();

  const publishedRaw = JSON.parse(
    await import("node:fs/promises").then((fs) => fs.readFile("src/data/products.json", "utf8")),
  ) as PublishedProduct[];
  const publishedList = (Array.isArray(publishedRaw) ? publishedRaw : publishedRaw.products) as PublishedProduct[];
  const publishedBySlug = new Map(publishedList.map((row) => [row.slug, row]));

  const productRows = await db.select().from(products).orderBy(asc(products.displayOrder));
  const imageRows = await db.select().from(productImages);
  const galleryRows = await db.select().from(productGalleryImages);

  // Written before anything is mutated, so the previous state can be restored.
  writeFileSync(
    BACKUP,
    JSON.stringify({ products: productRows, images: imageRows, gallery: galleryRows }, null, 2),
    "utf8",
  );
  console.log(`backup written: ${BACKUP} (${productRows.length} products, ${imageRows.length} images, ${galleryRows.length} gallery rows)\n`);

  // One upload per distinct file, shared by every product that references it.
  const uploaded = new Map<string, { url: string; publicId: string }>();
  async function resolve(localPath: string) {
    const existing = uploaded.get(localPath);
    if (existing) return existing;
    const absolute = path.join(process.cwd(), "public", localPath.replace(/^\/+/, ""));
    const result = await cloudinary.uploader.upload(absolute, {
      folder: FOLDER,
      resource_type: "image",
      quality: "auto",
      fetch_format: "auto",
      overwrite: false,
      unique_filename: true,
    });
    const entry = { url: result.secure_url, publicId: result.public_id };
    uploaded.set(localPath, entry);
    console.log(`uploaded ${path.basename(localPath)} -> ${result.public_id}`);
    return entry;
  }

  for (const product of productRows) {
    const published = publishedBySlug.get(product.slug);
    if (!published?.heroImage) {
      console.log(`${product.slug}: no published hero, skipped`);
      continue;
    }

    const hero = await resolve(published.heroImage);
    const thumbSource = published.thumbnail ?? published.heroImage;
    const thumb = thumbSource === published.heroImage ? hero : await resolve(thumbSource);

    await db
      .update(products)
      .set({
        heroImage: hero.url,
        heroImagePublicId: hero.publicId,
        thumbnail: thumb.url,
        thumbnailPublicId: thumb.publicId,
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));

    const currentImages = imageRows
      .filter((row) => row.productId === product.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    for (let index = 0; index < Math.max(currentImages.length, published.images.length); index += 1) {
      const row = currentImages[index];
      const wanted = published.images[index];
      if (!row || !wanted) continue;
      const asset = wanted.imageUrl === published.heroImage ? hero : await resolve(wanted.imageUrl);
      await db
        .update(productImages)
        .set({
          imageUrl: asset.url,
          imagePublicId: asset.publicId,
          altText: wanted.altText,
          updatedAt: new Date(),
        })
        .where(eq(productImages.id, row.id));
    }

    // The gallery was trimmed to a single row per product, which is that
    // product's own photograph.
    const gallery = galleryRows
      .filter((row) => row.productId === product.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    for (const row of gallery) {
      await db
        .update(productGalleryImages)
        .set({
          imageUrl: hero.url,
          cloudinaryPublicId: hero.publicId,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(productGalleryImages.id, row.id));
    }

    console.log(
      `  ${product.slug}: hero + ${currentImages.length} image row(s) + ${gallery.length} gallery row(s)\n`,
    );
  }

  console.log(`done: ${uploaded.size} file(s) uploaded`);
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
