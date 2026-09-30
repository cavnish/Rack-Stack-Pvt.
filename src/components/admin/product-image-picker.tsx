"use client";

/**
 * Browses the product photographs that already exist in `public/`.
 *
 * Why this exists
 * ---------------
 * The repository shipped with 71 real product photographs in eight folders, all
 * of them predating the CMS. Until the picker existed the only way to put one on
 * a product page was to re-upload a file the project already contained, which
 * uploaded a second copy to Cloudinary and lost the "edit the file in the repo"
 * workflow. The listing is served by `/api/admin/product-images`, which reads the
 * same discovery code as the import script, so what is offered here is exactly
 * what the migration would have registered.
 *
 * The chosen image is passed back as a plain URL. It becomes an ordinary gallery
 * row with no `cloudinaryPublicId`, which is the signal that the file is a
 * repository asset rather than an upload — so saving the product will not let the
 * upload pruner destroy it.
 */

import { useEffect, useState } from "react";
import { ImageOff, Loader2, Search, X } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";
import { optimizeImage } from "@/lib/image-utils";

export type ExistingProductImage = {
  imageUrl: string;
  altText: string;
  label: string;
  folder: string;
};

export function ProductImagePicker({
  open,
  onClose,
  onSelect,
  /** Only offer this product's own folder, for the per-row "add from folder" action. */
  slug,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (image: ExistingProductImage) => void;
  slug?: string;
}) {
  const [images, setImages] = useState<ExistingProductImage[]>([]);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [query, setQuery] = useState("");

  /**
   * Identifies one load. `""` when the dialog is shut, so reopening always
   * produces a new key and therefore a fresh fetch.
   *
   * Deriving the "am I loading" and "did this fail" answers from a comparison
   * against this key, rather than resetting them with `setState` at the top of the
   * effect, is what keeps the effect free of synchronous state updates. It also
   * removes a real bug rather than a lint-shaped one: a dialog reopened for a
   * different product could previously keep showing the previous product's
   * photographs, with the loading spinner hidden, until the new request landed.
   */
  const requestKey = open ? (slug ?? "*") : "";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      try {
        const url = slug ? `/api/admin/product-images?slug=${encodeURIComponent(slug)}` : "/api/admin/product-images";
        const response = await fetch(url);
        const data = (await response.json().catch(() => ({}))) as { images?: ExistingProductImage[]; error?: string };
        if (cancelled) return;
        if (!response.ok) {
          setFailure({ key: requestKey, message: data.error || "Could not load images." });
          return;
        }
        setImages(data.images ?? []);
        setLoadedKey(requestKey);
      } catch {
        if (!cancelled) setFailure({ key: requestKey, message: "Network error while loading images." });
      }
    })();

    // A slow response for a dialog that has since closed, or been reopened for a
    // different product, must not write into the new state.
    return () => {
      cancelled = true;
    };
  }, [open, slug, requestKey]);

  const loading = open && loadedKey !== requestKey;
  const error = failure?.key === requestKey ? failure.message : "";

  // Escape closes, so the dialog can be dismissed without reaching for the mouse.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? images.filter((image) =>
        [image.label, image.altText, image.folder, image.imageUrl].some((value) => value.toLowerCase().includes(needle)),
      )
    : images;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Choose an existing image">
      <button type="button" className="absolute inset-0 bg-zinc-900/60" onClick={onClose} aria-label="Close" />

      <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">Choose an existing image</h2>
            <p className="text-[.68rem] text-zinc-500">
              {slug ? "Photographs already in this product's folder." : "Every product photograph already in the site."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100" aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="border-b border-zinc-100 px-5 py-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <input
              className="admin-field pl-9"
              placeholder="Search by title, folder or file name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-10 text-[.7rem] font-semibold text-zinc-500">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Loading images…
            </p>
          ) : error ? (
            <p className="py-10 text-center text-[.7rem] font-semibold text-red-600">{error}</p>
          ) : visible.length === 0 ? (
            <p className="flex flex-col items-center gap-2 py-10 text-center text-[.7rem] font-semibold text-zinc-500">
              <ImageOff size={18} className="text-zinc-300" aria-hidden="true" />
              {images.length === 0 ? "No images found in the product folders." : "No image matches that search."}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((image) => (
                <li key={image.imageUrl}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(image);
                      onClose();
                    }}
                    className="group block w-full overflow-hidden rounded-lg border border-zinc-200 bg-white text-left transition hover:border-zinc-400 hover:shadow-sm"
                  >
                    <span className="relative block aspect-[4/3] overflow-hidden bg-zinc-100">
                      <SmartImage
                        src={optimizeImage(image.imageUrl, 400)}
                        alt={image.altText || image.label || "Product image"}
                        fill
                        sizes="240px"
                        className="object-cover transition group-hover:scale-[1.03]"
                      />
                    </span>
                    <span className="block px-2.5 py-2">
                      <span className="block truncate text-[.68rem] font-bold text-zinc-800">
                        {image.label || "Untitled image"}
                      </span>
                      <span className="block truncate text-[.6rem] text-zinc-400">{image.folder}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-zinc-200 px-5 py-2.5 text-[.65rem] text-zinc-500">
          {visible.length} of {images.length} image{images.length === 1 ? "" : "s"} shown. Choosing one adds it to the
          gallery; the file in the project is reused as-is and is never re-uploaded.
        </footer>
      </div>
    </div>
  );
}
