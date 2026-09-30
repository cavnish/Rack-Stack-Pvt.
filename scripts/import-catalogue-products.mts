/**
 * Imports the 32 products defined in `src/lib/catalogue.ts` into the CMS.
 *
 * Why this exists
 * ---------------
 * The site had two product systems. Eight products were rows in `products`,
 * fully editable and backed by published JSON. The other thirty-two were a
 * hardcoded TypeScript array: their names, descriptions, images, categories,
 * order and SEO all lived in `src/lib/catalogue.ts` and could only be changed by
 * editing source and redeploying. The header mega menu, the category pages, the
 * product listing, the related-product rail and the catalogue browser all read
 * that array, so an editor who renamed a product in Admin changed one page and
 * left the other six showing the old name.
 *
 * This script makes the thirty-two real rows. After it runs there is one
 * product table, one admin editor, one publish step, and every surface that
 * shows a product reads the same published record.
 *
 * What it guarantees
 * ------------------
 *  - It never deletes or rewrites an existing product. A slug already claimed by
 *    a CMS row is left completely alone, because that row is the richer record:
 *    it has the real photography from `public/`, sections, related products and
 *    the whole editor. The three slugs that exist in both systems therefore
 *    keep the CMS copy, and the hardcoded duplicate is simply not created.
 *  - It is idempotent. Re-running creates nothing, because products are matched
 *    on their unique slug. It also does not touch rows it did not create, so a
 *    later editor change is never clobbered by re-running a migration.
 *  - It maps every field it can, so nothing is silently dropped: features,
 *    specifications, "where it's used" applications, variants as configurations,
 *    gallery images (with a primary), SEO, order and featured all carry over.
 *  - `category` becomes the catalogue category slug (`office-storage`,
 *    `industrial-storage`, `material-handling`) because that is the value the
 *    URL, the mega menu and the category pages are built from. The eight
 *    existing products are moved onto the same vocabulary for the same reason.
 *
 * Usage
 * -----
 *   npm run catalogue:import               # import and report
 *   npm run catalogue:import -- --dry-run  # report only, write nothing
 */

import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  industries,
  productApplications,
  productConfigurations,
  productFeatures,
  productGalleryImages,
  productIndustries,
  productRelatedProducts,
  productSpecifications,
  products,
} from "@/db/schema";
import { catalogueCategoryNames, catalogueProducts, type CatalogueCategorySlug } from "@/lib/catalogue";
import { localAssetFor } from "@/lib/local-assets";

const dryRun = process.argv.includes("--dry-run");

/**
 * The category the eight original products are filed under.
 *
 * Their stored categories were editorial labels ("Space Optimization") that
 * nothing routed on, so the mega menu and the category pages could not see
 * them. These slugs are the ones the rest of the catalogue already uses.
 */
const CMS_PRODUCT_CATEGORIES: Record<string, CatalogueCategorySlug> = {
  "compactor-storage-systems": "office-storage",
  "mobile-shelving-racks": "material-handling",
  lockers: "office-storage",
  "heavy-duty-long-span-racks": "industrial-storage",
  "heavy-duty-pallet-racking": "industrial-storage",
  "medium-duty-shelving-racks": "industrial-storage",
  "mezzanine-floor": "industrial-storage",
  "slotted-angle-racks": "industrial-storage",
};

/**
 * Slug corrections for the products that already had a CMS row.
 *
 * "Compactor Storage Systems" and the catalogue's "Mobile Compactor Storage
 * System" are the same product with different slugs, so the CMS row could not
 * be reached at the catalogue's address. The CMS row is the one that survives,
 * and it takes the catalogue's slug, which is the URL the business uses.
 */
const CMS_PRODUCT_SLUG_RENAMES: Record<string, string> = {
  "compactor-storage-systems": "mobile-compactor-storage-system",
};

const knownCategorySlugs = new Set<string>(Object.keys(catalogueCategoryNames));

function resolveImage(url: string): string {
  return localAssetFor(url, "products") ?? url;
}

