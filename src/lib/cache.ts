import "server-only";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

/**
 * The single cache tag every content read is filed under.
 *
 * The public content layer reads Neon through `cacheContent`, which uses the
 * Next.js incremental cache instead of writing JSON to disk. All of it carries
 * this one tag so an admin save can invalidate every stale read with a single
 * `revalidateTag` — a coarse tag is intentional: the collections are small and
 * cross-reference each other (a product change can alter a category listing, a
 * related-product strip and the sitemap), so per-collection tags would be a
 * promise the readers cannot keep without re-deriving every dependency.
 */
export const CONTENT_CACHE_TAG = "cms-content";

/**
 * Caches a database read behind the Next.js incremental cache.
 *
 * `unstable_cache` serialises its result as JSON, so the caller must revive any
 * `Date` columns after the read — `reviveDeep` in `publish/types` does that.
 *
 * The incremental cache only exists inside a Next.js process. A plain Node
 * process (a CLI script, a unit test) has no static generation store and the
 * call throws `Invariant: incrementalCache missing`; rather than turn a data
 * read into a crash there, the loader simply runs uncached.
 */
export async function cacheContent<T>(keyParts: string[], loader: () => Promise<T>): Promise<T> {
  try {
    return await unstable_cache(loader, keyParts, { tags: [CONTENT_CACHE_TAG], revalidate: false })();
  } catch (error) {
    if (error instanceof Error && /incrementalcache|invariant|static generation store/i.test(error.message)) {
      return loader();
    }
    throw error;
  }
}

/**
 * Invalidates every cached content read and the rendered layout beneath it.
 *
 * Both halves are required: `revalidateTag` drops the database reads, and
 * `revalidatePath` drops the routes that were already built from them. Without
 * the tag, a re-rendered page would read the same stale cached row; without the
 * path, the page would keep serving its previous render.
 *
 * Safe to call outside a request scope (the offline CLI publish): Next.js throws
 * an invariant there and there is simply nothing to invalidate.
 */
export function revalidateContent() {
  try {
    revalidateTag(CONTENT_CACHE_TAG, "max");
  } catch {
    // No request scope: nothing to invalidate.
  }
  try {
    revalidatePath("/", "layout");
  } catch {
    // No request scope: nothing to invalidate.
  }
}
