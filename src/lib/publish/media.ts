import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { stableImageUrl, toPublicFilePath } from "@/lib/public-asset-paths";

export type AssetGroup =
  | "hero"
  | "about"
  | "industries"
  | "products"
  | "applications"
  | "services"
  | "projects"
  | "clients"
  | "gallery"
  | "blog"
  | "misc";

export type CachedAsset = {
  url: string;
  width: number;
  height: number;
  aspectRatio: number;
  bytes: number;
  hash: string;
  source: string | null;
  cached: boolean;
};

const MAX_WIDTH: Record<AssetGroup, number> = {
  hero: 2000,
  about: 1400,
  industries: 1200,
  products: 1400,
  applications: 1200,
  services: 1400,
  projects: 1600,
  clients: 600,
  gallery: 1200,
  blog: 1400,
  misc: 1400,
};

const ASSET_ROOT = path.join(process.cwd(), "public", "assets", "images");
const MANIFEST_PATH = path.join(process.cwd(), "public", "assets", "media-manifest.json");

type ManifestEntry = CachedAsset & { group: AssetGroup; name: string; etag: string | null };
type Manifest = { version: 1; updatedAt: string; assets: Record<string, ManifestEntry> };

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg"]);
let manifestCache: Manifest | null = null;
let manifestWrite: Promise<void> = Promise.resolve();

function emptyManifest(): Manifest {
  return { version: 1, updatedAt: new Date(0).toISOString(), assets: {} };
}

async function readManifest(): Promise<Manifest> {
  if (manifestCache) return manifestCache;
  try {
    const parsed = JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as Manifest;
    manifestCache = parsed?.version === 1 && parsed.assets ? parsed : emptyManifest();
  } catch {
    manifestCache = emptyManifest();
  }
  return manifestCache;
}

function scheduleManifestWrite(manifest: Manifest) {
  manifest.updatedAt = new Date().toISOString();
  manifestWrite = manifestWrite
    .then(async () => {
      const target = MANIFEST_PATH;
      await mkdir(path.dirname(target), { recursive: true });
      const temporary = `${target}.${process.pid}.tmp`;
      await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
      await rename(temporary, target);
    })
    .catch(() => undefined);
}

export async function flushMediaManifest() {
  await manifestWrite;
}

export function slugifySegment(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "asset";
}

