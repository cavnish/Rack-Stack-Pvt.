import "dotenv/config";
import { cacheImage, flushMediaManifest, type AssetGroup } from "../src/lib/publish/media";
import { catalogueProducts } from "../src/lib/catalogue";

/**
 * Downloads the remote editorial imagery the CMS/seed layer references and
 * stores optimized WebP copies under public/assets/images/<group>/.
 * Local files that already exist in public/ are only measured, never re-downloaded.
 */
const assets: Array<{ group: AssetGroup; name: string; source: string }> = [
  { group: "hero", name: "warehouse-pallet-storage-hero", source: "https://images.pexels.com/photos/4487363/pexels-photo-4487363.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=2000" },
  { group: "hero", name: "rack-and-stack-site-hero", source: "/Hero.jpeg" },
  { group: "about", name: "organised-storage-aisle", source: "https://images.pexels.com/photos/4170172/pexels-photo-4170172.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" },
  { group: "products", name: "forklift-alongside-pallet-racking", source: "https://images.pexels.com/photos/8760709/pexels-photo-8760709.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" },
  { group: "gallery", name: "warehouse-storage-layout", source: "https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" },
  { group: "services", name: "industrial-shelving-installation", source: "https://images.pexels.com/photos/36126272/pexels-photo-36126272.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" },
  { group: "products", name: "industrial-racking-systems", source: "https://images.pexels.com/photos/36126305/pexels-photo-36126305.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" },
  { group: "services", name: "storage-system-installation", source: "https://images.pexels.com/photos/4483860/pexels-photo-4483860.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" },
  { group: "products", name: "long-span-storage", source: "https://images.pexels.com/photos/1797415/pexels-photo-1797415.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" },
  { group: "misc", name: "india-network-map", source: "/INDIA.png" },
  { group: "misc", name: "footer-warehouse-backdrop", source: "/Footer%20imagesbg.png" },
  { group: "applications", name: "app-warehouse-storage", source: "https://images.pexels.com/photos/1797415/pexels-photo-1797415.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900" },
  { group: "applications", name: "app-manufacturing-plant", source: "https://images.pexels.com/photos/236705/pexels-photo-236705.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900" },
  { group: "applications", name: "app-retail-showroom", source: "https://images.pexels.com/photos/1005638/pexels-photo-1005638.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900" },
  { group: "applications", name: "app-pharma-healthcare", source: "https://images.pexels.com/photos/35285858/pexels-photo-35285858.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900" },
  { group: "applications", name: "app-cold-storage-food", source: "https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900" },
  { group: "applications", name: "app-ecommerce-fulfilment", source: "https://images.pexels.com/photos/4393426/pexels-photo-4393426.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900" },
  { group: "applications", name: "app-automotive-garage", source: "https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900" },
  { group: "applications", name: "app-office-records", source: "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900" },
  { group: "applications", name: "app-garment-textile", source: "https://images.pexels.com/photos/5632376/pexels-photo-5632376.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900" },
  { group: "applications", name: "app-education-campus", source: "https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900" },
  { group: "applications", name: "app-tools-workshop", source: "https://images.pexels.com/photos/4489749/pexels-photo-4489749.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900" },
];

/**
 * Every distinct image referenced by the product catalogue, cached under the
 * "products" group so catalogueImage() can resolve a local file.
 */
function catalogueAssets(): Array<{ group: AssetGroup; name: string; source: string }> {
  const seen = new Set<string>();
  const output: Array<{ group: AssetGroup; name: string; source: string }> = [];
  for (const product of catalogueProducts) {
    for (const image of product.images) {
      if (!image.url || seen.has(image.url)) continue;
      seen.add(image.url);
      const file = image.url.split("/").pop()?.split("?")[0] ?? "catalogue-image";
      output.push({ group: "products", name: `catalogue-${file.replace(/\.[^.]+$/, "")}`, source: image.url });
    }
  }
  return output;
}

async function run() {
  let downloaded = 0;
  let reused = 0;
  let failed = 0;
  const queue = [...assets, ...catalogueAssets()];
  for (const asset of queue) {
    let result: Awaited<ReturnType<typeof cacheImage>> = null;
    try {
      result = await cacheImage(asset.source, { group: asset.group, name: asset.name });
    } catch (error) {
      failed += 1;
      console.error(`ERROR   ${asset.group}/${asset.name} <- ${asset.source}`);
      console.error(`        ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    if (!result) {
      failed += 1;
      console.error(`FAILED  ${asset.group}/${asset.name} <- ${asset.source}`);
      continue;
    }
    if (result.cached) reused += 1;
    else downloaded += 1;
    console.log(
      `OK      ${result.url}  ${result.width}x${result.height}  ${(result.bytes / 1024).toFixed(0)}KB  ${result.cached ? "(reused)" : "(new)"}`,
    );
  }
  await flushMediaManifest();
  console.log(`\n${downloaded} new, ${reused} reused, ${failed} failed`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