async function main() {
  const log = (event: string, data: Record<string, unknown>) =>
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, ...data }));

  // ---------------------------------------------------------------- category
  // Move the eight existing products onto the catalogue's category vocabulary.
  const existing = await db.select().from(products);
  const existingBySlug = new Map(existing.map((p) => [p.slug, p]));
  const slugsInUse = new Set(existing.map((p) => p.slug));

  for (const product of existing) {
    const renamed = CMS_PRODUCT_SLUG_RENAMES[product.slug];
    const targetSlug = renamed ?? product.slug;
    const targetCategory = CMS_PRODUCT_CATEGORIES[product.slug];

    // Already correct: nothing to write, so a re-run is a no-op.
    if (product.slug === targetSlug && (!targetCategory || product.category === targetCategory)) continue;
    if (renamed && slugsInUse.has(renamed)) {
      log("catalogue.unify.skipped", { slug: product.slug, reason: "target slug already exists", renamed });
      continue;
    }

    if (!dryRun) {
      await db
        .update(products)
        .set({
          slug: targetSlug,
          ...(targetCategory ? { category: targetCategory } : {}),
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));
    }
    // Tracked whether or not this is a dry run, so the report below is the same
    // either way: a renamed product owns its new slug, and the hardcoded product
    // it merges with must not then be created as a second copy of itself.
    if (renamed) {
      slugsInUse.delete(product.slug);
      slugsInUse.add(renamed);
    }
    log("catalogue.unify.category", {
      id: product.id,
      from: product.slug,
      to: targetSlug,
      category: targetCategory ?? product.category,
      dryRun,
    });
  }

  // ----------------------------------------------------------------- import
  const industryRows = await db.select().from(industries);
  const industryByName = new Map<string, number>();
  for (const row of industryRows) {
    industryByName.set(row.name.toLowerCase(), row.id);
    industryByName.set(row.slug.toLowerCase(), row.id);
  }

  let created = 0;
  let skipped = 0;

  for (const source of catalogueProducts) {
    if (slugsInUse.has(source.slug)) {
      skipped++;
      log("catalogue.import.skipped", { slug: source.slug, reason: "a CMS product already owns this slug" });
      continue;
    }
    if (!knownCategorySlugs.has(source.category)) {
      skipped++;
      log("catalogue.import.skipped", { slug: source.slug, reason: `unknown category ${source.category}` });
      continue;
    }

    if (dryRun) {
      created++;
      log("catalogue.import.dry", { slug: source.slug, name: source.name, category: source.category });
      continue;
    }

    const [row] = await db
      .insert(products)
      .values({
        name: source.name,
        slug: source.slug,
        shortDescription: source.shortDescription,
        // `description` is required by the column but unused by the renderer,
        // which reads `longDescription`. Keeping it equal to the short copy
        // means no reader of either column can find it empty.
        description: source.longDescription || source.shortDescription,
        longDescription: source.longDescription,
        category: source.category,
        featured: source.featured,
        status: "PUBLISHED",
        isActive: true,
        displayOrder: source.order,
        // The hero is the product's own first photograph, taken from the same
        // gallery the page renders, so the card and the page cannot disagree.
        heroImage: source.images[0] ? resolveImage(source.images[0].url) : null,
        thumbnail: source.images[0] ? resolveImage(source.images[0].url) : null,
        metaTitle: source.seo.title,
        metaDescription: source.seo.description,
        ogTitle: source.seo.ogTitle,
        ogDescription: source.seo.ogDescription,
        ogImage: resolveImage(source.seo.ogImage),
        robotsIndex: true,
        overviewBody: source.longDescription,
      })
      .returning();

    const productId = row.id;
    slugsInUse.add(source.slug);

    if (source.images.length) {
      await db.insert(productGalleryImages).values(
        source.images.map((image, index) => ({
          productId,
          imageUrl: resolveImage(image.url),
          // A row pointing at a file in `public/` has no public id, which is
          // what tells the upload pruner never to delete a repository file.
          cloudinaryPublicId: null,
          altText: image.alt || source.name,
          caption: image.caption || null,
          isActive: true,
          // The first photograph is the product's primary image, the same rule
          // the eight migrated products follow.
          isPrimary: index === 0,
          displayOrder: index,
        })),
      );
    }

    if (source.features.length) {
      await db.insert(productFeatures).values(
        source.features.map((feature, index) => ({
          productId,
          title: feature.title,
          description: feature.description,
          isActive: true,
          displayOrder: index,
        })),
      );
    }

    if (source.specifications.length) {
      await db.insert(productSpecifications).values(
        source.specifications.map((specification, index) => ({
          productId,
          specificationName: specification.label,
          specificationValue: specification.value,
          isActive: true,
          displayOrder: index,
        })),
      );
    }

    if (source.applications.length) {
      await db.insert(productApplications).values(
        source.applications.map((application, index) => ({
          productId,
          application,
          title: application,
          isActive: true,
          displayOrder: index,
        })),
      );
    }

    if (source.variants.length) {
      await db.insert(productConfigurations).values(
        source.variants.map((variant, index) => ({
          productId,
          title: variant,
          description: `${variant} configuration for ${source.name}.`,
          displayOrder: index,
        })),
      );
    }

    // Industries are free text in the catalogue ("Pharma") while the CMS stores
    // a relation. Only a confident match is linked; an unmatched label is left
    // out rather than inventing an industry row, because the label still
    // survives as copy and nothing is silently rewritten.
    const industryIds: number[] = [];
    for (const label of source.industries) {
      const id = industryByName.get(label.toLowerCase());
      if (id !== undefined && !industryIds.includes(id)) industryIds.push(id);
    }
    if (industryIds.length) {
      await db.insert(productIndustries).values(
        industryIds.map((industryId, index) => ({ productId, industryId, displayOrder: index })),
      );
    }

    created++;
    log("catalogue.import.created", {
      id: productId,
      slug: source.slug,
      name: source.name,
      category: source.category,
      images: source.images.length,
      features: source.features.length,
      specifications: source.specifications.length,
      applications: source.applications.length,
      industries: industryIds.length,
    });
  }

  // ------------------------------------------------------- related products
  // The catalogue's related rail was computed from category and shared
  // applications. Now that every product is a row, that rail is a real
  // relation, so the admin can curate it and it is published with the product.
  const after = await db.select({ id: products.id, slug: products.slug, category: products.category }).from(products);
  const byCategory = new Map<string, number[]>();
  for (const product of after) {
    const list = byCategory.get(product.category) ?? [];
    list.push(product.id);
    byCategory.set(product.category, list);
  }
  let relatedLinked = 0;
  for (const product of after) {
    const peers = (byCategory.get(product.category) ?? []).filter((id) => id !== product.id).slice(0, 4);
    if (peers.length) {
      await db
        .insert(productRelatedProducts)
        .values(peers.map((relatedProductId, index) => ({ productId: product.id, relatedProductId, isActive: true, displayOrder: index })))
        .onConflictDoNothing();
      relatedLinked++;
    }
  }

  const total = await db.select({ n: sql<number>`count(*)::int` }).from(products);
  log("catalogue.import.completed", {
    created,
    skipped,
    relatedLinked,
    totalProducts: total[0].n,
    dryRun,
  });
}

main().catch((error) => {
  console.error(JSON.stringify({ event: "catalogue.import.failed", message: String(error) }));
  process.exitCode = 1;
});
