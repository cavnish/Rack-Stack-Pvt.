"use client";

import { useMemo, useState } from "react";
import { Info, Trash2 } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";
import { productGallerySlots, type ProductGallerySlot } from "@/lib/product-gallery-slots";
import { optimizeImage } from "@/lib/image-utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export type GalleryRow = {
  slot: string;
  imageUrl: string;
  /**
   * Named after the column, not the upload field: this is the row as the API
   * expects it, and the validator/`syncProductGallery` round trip keys off
   * `cloudinaryPublicId`.
   */
  cloudinaryPublicId?: string | null;
  altText: string;
  caption: string;
  width?: number | null;
  height?: number | null;
};

type UploadResult = {
  imageUrl: string;
  cloudinaryPublicId?: string | null;
  width?: number | null;
  height?: number | null;
};

/**
 * The six fixed gallery slots, edited by name rather than as free-form rows.
 *
 * The slots are a property of the page design, not a per-product choice, so the
 * editor renders every slot in canonical order whether or not it has an image.
 * A missing photo then shows up as an obvious gap in a known position instead of
 * a gallery that silently renders five slides out of sequence.
 *
 * Rows are keyed by `slot`, never by index, so clearing one slot cannot re-point
 * the remaining images at the wrong position on save.
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
  const bySlot = useMemo(() => {
    const map = new Map<string, GalleryRow>();
    for (const row of gallery) {
      if (row?.slot) map.set(row.slot, row);
    }
    return map;
  }, [gallery]);

  const [busySlot, setBusySlot] = useState("");

  function upsert(slot: ProductGallerySlot, patch: Partial<GalleryRow>) {
    const existing = bySlot.get(slot.slot);
    const next: GalleryRow = {
      altText: "",
      caption: "",
      cloudinaryPublicId: null,
      imageUrl: "",
      ...existing,
      ...patch,
      slot: slot.slot,
    };
    onChange([...gallery.filter((row) => row.slot !== slot.slot), next]);
  }

  /** Clearing a slot drops the row entirely rather than storing an empty one. */
  function clearSlot(slot: string) {
    onChange(gallery.filter((row) => row.slot !== slot));
  }

  function setBusy(slot: string, busy: boolean) {
    setBusySlot(busy ? slot : "");
    onUploadBusy?.(busy);
  }

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-lg bg-zinc-50 p-3 text-[.68rem] leading-5 text-zinc-600">
        <Info size={14} className="mt-0.5 shrink-0 text-zinc-400" aria-hidden="true" />
        <span>
          Every product page shows these six views in this order. An empty slot is skipped on the
          page, so fill the ones you have and leave the rest — but a full set is what makes the
          gallery read as deliberate. Captions and alt text are optional; sensible defaults are
          used when they are blank.
        </span>
      </p>

      {productGallerySlots.map((slot, index) => {
        const row = bySlot.get(slot.slot);
        const filled = Boolean(row?.imageUrl);
        const busy = busySlot === slot.slot;

        return (
          <fieldset
            key={slot.slot}
            className={`rounded-xl border p-4 ${filled ? "border-zinc-200 bg-white" : "border-dashed border-zinc-300 bg-zinc-50/60"}`}
          >
            <legend className="flex items-center gap-2 px-1">
              <span className="text-[.62rem] font-bold uppercase tracking-[.14em] text-zinc-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-bold text-zinc-900">{slot.label}</span>
              {!filled ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[.6rem] font-bold uppercase tracking-wider text-amber-800">
                  Empty
                </span>
              ) : null}
            </legend>

            <p className="mt-1 text-[.68rem] leading-5 text-zinc-500">{slot.help}</p>

            <div className="mt-3 grid gap-4 lg:grid-cols-[200px_1fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                {filled ? (
                  <SmartImage
                    src={optimizeImage(String(row?.imageUrl), 600)}
                    alt={`${slot.label} preview`}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center px-4 text-center text-[.65rem] font-semibold text-zinc-400">
                    No image for {slot.label}
                  </span>
                )}
              </div>

              <div className="min-w-0 space-y-3">
                <div>
                  <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">
                    Gallery image
                  </label>
                  <SlotUpload
                    busy={busy}
                    onBusy={(next) => setBusy(slot.slot, next)}
                    onUploaded={(result) => {
                      if (!result.imageUrl) {
                        clearSlot(slot.slot);
                        return;
                      }
                      upsert(slot, {
                        imageUrl: result.imageUrl,
                        cloudinaryPublicId: result.cloudinaryPublicId ?? null,
                        width: result.width ?? null,
                        height: result.height ?? null,
                      });
                    }}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">Caption</label>
                    <input
                      className="admin-field"
                      value={row?.caption ?? ""}
                      placeholder={slot.fallbackCaption}
                      onChange={(event) => upsert(slot, { caption: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">Alt text</label>
                    <input
                      className="admin-field"
                      value={row?.altText ?? ""}
                      placeholder={`${productName}: ${slot.altHint}`}
                      onChange={(event) => upsert(slot, { altText: event.target.value })}
                    />
                  </div>
                </div>

                {filled ? (
                  <button
                    type="button"
                    onClick={() => clearSlot(slot.slot)}
                    className="inline-flex items-center gap-1.5 text-[.68rem] font-bold text-red-600 hover:underline"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    Clear {slot.label}
                  </button>
                ) : null}
              </div>
            </div>
          </fieldset>
        );
      })}

      <p className="text-[.68rem] leading-5 text-zinc-500">
        Uploads go to Cloudinary under <code className="font-mono">rack-stack/products</code>.
        Replacing or clearing a slot deletes the previous file when you save.
      </p>
    </div>
  );
}

/**
 * One slot's file picker.
 *
 * Separate from the generic `ImageUpload` in the entity editor because that
 * widget is driven by field metadata; the gallery needs an identical control
 * repeated once per slot, with its own busy state and its own remove action.
 */
function SlotUpload({
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
