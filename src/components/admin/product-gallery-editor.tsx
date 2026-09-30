"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, ImagePlus, Images, Info, Star, Trash2 } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";
import { optimizeImage } from "@/lib/image-utils";
import { ProductImagePicker, type ExistingProductImage } from "@/components/admin/product-image-picker";

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
  /**
   * The editor's explicit choice of main image.
   *
   * `undefined` means "not set", which is why this is optional: a row saved by an
   * older release has no such column, and the server derives the primary from
   * position for those. Sending `false` explicitly means "not this one", which
   * stops a reordering from silently handing the hero to a different photo.
   */
  isPrimary?: boolean;
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
 * Ordering is available three ways, and all three write the same thing — the
 * array order. Dragging is what most people reach for, but it is unusable with a
 * keyboard and awkward on a touch screen, so the up/down buttons remain and do
 * not merely duplicate it: they are the accessible path to the same result. The
 * primary image can likewise be chosen explicitly or by moving a row to the
 * top, and the two agree because the server normalises a single primary.
 */
export function ProductGalleryEditor({
  gallery,
  productName,
  productSlug,
  onChange,
  onUploadBusy,
}: {
  gallery: GalleryRow[];
  productName: string;
  productSlug?: string;
  onChange: (rows: GalleryRow[]) => void;
  onUploadBusy?: (busy: boolean) => void;
}) {
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [pickerFor, setPickerFor] = useState<number | "all" | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragFrom = useRef<number | null>(null);

  function setBusy(index: number | null, busy: boolean) {
    setBusyIndex(busy ? index : null);
    onUploadBusy?.(busy);
  }

  function patch(index: number, changes: Partial<GalleryRow>) {
    onChange(gallery.map((row, position) => (position === index ? { ...row, ...changes } : row)));
  }

  /** Moves one row to an absolute position, used by drag-and-drop. */
  function moveTo(from: number, to: number) {
    if (to < 0 || to >= gallery.length || from === to) return;
    const next = [...gallery];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  }

  /** Moves one row one place up or down, used by the buttons. */
  function nudge(index: number, direction: -1 | 1) {
    moveTo(index, index + direction);
  }

  function remove(index: number) {
    onChange(gallery.filter((_, position) => position !== index));
  }

  function append() {
    onChange([...gallery, emptyRow()]);
  }

  /**
   * Makes one row the explicit primary and clears the flag on the others.
   *
   * Clearing rather than only setting matters: two rows flagged primary would
   * leave which one leads up to array order, so a later reorder would change the
   * hero without the editor doing anything that looks like changing it.
   */
  function setPrimary(index: number) {
    onChange(gallery.map((row, position) => ({ ...row, isPrimary: position === index ? true : false })));
  }

  /**
   * Applies a picked repository image to a row.
   *
   * `cloudinaryPublicId` is left null on purpose. A file that lives in `public/`
   * is not an upload, and a public id is the marker the pruner uses to decide an
   * image may be destroyed on save — setting one here would let a later edit
   * delete a photograph straight out of the repository.
   */
  function applyPicked(index: number, image: ExistingProductImage) {
    patch(index, {
      imageUrl: image.imageUrl,
      cloudinaryPublicId: null,
      label: image.label || null,
      altText: image.altText || image.label || "",
      isActive: gallery[index]?.isActive !== false,
    });
  }

  // The row the page will actually show. A hidden row at position 0 must not
  // steal the primary slot from the first visible image below it, and an
  // explicit flag is honoured ahead of position.
  const primaryIndex = (() => {
    const flagged = gallery.findIndex((row) => row.isPrimary === true && row.isActive !== false && Boolean(row.imageUrl));
    if (flagged >= 0) return flagged;
    return gallery.findIndex((row) => row.isActive !== false && Boolean(row.imageUrl));
  })();

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-lg bg-zinc-50 p-3 text-[.68rem] leading-5 text-zinc-600">
        <Info size={14} className="mt-0.5 shrink-0 text-zinc-400" aria-hidden="true" />
        <span>
          Add as many images as the product needs — there is no upper limit. Drag a row, or use Move up/down, to
          change the order it appears on the page. The image marked <strong>Primary</strong> is used as the
          product&apos;s main image on the hero, its card and the homepage, so you can choose it directly instead of
          relying on position. Save the product to publish a change.
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
        const isDropTarget = dropIndex === index && dragIndex !== null && dragIndex !== index;

        return (
          <fieldset
            key={index}
            draggable={filled}
            onDragStart={(event) => {
              dragFrom.current = index;
              setDragIndex(index);
              event.dataTransfer.effectAllowed = "move";
              // Firefox refuses to start a drag unless some data is set.
              event.dataTransfer.setData("text/plain", String(index));
            }}
            onDragOver={(event) => {
              if (dragIndex === null) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (dropIndex !== index) setDropIndex(index);
            }}
            onDragLeave={() => setDropIndex((current) => (current === index ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              const from = dragFrom.current ?? Number(event.dataTransfer.getData("text/plain"));
              setDropIndex(null);
              setDragIndex(null);
              dragFrom.current = null;
              if (Number.isInteger(from)) moveTo(from, index);
            }}
            onDragEnd={() => {
              setDropIndex(null);
              setDragIndex(null);
              dragFrom.current = null;
            }}
            className={`rounded-xl border p-4 transition ${
              isDropTarget
                ? "border-zinc-900 ring-2 ring-zinc-900/10"
                : filled
                  ? row.isActive === false
                    ? "border-zinc-200 bg-zinc-50/60"
                    : "border-zinc-200 bg-white"
                  : "border-dashed border-zinc-300 bg-zinc-50/60"
            } ${dragIndex === index ? "opacity-50" : ""}`}
          >
            <legend className="flex flex-wrap items-center gap-2 px-1">
              {filled ? (
                <span
                  className="cursor-grab text-zinc-300 active:cursor-grabbing"
                  title="Drag to reorder"
                  aria-hidden="true"
                >
                  <GripVertical size={14} />
                </span>
              ) : null}
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
                  <div className="flex flex-wrap items-center gap-2">
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
                    <button
                      type="button"
                      onClick={() => setPickerFor(index)}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-[.68rem] font-bold text-zinc-800 hover:bg-zinc-50"
                    >
                      <Images size={13} aria-hidden="true" />
                      Choose existing
                    </button>
                  </div>
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
                      onClick={() => nudge(index, -1)}
                      disabled={index === 0}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-[.65rem] font-bold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowUp size={12} aria-hidden="true" />
                      Move up
                    </button>
                    <button
                      type="button"
                      onClick={() => nudge(index, 1)}
                      disabled={index === gallery.length - 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-[.65rem] font-bold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowDown size={12} aria-hidden="true" />
                      Move down
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPrimary(index)}
                    disabled={!filled || isPrimary}
                    className="inline-flex items-center gap-1.5 text-[.68rem] font-bold text-zinc-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline"
                  >
                    <Star size={13} aria-hidden="true" />
                    {isPrimary ? "Main image" : "Set as main image"}
                  </button>

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

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={append}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3.5 py-2.5 text-[.7rem] font-bold text-zinc-800 hover:bg-zinc-50"
        >
          <ImagePlus size={14} aria-hidden="true" />
          Add image
        </button>
        <button
          type="button"
          onClick={() => setPickerFor("all")}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3.5 py-2.5 text-[.7rem] font-bold text-zinc-800 hover:bg-zinc-50"
        >
          <Images size={14} aria-hidden="true" />
          Add from existing images
        </button>
      </div>

      <p className="text-[.68rem] leading-5 text-zinc-500">
        Images already in the project are reused as-is and never re-uploaded. New uploads go to Cloudinary under{" "}
        <code className="font-mono">rack-stack/products</code>; replacing or removing one deletes the previous file when
        you save.
      </p>

      <ProductImagePicker
        open={pickerFor !== null}
        slug={pickerFor === "all" ? undefined : productSlug}
        onClose={() => setPickerFor(null)}
        onSelect={(image) => {
          /**
           * Opened from "add" appends a new row; opened from a row replaces that
           * row. Appending rather than overwriting the last row means the buttons
           * behave the same when the gallery is empty and when it is full.
           */
          if (pickerFor === "all") {
            onChange([
              ...gallery,
              {
                slot: null,
                imageUrl: image.imageUrl,
                cloudinaryPublicId: null,
                label: image.label || null,
                altText: image.altText || image.label || "",
                caption: "",
                width: null,
                height: null,
                isActive: true,
              },
            ]);
            return;
          }
          if (pickerFor !== null) applyPicked(pickerFor, image);
        }}
      />
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