export function shortHash(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

export function isRemoteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function isLocalAsset(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

function groupDirectory(group: AssetGroup) {
  return path.join(ASSET_ROOT, group);
}

async function fileExists(target: string) {
  try {
    const info = await stat(target);
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

async function readLocalFile(absolutePath: string) {
  const extension = path.extname(absolutePath).toLowerCase();
  if (!imageExtensions.has(extension)) return null;
  if (extension === ".svg") {
    const stats = await stat(absolutePath);
    return { buffer: await readFile(absolutePath), width: 0, height: 0, bytes: stats.size };
  }
  const buffer = await readFile(absolutePath);
  const metadata = await sharp(buffer).metadata();
  return {
    buffer,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    bytes: buffer.byteLength,
  };
}

/**
 * Delivery URL for a Cloudinary original, narrowed to the width the group needs.
 *
 * Only the part *after* `/upload/` is rebuilt. Everything before it identifies
 * the account and the resource type — `https://res.cloudinary.com/<cloud_name>
 * /image/upload/...` — and assigning a bare `/upload/...` pathname drops both,
 * which produces a URL Cloudinary answers with 404. That failure is silent from
 * the caller's point of view: the download throws, `cacheImage` returns null and
 * the record publishes without an image even though the asset is perfectly
 * fine. Any existing transformation segments (`f_auto`, `w_1200`, `v<version>`)
 * are stripped so a size variant resolves to the same underlying photo.
 */
function buildFetchUrl(source: string, limitWidth: number) {
  try {
    const url = new URL(source);
    const uploadAt = url.pathname.indexOf("/upload/");
    if (url.hostname.endsWith("res.cloudinary.com") && uploadAt !== -1) {
      const prefix = url.pathname.slice(0, uploadAt);
      const afterUpload = url.pathname.slice(uploadAt + "/upload/".length);
      const cleaned = afterUpload
        .split("/")
        .filter((segment) => segment && !/^(f_auto|q_auto(:\S+)?|c_limit|w_\d+|dpr_\S+|fl_\S+)$/.test(segment) && !/^v\d+$/.test(segment))
        .join("/");
      url.pathname = `${prefix}/upload/f_jpg,q_auto:best,c_limit,w_${Math.min(limitWidth, 2000)}/${cleaned}`;
      url.search = "";
      return url.toString();
    }
    return url.toString();
  } catch {
    return source;
  }
}

export type SourceProbe = { ok: boolean; status: number; bytes: number };

/**
 * Confirms a remote image URL actually serves bytes right now.
 *
 * Used before a record is published so a URL that no longer resolves fails the
 * save with a readable message instead of quietly publishing an image-less
 * page. A HEAD is tried first because it is cheap; some CDNs answer HEAD with an
 * error while serving GET perfectly well, so a failed HEAD falls back to a
 * one-byte ranged GET rather than being taken as proof the file is gone.
 */
export async function probeImageSource(source: string, timeoutMs = 10_000): Promise<SourceProbe> {
  const attempts: Array<{ method: "HEAD" | "GET"; headers: Record<string, string> }> = [
    { method: "HEAD", headers: {} },
    { method: "GET", headers: { range: "bytes=0-0" } },
  ];
  let status = 0;
  for (const attempt of attempts) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(source, {
        method: attempt.method,
        headers: attempt.headers,
        signal: controller.signal,
        redirect: "follow",
      });
      status = response.status;
      if (!response.ok) continue;
      let bytes = Number(response.headers.get("content-length") ?? "0");
      if (attempt.method === "GET" && bytes === 0) {
        const body = await response.arrayBuffer();
        bytes = body.byteLength;
      }
      return { ok: bytes > 0, status: response.status, bytes };
    } catch {
      // A timeout or DNS failure is retried with the next method.
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, status, bytes: 0 };
}

/**
 * `probeImageSource` with a second attempt, for checks that run immediately
 * after an upload. A freshly created Cloudinary asset is normally live at once,
 * but the CDN is not a transactional store and a save that races it would
 * otherwise store a URL the visitor cannot load.
 */
export async function verifyImageSource(source: string, timeoutMs = 10_000): Promise<SourceProbe> {
  const first = await probeImageSource(source, timeoutMs);
  if (first.ok) return first;
  await new Promise((resolve) => setTimeout(resolve, 500));
  return probeImageSource(source, timeoutMs);
}

async function download(source: string, limitWidth: number) {
  const target = buildFetchUrl(source, limitWidth);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(target, {
      signal: controller.signal,
      headers: { accept: "image/*,*/*" },
    });
    // The rewritten URL is quoted because it is the one thing that can be wrong:
    // a malformed transformation address reports a bare "404" that looks like a
    // missing asset and is not one.
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${target}`);
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) throw new Error(`Empty response body from ${target}`);
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Cheap revalidation for an already-cached remote asset. Cloudinary keeps the URL
 * stable when a file is overwritten, so identity alone would serve a stale image.
 *
 * A HEAD that *fails* must report "changed", not "unchanged": that is the case
 * where the original has been deleted (a Cloudinary `destroy` from a replaced
 * upload) or the account is unreachable, and keeping the copy is exactly the
 * "site silently serves the old image" behaviour this layer exists to prevent.
 * A HEAD that succeeds without a validator header still proves the asset is
 * there, so the cached copy is kept rather than re-downloaded on every publish.
 */
async function remoteUnchanged(source: string, etag: string | null) {
  if (!etag) return true;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(source, { method: "HEAD", signal: controller.signal, redirect: "follow" });
      if (!response.ok) return false;
      const current = response.headers.get("etag") ?? response.headers.get("last-modified");
      return current === etag;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

async function writeVariant(buffer: Buffer, group: AssetGroup, name: string, hash: string) {
  const directory = groupDirectory(group);
  // A group added after the initial sync has no directory yet; sharp cannot
  // create one, so the first write for a new group would fail.
  await mkdir(directory, { recursive: true });
  const target = path.join(directory, `${name}-${hash}.webp`);
  if (await fileExists(target)) return target;
  const pipeline = sharp(buffer, { failOn: "none" }).rotate();
  const limited = limitWidthFor(group, pipeline);
  await limited.webp({ quality: 82, effort: 5, smartSubsample: true }).toFile(target);
  return target;
}

function limitWidthFor(group: AssetGroup, pipeline: sharp.Sharp) {
  const maxWidth = MAX_WIDTH[group];
  return pipeline.resize({ width: maxWidth, withoutEnlargement: true, fit: "inside" });
}

export type CacheImageOptions = {
  group: AssetGroup;
  name: string;
  /** Stable identity of the record the image belongs to, e.g. "product:heavy-duty-pallet-racking". */
  entityKey?: string;
  alt?: string | null;
};

/**
 * Downloads a remote asset once, optimizes it to WebP, and stores it under
 * public/assets/images/<group>/<name>-<hash>.webp. Repeat calls for the same
 * source reuse the cached file, so admin edits never re-download unchanged media.
 *
 * Local paths are passed through untouched (only measured for dimensions), and
 * they are written back exactly as they came in. That matters: the product
 * photographs in `public/` live in folders with spaces, and decoding the stored
 * path to read the file would emit `/HEAVY DUTY PALLET RACKING/x.jpg` into
 * `products.json` — a URL with literal spaces, which is not the address the file
 * is served from and which no cache will match. `stableImageUrl` keeps the
 * percent-encoding the database stored.
 */
export async function cacheImage(source: string | null | undefined, options: CacheImageOptions): Promise<CachedAsset | null> {
  const raw = typeof source === "string" ? source.trim() : "";
  if (!raw || raw === "undefined" || raw === "null") return null;

  const limitWidth = MAX_WIDTH[options.group];

  if (isLocalAsset(raw)) {
    const relative = toPublicFilePath(raw);
    const absolute = path.join(process.cwd(), "public", relative);
    if (!(await fileExists(absolute))) return null;
    const local = await readLocalFile(absolute).catch(() => null);
    if (!local) return null;
    // `stableImageUrl` re-appends the leading slash and keeps `%20` encoded, so
    // the published URL is the same string the CMS stored.
    return {
      url: stableImageUrl(raw),
      width: local.width,
      height: local.height,
      aspectRatio: local.width && local.height ? Number((local.width / local.height).toFixed(4)) : 0,
      bytes: local.bytes,
      hash: shortHash(relative),
      source: null,
      cached: true,
    };
  }

  if (!isRemoteUrl(raw)) return null;

  const manifest = await readManifest();
  const identity = `${options.group}:${raw}`;
  const existing = manifest.assets[identity];
  if (
    existing &&
    existing.source === raw &&
    (await fileExists(path.join(process.cwd(), "public", existing.url.replace(/^\/+/, "")))) &&
    (await remoteUnchanged(raw, existing.etag))
  ) {
    return { ...existing, cached: true };
  }

  try {
    const sourceBuffer = await download(raw, limitWidth);
    const probe = sharp(sourceBuffer, { failOn: "none" });
    const metadata = await probe.metadata();
    if (!metadata.width || !metadata.height) return null;

    const name = slugifySegment(options.name);
    const hash = shortHash(`${identity}|${metadata.width}x${metadata.height}`);
    const target = await writeVariant(sourceBuffer, options.group, name, hash);
    const written = await readFile(target);
    const writtenMetadata = await sharp(written).metadata();
    const width = writtenMetadata.width ?? metadata.width;
    const height = writtenMetadata.height ?? metadata.height;
    if (existing) await removeStaleVariant(existing, target);

    const asset: CachedAsset = {
      url: `/assets/images/${options.group}/${path.basename(target)}`,
      width,
      height,
      aspectRatio: height ? Number((width / height).toFixed(4)) : 0,
      bytes: written.byteLength,
      hash,
      source: raw,
      cached: false,
    };

    manifest.assets[identity] = {
      ...asset,
      group: options.group,
      name: options.name,
      etag: await headEtag(raw),
    };
    scheduleManifestWrite(manifest);
    return asset;
  } catch (error) {
    // Never swallow the reason: a silent null here looks identical to "already
    // cached" and hides broken remote URLs during publishing. The rewritten
    // delivery URL is in the message, so the fault is identifiable from the log
    // alone without re-deriving the transformation.
    console.error(
      `[media] failed to cache ${options.group}/${options.name} <- ${raw}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}

/** Drops the previous file for this identity once a newer variant has been written. */
async function removeStaleVariant(previous: ManifestEntry, currentTarget: string) {
  const previousPath = path.join(process.cwd(), "public", previous.url.replace(/^\/+/, ""));
  if (previousPath === currentTarget) return;
  try {
    const { unlink } = await import("node:fs/promises");
    await unlink(previousPath);
  } catch {
    // The old file may already be gone; nothing to clean up.
  }
}

async function headEtag(source: string) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(source, { method: "HEAD", signal: controller.signal, redirect: "follow" });
      if (!response.ok) return null;
      return response.headers.get("etag") ?? response.headers.get("last-modified");
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

export async function cacheImageOrKeep(group: AssetGroup, name: string, source: string | null | undefined, fallback: string | null, entityKey?: string) {
  const cached = await cacheImage(source, { group, name, entityKey });
  if (cached) return cached.url;
  return fallback;
}

/**
 * Resolves an already-generated local asset by group + base name, so curated
 * content can reference "/assets/images/hero/<name>-<hash>.webp" without
 * hard-coding the content hash. Returns null when nothing has been generated.
 */
export async function resolveLocalAsset(group: AssetGroup, name: string): Promise<string | null> {
  const manifest = await readManifest();
  for (const entry of Object.values(manifest.assets)) {
    if (entry.group === group && entry.name === name) {
      const absolute = path.join(process.cwd(), "public", entry.url.replace(/^\/+/, ""));
      if (await fileExists(absolute)) return entry.url;
    }
  }
  try {
    const entries = await readdir(groupDirectory(group));
    const match = entries.find((file) => file.startsWith(`${name}-`) && file.endsWith(".webp"));
    if (match) return `/assets/images/${group}/${match}`;
  } catch {
    return null;
  }
  return null;
}

/** True when the generated asset for this group + name is already on disk. */
export async function hasLocalAsset(group: AssetGroup, name: string) {
  return (await resolveLocalAsset(group, name)) !== null;
}

/**
 * Identity of the underlying photo, ignoring CDN transformation parameters, so
 * different size variants of one asset resolve to the same local file.
 */
function assetIdentity(source: string) {
  try {
    const url = new URL(source);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return source.split("?")[0].split("#")[0];
  }
}

/**
 * Resolves a remote source URL to its local copy using the live manifest.
 *
 * `src/lib/local-assets.ts` snapshots the manifest at module load, which is
 * correct for rendering but stale for the publish engine itself: assets cached
 * earlier in the same run are only in this module's in-memory copy. Publishing
 * uses this instead so a freshly cached file is recognised immediately.
 */
export async function resolveLocalAssetBySource(source: string, group?: AssetGroup): Promise<string | null> {
  if (!source) return null;
  const manifest = await readManifest();
  const identity = assetIdentity(source);
  const onDisk = async (entry: ManifestEntry) =>
    fileExists(path.join(process.cwd(), "public", entry.url.replace(/^\/+/, "")));
  const matches = Object.values(manifest.assets).filter((entry) => {
    if (!entry.source) return false;
    if (group && entry.group !== group) return false;
    return entry.source === source || assetIdentity(entry.source) === identity;
  });
  // Prefer an exact URL match, then the first size variant of the same photo.
  for (const entry of matches) if (entry.source === source && (await onDisk(entry))) return entry.url;
  for (const entry of matches) if (await onDisk(entry)) return entry.url;
  return null;
}

