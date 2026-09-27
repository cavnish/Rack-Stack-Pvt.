import manifest from "../../public/assets/media-manifest.json";

/**
 * Build-time lookup from a remote media URL to its local cached copy.
 *
 * `npm run assets:sync` (and the publish engine) write the manifest, so this
 * map lets modules that must stay synchronous — the product catalogue, for
 * example — reference local files without touching the filesystem at runtime.
 * A missing entry simply falls back to the original remote URL.
 */
type ManifestEntry = { url: string; source: string | null; group: string };
type Manifest = { assets: Record<string, ManifestEntry> };

const assets = (manifest as Manifest).assets ?? {};

/**
 * Identity of the underlying photo, ignoring CDN transformation parameters.
 *
 * The same Pexels/Cloudinary asset is referenced at several sizes across the
 * site (?h=900&w=1600, ?h=1200&w=2000, ...). Those are the same file, so a
 * size variant must still resolve to the copy already on disk rather than
 * falling back to a remote request.
 */
function assetIdentity(source: string) {
  try {
    const url = new URL(source);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return source.split("?")[0].split("#")[0];
  }
}

const bySource = new Map<string, string>();
const byIdentity = new Map<string, string>();
const byGroupAndSource = new Map<string, string>();
const byGroupAndIdentity = new Map<string, string>();

for (const entry of Object.values(assets)) {
  if (!entry.source || !entry.url) continue;
  const identity = assetIdentity(entry.source);
  if (!bySource.has(entry.source)) bySource.set(entry.source, entry.url);
  if (!byIdentity.has(identity)) byIdentity.set(identity, entry.url);
  const scoped = `${entry.group}:${entry.source}`;
  if (!byGroupAndSource.has(scoped)) byGroupAndSource.set(scoped, entry.url);
  const scopedIdentity = `${entry.group}:${identity}`;
  if (!byGroupAndIdentity.has(scopedIdentity)) byGroupAndIdentity.set(scopedIdentity, entry.url);
}

export function localAssetFor(source: string | null | undefined, group?: string) {
  if (!source) return null;
  if (source.startsWith("/") && !source.startsWith("//")) return source;
  if (group) {
    return (
      byGroupAndSource.get(`${group}:${source}`) ?? byGroupAndIdentity.get(`${group}:${assetIdentity(source)}`) ?? null
    );
  }
  return bySource.get(source) ?? byIdentity.get(assetIdentity(source)) ?? null;
}

export function hasLocalAssets() {
  return bySource.size > 0;
}
