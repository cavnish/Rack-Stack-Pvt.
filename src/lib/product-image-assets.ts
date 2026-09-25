import { readdir } from "node:fs/promises";
import path from "node:path";

export type ProductFolderImage = {
  id: string;
  imageUrl: string;
  altText: string;
  caption: string;
};

const productFolders = {
  "heavy-duty-long-span-racks": "HEAVY DUTY LONG SPAN RACKS",
  "heavy-duty-long-span-shelving-racks": "HEAVY DUTY LONG SPAN RACKS",
  "heavy-duty-pallet-racking": "HEAVY DUTY PALLET RACKING",
  "conventional-pallet-racking-system": "HEAVY DUTY PALLET RACKING",
  lockers: "LOCKERS",
  "medium-duty-shelving-racks": "MEDIUM DUTY SHELVING RACKS",
  "mezzanine-floor": "MEZZANINE FLOOR",
  "mobile-compactor-storage-system": "Mobile Compactor Storage System",
  "mobile-shelving-racks": "MOBILE SHELVING RACKS",
  "slotted-angle-racks": "SLOTTED ANGLE RACKS",
} as const;

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const fileCache = new Map<string, Promise<string[]>>();

function encodePath(value: string) {
  return encodeURIComponent(value);
}

function scanProductFolder(folder: string) {
  const cached = fileCache.get(folder);
  if (cached) return cached;
  const result = readdir(path.join(process.cwd(), "public", folder), { withFileTypes: true })
    .then((entries) => entries
      .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" })))
    .catch(() => []);
  fileCache.set(folder, result);
  return result;
}

export async function getProductFolderImages(slug: string, productName: string): Promise<ProductFolderImage[]> {
  const folder = productFolders[slug as keyof typeof productFolders];
  if (!folder) return [];
  const files = await scanProductFolder(folder);
  return files.map((file, index) => ({
    id: `${slug}-${index + 1}`,
    imageUrl: `/${encodePath(folder)}/${encodePath(file)}`,
    altText: file.toLowerCase() === "logo.png" ? `${productName} logo` : `${productName} image ${index + 1}`,
    caption: file.toLowerCase() === "logo.png" ? `${productName} logo` : `${productName} image ${index + 1}`,
  }));
}
