/**
 * Lists the product photographs that already exist in `public/`.
 *
 * Why this exists
 * ---------------
 * Every product folder in this repository was populated before the CMS existed:
 * 71 real photographs across eight folders, none of which the admin could see.
 * The only way to put one on a product page was to re-upload a file the project
 * already had, which is slow, produces a second copy in Cloudinary, and silently
 * breaks the rule that a file in `public/` is a stable, hand-editable asset.
 *
 * This endpoint is the other half of the fix: it reads the same discovery
 * function the import script used, so the picker offers exactly the images the
 * importer would have registered — no more, and no logos, which the scan filters
 * out for the same reason.
 *
 * The list is derived from the file system, not from the database, so it keeps
 * working when the database is unavailable and cannot drift from what is
 * actually on disk. Nothing here writes: selecting an image hands its URL to the
 * editor, which saves it as an ordinary gallery row.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listProductAssetFolders, resolveProductAssetFolder, getProductFolderImages } from "@/lib/product-image-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type PublicProductImage = {
  imageUrl: string;
  altText: string;
  label: string;
  folder: string;
};

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const slug = new URL(request.url).searchParams.get("slug")?.trim() ?? "";

    /**
     * With a slug, the answer is that one product's folder — the picker's
     * "browse this product's photos" case. Without one, every product folder,
     * so an editor can reach a photograph belonging to a product they are not
     * currently editing.
     */
    if (slug) {
      const folder = await resolveProductAssetFolder(slug, undefined);
      if (!folder) return NextResponse.json({ images: [] });
      const images = await getProductFolderImages(slug, folder.folder);
      return NextResponse.json({
        images: images.map((image) => ({
          imageUrl: image.imageUrl,
          altText: image.altText,
          label: image.label,
          folder: folder.folder,
        })),
      });
    }

    const folders = await listProductAssetFolders();
    const images: PublicProductImage[] = [];
    for (const entry of folders) {
      /**
       * `getProductFolderImages` is what the import script registers from, so
       * going through it here keeps the alt text and label the editor will see
       * identical to the ones the migration wrote.
       */
      const folderImages = await getProductFolderImages(entry.slug, entry.folder);
      for (const image of folderImages) {
        images.push({
          imageUrl: image.imageUrl,
          altText: image.altText,
          label: image.label,
          folder: entry.folder,
        });
      }
    }
    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not read product images" },
      { status: 500 },
    );
  }
}
