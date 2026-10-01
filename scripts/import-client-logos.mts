import "dotenv/config";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../src/db";
import { clientLogos } from "../src/db/schema";
import { readLocalClientLogoFiles } from "../src/lib/client-assets";

/**
 * Brings `client_logos` in line with the logo files in `public/`.
 *
 * Safe to run repeatedly: rows are matched on the image path first and on the
 * client name second, so a re-run updates names and alt text in place instead of
 * duplicating the roster.
 *
 * Matching on the name is what migrates the old placeholder rows. The table was
 * seeded with eight client names and no image at all; those names are real
 * clients whose logo files are in the repository, so the row is adopted and given
 * its file rather than being thrown away. A placeholder with no matching file is
 * left untouched — an editor may have typed it in on purpose.
 */
async function main() {
  const [files, existing] = await Promise.all([
    readLocalClientLogoFiles(),
    db.select().from(clientLogos),
  ]);

  if (files.length === 0) {
    console.error("No logo files found in public/rack-and-stack-clients; nothing to import.");
    process.exitCode = 1;
    return;
  }

  const byImageUrl = new Map(existing.map((row) => [row.imageUrl, row]));
  const byName = new Map(existing.map((row) => [row.name.trim().toLowerCase(), row]));

  let added = 0;
  let updated = 0;
  let order = 0;
  /** Rows this run gave a real image, so they are not mistaken for orphans. */
  const adopted = new Set<number>();

  for (const file of files) {
    order += 1;
    const key = file.name.trim().toLowerCase();
    const current = byImageUrl.get(file.imageUrl) ?? byName.get(key);
    const altText = current?.altText?.trim() ? current.altText : file.altText;

    if (!current) {
      const [row] = await db
        .insert(clientLogos)
        .values({
          name: file.name,
          imageUrl: file.imageUrl,
          imagePublicId: null,
          altText,
          sortOrder: order,
          isActive: true,
        })
        .returning({ id: clientLogos.id });
      adopted.add(row.id);
      added += 1;
      continue;
    }

    adopted.add(current.id);

    // A local `/rack-and-stack-clients/...` path is a file in the repository, so
    // it never carries a Cloudinary public id. Adopting one onto a row that
    // still held the id of a remote original would let the next save destroy an
    // asset the row is no longer using.
    const needsWrite =
      current.imageUrl !== file.imageUrl ||
      current.altText !== altText ||
      current.sortOrder !== order ||
      current.imagePublicId !== null;
    if (!needsWrite) continue;

    await db
      .update(clientLogos)
      .set({
        name: file.name,
        imageUrl: file.imageUrl,
        imagePublicId: null,
        altText,
        sortOrder: order,
        updatedAt: new Date(),
      })
      .where(eq(clientLogos.id, current.id));
    updated += 1;
  }

  // A row with no image renders as an empty tile in the marquee and a "No image"
  // box in the admin, and it is filtered out of the published set — so it is
  // invisible on the site while still occupying a slot in the CMS.
  //
  // Re-read before deciding: the loop above may have just given one of these rows
  // a real image, and deleting on a stale snapshot throws away the row it filled
  // in. Anything still without an image and not part of the roster is a leftover.
  const current = await db.select().from(clientLogos);
  const rosterImages = new Set(files.map((file) => file.imageUrl));
  const orphans = current.filter(
    (row) => !row.imageUrl.trim() && !rosterImages.has(row.imageUrl) && !adopted.has(row.id),
  );
  if (orphans.length) {
    await db.delete(clientLogos).where(inArray(clientLogos.id, orphans.map((row) => row.id)));
  }

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(clientLogos);
  const [{ missing }] = await db
    .select({ missing: sql<number>`count(*)::int` })
    .from(clientLogos)
    .where(eq(clientLogos.imageUrl, ""));

  console.log(
    `client_logos: ${files.length} files, ${added} added, ${updated} updated, ` +
      `${orphans.length} image-less rows removed, ${total} rows, ${missing} without an image.`,
  );
  console.log("Next: npm run publish -- client-logos");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
