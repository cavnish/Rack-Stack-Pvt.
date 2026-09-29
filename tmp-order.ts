import { getProductFolderImages } from "@/lib/product-image-assets";

async function main() {
  for (const [slug, name] of [
    ["heavy-duty-pallet-racking", "Heavy Duty Pallet Racking"],
    ["compactor-storage-systems", "Compactor Storage Systems"],
  ] as const) {
    const images = await getProductFolderImages(slug, name);
    console.log(`\n=== ${slug} (${images.length}) ===`);
    images.forEach((item, index) => console.log(String(index).padStart(2), item.imageUrl));
  }
}

main().then(() => process.exit(0));
