import "dotenv/config";
import { asc, eq, inArray } from "drizzle-orm";
import { db, pool } from "../src/db";
import { productGalleryImages, products } from "../src/db/schema";

/**
 * One-off: reduce each product's gallery to the single image that is genuinely
 * its own, so the unlimited-gallery renderer does not publish the six-slot
 * placeholder rows the previous release seeded.
 *
 * The seeder gave every product the same five generic images in slots 1-5, so
 * publishing as-is would have put mobile-shelving-racks' photo in Lockers'
 * "Build detail" slot. The kept row is the one already stored as the product's
 * `heroImage`, which is the one image per product that is actually correct.
 *
 * Only the database rows are removed. No Cloudinary asset is deleted: each
 * dropped image is still referenced as some product's hero or `product_images`
 * row, and the admin save path prunes genuinely orphaned assets anyway.
 */
async function main() {
  const rows = await db.select().from(products).orderBy(asc(products.displayOrder));

  let totalKept = 0;
  let totalDeleted = 0;

  for (const product of rows) {
    const gallery = await db
      .select()
      .from(productGalleryImages)
      .where(eq(productGalleryImages.productId, product.id))
      .orderBy(asc(productGalleryImages.displayOrder));

    if (gallery.length <= 1) {
      totalKept += gallery.length;
      console.log(`${product.slug}: already ${gallery.length} image(s), left alone`);
      continue;
    }

    const own = gallery.find((row) => row.imageUrl === product.heroImage) ?? gallery[0];
    const doomed = gallery.filter((row) => row.id !== own.id).map((row) => row.id);

    await db
      .update(productGalleryImages)
      .set({ displayOrder: 0, isActive: true })
      .where(eq(productGalleryImages.id, own.id));
    await db.delete(productGalleryImages).where(inArray(productGalleryImages.id, doomed));

    totalKept += 1;
    totalDeleted += doomed.length;
    console.log(
      `${product.slug}: kept "${own.slot ?? "gallery"}" (${own.imageUrl.split("/").pop()}) ` +
        `at order 0, deleted ${doomed.length}`,
    );
  }

  console.log(`\nkept ${totalKept} row(s), deleted ${totalDeleted} row(s)`);
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
