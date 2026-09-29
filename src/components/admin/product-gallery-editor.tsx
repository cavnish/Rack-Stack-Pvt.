"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Info, Trash2 } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";
import { optimizeImage } from "@/lib/image-utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export type GalleryRow = {
  /**
   * Legacy six-slot key. Optional and unused for ordering; kept so a row written
   * by the previous release still round-trips through the API unchanged.
   */
  slot?: string | null;
  imageUrl: string;
  /**
   * Named after the column, not the upload field: this is the row as the API
   * expects it, and the validator/`syncProductGallery` round trip keys off
   * `cloudinaryPublicId`.
   */
  cloudinaryPublicId?: string | null;
  /** Editor-facing title for this image. */
  label?: string | null;
  altText: string;
  caption: string;
  width?: number | null;
  height?: number | null;
  /** Hidden from the page without being deleted. */
  isActive?: boolean;
};

type UploadResult = {
  imageUrl: string;
  cloudinaryPublicId?: string | null;
  width?: number | null;
  height?: number | null;
};

/** A blank row to append. `imageUrl: ""` marks it as not yet filled. */
function emptyRow(): GalleryRow {
  return { slot: null, imageUrl: "", cloudinaryPublicId: null, label: "", altText: "", caption: "", width: null, height: null, isActive: true };
}

/**
 * The product gallery: a free list of images in editor-chosen order.
 *
 * This replaced a fixed grid of six named slots. Six views is a good default
 * layout, not a constraint — an editor with nine real photographs of one
 * product should be able to upload all nine and the page should show all nine.
 * So the editor renders exactly the rows that exist, appends on demand, and lets
 * the order be changed explicitly.
 *
 * Ordering is done with up/down buttons rather than drag-and-drop on purpose:
 * a keyboard user and a mouse user get the same affordance, and a list that only
 * reorders by dragging is unusable on a touch screen without a lot of extra work.
 * The first *active* row is the primary image for the hero, the product card and
 * the homepage, so the "Primary" badge marks what a reorder will actually change.
 */
