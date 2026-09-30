import "dotenv/config";
import { asc, eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { productGalleryImages, productImages, products } from "../src/db/schema";

/** Read-only snapshot of what the live database actually holds. */
async function main() {
  const rows = await db.select().from(products).orderBy(asc(products.displayOrder));
  for (const product of rows) {
    const gallery = await db
      .select()
      .from(productGalleryImages)
      .where(eq(productGalleryImages.productId, product.id))
      .orderBy(asc(productGalleryImages.displayOrder));
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.displayOrder));

    console.log(`\n=== ${product.slug} (id ${product.id}) status=${product.status} ===`);
    console.log(`  heroImage : ${product.heroImage ?? "null"}`);
    console.log(`  thumbnail : ${product.thumbnail ?? "null"}`);
    images.forEach((im, i) =>
      console.log(`  images[${i}] : ${im.imageUrl}  publicId=${im.cloudinaryPublicId ?? "null"}`),
    );
    gallery.forEach((g, i) =>
      console.log(
        `  gallery[${i}]: order=${g.displayOrder} active=${g.isActive} slot=${g.slot} url=${g.imageUrl} publicId=${g.cloudinaryPublicId ?? "null"}`,
      ),
    );
  }
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
