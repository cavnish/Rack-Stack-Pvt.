import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const DATA_ROOT = path.join(process.cwd(), "src", "data");

export const collections = {
  site: "settings.json",
  seo: "seo.json",
  homepage: "homepage.json",
  homeOfferCards: "home-offer-cards.json",
  sliders: "home-sliders.json",
  products: "products.json",
  services: "services.json",
  projects: "projects.json",
  clientLogos: "client-logos.json",
  industries: "industries.json",
  gallery: "gallery.json",
  testimonials: "testimonials.json",
  blogCategories: "blog-categories.json",
  blogPosts: "blog-posts.json",
  faqs: "faqs.json",
  pages: "pages.json",
  redirects: "redirects.json",
  routes: "routes.json",
  videos: "videos.json",
} as const;

export type CollectionKey = keyof typeof collections;

const MANIFEST_FILE = "manifest.json";

export type PublishManifest = {
  version: 1;
  generatedAt: string;
  /** Per-collection fingerprint of the source data, used to skip redundant work. */
  collections: Record<string, { hash: string; generatedAt: string; count: number }>;
  /** Per-record fingerprint so a single product edit only rewrites that product. */
  records: Record<string, { hash: string; generatedAt: string }>;
};

const memory = new Map<string, { stamp: number; value: unknown }>();
let manifestCache: PublishManifest | null = null;
let manifestStamp = 0;
let pendingWrites: Promise<unknown> = Promise.resolve();

export const emptyManifest: PublishManifest = {
  version: 1,
  generatedAt: new Date(0).toISOString(),
  collections: {},
  records: {},
};

function filePath(key: CollectionKey) {
  return path.join(DATA_ROOT, collections[key]);
}

async function stampOf(target: string) {
  try {
    const info = await stat(target);
    return info.mtimeMs + info.size;
  } catch {
    return 0;
  }
}

export async function readCollection<T>(key: CollectionKey): Promise<T | null> {
  const target = filePath(key);
  const stamp = await stampOf(target);
  if (stamp === 0) return null;
  const cached = memory.get(key);
  if (cached && cached.stamp === stamp) return cached.value as T;
  try {
    const value = JSON.parse(await readFile(target, "utf8")) as T;
    memory.set(key, { stamp, value });
    return value;
  } catch {
    return null;
  }
}

/** Reads a collection and never returns null/empty, using the caller fallback. */
export async function readCollectionOr<T>(key: CollectionKey, fallback: T): Promise<T> {
  const value = await readCollection<T>(key);
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value) && value.length === 0) return fallback;
  return value;
}

export async function collectionExists(key: CollectionKey) {
  return (await stampOf(filePath(key))) > 0;
}

async function atomicWrite(target: string, contents: string) {
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, contents, "utf8");
  await rename(temporary, target);
  memory.delete(path.basename(target, ".json"));
}

export async function writeCollection(key: CollectionKey, value: unknown) {
  const target = filePath(key);
  await atomicWrite(target, `${JSON.stringify(value, null, 2)}\n`);
  memory.delete(key);
}

export async function writeCollectionQueued(key: CollectionKey, value: unknown) {
  pendingWrites = pendingWrites.then(() => writeCollection(key, value)).catch(() => undefined);
  return pendingWrites;
}

export async function flushWrites() {
  await pendingWrites;
}

export async function readManifest(): Promise<PublishManifest> {
  if (manifestCache) return manifestCache;
  try {
    const stamp = await stampOf(path.join(DATA_ROOT, MANIFEST_FILE));
    if (stamp === manifestStamp && manifestCache) return manifestCache;
    const parsed = JSON.parse(await readFile(path.join(DATA_ROOT, MANIFEST_FILE), "utf8")) as PublishManifest;
    manifestCache = parsed?.version === 1 ? parsed : { ...emptyManifest };
  } catch {
    manifestCache = { ...emptyManifest };
  }
  manifestStamp = await stampOf(path.join(DATA_ROOT, MANIFEST_FILE));
  return manifestCache;
}

export async function updateManifest(mutate: (manifest: PublishManifest) => void) {
  const manifest = await readManifest();
  mutate(manifest);
  manifest.generatedAt = new Date().toISOString();
  manifestCache = manifest;
  await atomicWrite(path.join(DATA_ROOT, MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

export async function listDataFiles() {
  try {
    return (await readdir(DATA_ROOT)).filter((file) => file.endsWith(".json"));
  } catch {
    return [] as string[];
  }
}

/** Drops every in-process cache so the next read re-reads from disk. */
export function invalidateMemory() {
  memory.clear();
  manifestCache = null;
  manifestStamp = 0;
}