export function ProductGalleryEditor({
  gallery,
  productName,
  onChange,
  onUploadBusy,
}: {
  gallery: GalleryRow[];
  productName: string;
  onChange: (rows: GalleryRow[]) => void;
  onUploadBusy?: (busy: boolean) => void;
}) {
  const [busyIndex, setBusyIndex] = useState<number | null>(null);

  function setBusy(index: number | null, busy: boolean) {
    setBusyIndex(busy ? index : null);
    onUploadBusy?.(busy);
  }

  function patch(index: number, changes: Partial<GalleryRow>) {
    onChange(gallery.map((row, position) => (position === index ? { ...row, ...changes } : row)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    onChange(next);
  }

  function remove(index: number) {
    onChange(gallery.filter((_, position) => position !== index));
  }

  function append() {
    onChange([...gallery, emptyRow()]);
  }

  // The first row the page will actually show. A hidden row at position 0 must
  // not steal the primary slot from the first visible image below it.
  const primaryIndex = gallery.findIndex((row) => row.isActive !== false && Boolean(row.imageUrl));

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-lg bg-zinc-50 p-3 text-[.68rem] leading-5 text-zinc-600">
        <Info size={14} className="mt-0.5 shrink-0 text-zinc-400" aria-hidden="true" />
        <span>
          Add as many images as the product needs — there is no upper limit. They appear on the page in
          the order shown here, and the first active image is used as the product&apos;s main image on
          the hero, its card and the homepage. Save the product to publish a change.
        </span>
      </p>

      {gallery.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-center text-[.7rem] font-semibold text-zinc-500">
          No gallery images yet. Add the first one below.
        </p>
      ) : null}

      {gallery.map((row, index) => {
        const filled = Boolean(row.imageUrl);
        const busy = busyIndex === index;
        const isPrimary = index === primaryIndex;

        return (
          <fieldset
            key={index}
            className={`rounded-xl border p-4 ${filled ? (row.isActive === false ? "border-zinc-200 bg-zinc-50/60" : "border-zinc-200 bg-white") : "border-dashed border-zinc-300 bg-zinc-50/60"}`}
          >
            <legend className="flex flex-wrap items-center gap-2 px-1">
              <span className="text-[.62rem] font-bold uppercase tracking-[.14em] text-zinc-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-bold text-zinc-900">{row.label?.trim() || "Untitled image"}</span>
              {isPrimary ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[.6rem] font-bold uppercase tracking-wider text-emerald-800">
                  Primary
                </span>
              ) : null}
              {filled && row.isActive === false ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[.6rem] font-bold uppercase tracking-wider text-amber-800">
                  Hidden
                </span>
              ) : null}
            </legend>

            <div className="mt-3 grid gap-4 lg:grid-cols-[200px_1fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                {filled ? (
                  <SmartImage
                    src={optimizeImage(String(row.imageUrl), 600)}
                    alt={row.altText || row.label || "Gallery image preview"}
                    fill
                    sizes="200px"
                    className={row.isActive === false ? "object-cover opacity-45" : "object-cover"}
                  />
                ) : (
                  <span className="grid h-full place-items-center px-4 text-center text-[.65rem] font-semibold text-zinc-400">
                    No image uploaded
                  </span>
                )}
              </div>

              <div className="min-w-0 space-y-3">
                <div>
                  <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">Gallery image</label>
                  <RowUpload
                    busy={busy}
                    onBusy={(next) => setBusy(index, next)}
                    onUploaded={(result) => {
                      if (!result.imageUrl) {
                        remove(index);
                        return;
                      }
                      patch(index, {
                        imageUrl: result.imageUrl,
                        cloudinaryPublicId: result.cloudinaryPublicId ?? null,
                        width: result.width ?? null,
                        height: result.height ?? null,
                        isActive: row.isActive !== false,
                      });
                    }}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">Title</label>
                    <input
                      className="admin-field"
                      value={row.label ?? ""}
                      placeholder="e.g. Warehouse Installation"
                      onChange={(event) => patch(index, { label: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">Caption</label>
                    <input
                      className="admin-field"
                      value={row.caption ?? ""}
                      placeholder="Shown under the main image"
                      onChange={(event) => patch(index, { caption: event.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">Alt text</label>
                  <input
                    className="admin-field"
                    value={row.altText ?? ""}
                    placeholder={`${productName}: describe what this image shows`}
                    onChange={(event) => patch(index, { altText: event.target.value })}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-[.65rem] font-bold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowUp size={12} aria-hidden="true" />
                      Move up
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === gallery.length - 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-[.65rem] font-bold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowDown size={12} aria-hidden="true" />
                      Move down
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => patch(index, { isActive: row.isActive === false })}
                    disabled={!filled}
                    className="inline-flex items-center gap-1.5 text-[.68rem] font-bold text-zinc-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {row.isActive === false ? <Eye size={13} aria-hidden="true" /> : <EyeOff size={13} aria-hidden="true" />}
                    {row.isActive === false ? "Show on page" : "Hide from page"}
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="inline-flex items-center gap-1.5 text-[.68rem] font-bold text-red-600 hover:underline"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </fieldset>
        );
      })}

      <button
        type="button"
        onClick={append}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3.5 py-2.5 text-[.7rem] font-bold text-zinc-800 hover:bg-zinc-50"
      >
        <ImagePlus size={14} aria-hidden="true" />
        Add image
      </button>

      <p className="text-[.68rem] leading-5 text-zinc-500">
        Uploads go to Cloudinary under <code className="font-mono">rack-stack/products</code>. Replacing
        or removing an image deletes the previous file when you save.
      </p>
    </div>
  );
}

/**
 * One row's file picker.
 *
 * Separate from the generic `ImageUpload` in the entity editor because that
 * widget is driven by field metadata; the gallery needs an identical control
 * repeated once per row, with its own busy state and its own remove action.
 */
function RowUpload({
  busy,
  onBusy,
  onUploaded,
}: {
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onUploaded: (result: UploadResult) => void;
}) {
  const [error, setError] = useState("");

  async function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Use a JPG, PNG, WebP or AVIF image.");
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      event.target.value = "";
      return;
    }
    const body = new FormData();
    body.set("file", file);
    body.set("folder", "products");
    onBusy(true);
    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        imageUrl?: string;
        cloudinaryPublicId?: string;
        width?: number;
        height?: number;
      };
      if (!response.ok || !data.imageUrl) {
        setError(data.error || "Upload failed.");
        return;
      }
      onUploaded({
        imageUrl: data.imageUrl,
        cloudinaryPublicId: data.cloudinaryPublicId ?? null,
        width: data.width ?? null,
        height: data.height ?? null,
      });
    } catch {
      setError("Network error while uploading.");
    } finally {
      onBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div>
      <label
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[.68rem] font-bold transition ${
          busy
            ? "cursor-wait border-zinc-200 text-zinc-400"
            : "cursor-pointer border-zinc-300 text-zinc-800 hover:bg-zinc-50"
        }`}
      >
        {busy ? "Uploading…" : "Upload to Cloudinary"}
        <input className="hidden" type="file" accept={ACCEPTED_TYPES.join(",")} disabled={busy} onChange={pick} />
      </label>
      {error ? <p className="mt-2 text-[.68rem] font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
