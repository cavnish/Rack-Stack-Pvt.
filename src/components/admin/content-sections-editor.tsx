"use client";

/**
 * Content sections: the one reusable builder that replaces the old parade of
 * per-visual-section admin tabs.
 *
 * Each row on the product editor used to need its own tab — applications,
 * configurations, components, benefits, storage, story, workflow, technical —
 * and every one of them rendered a heading, some body copy, sometimes a picture
 * and sometimes a small note. That is the same shape eight times, so it is one
 * list here: heading, body, image, which side the image sits on, alt text, an
 * optional note and an order. Adding the next kind of page section is now a row,
 * not a tab, a table and a migration.
 *
 * The row shape matches `product_sections` in the schema, which the product API
 * already reads and writes, so nothing here needs a server change.
 */

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { ProductImagePicker, type ExistingProductImage } from "@/components/admin/product-image-picker";

export type SectionRow = {
  id?: number;
  key?: string | null;
  eyebrow?: string | null;
  title: string;
  body?: string | null;
  layout?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  altText?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  isActive?: boolean;
  /** Older rows wrote the image under `image`; read and dropped on the way out. */
  image?: string | null;
};

/** The image column, whichever of the two names a given row happens to use. */
function readImage(row: SectionRow): string {
  return row.imageUrl || row.image || "";
}

const LAYOUTS = [
  { value: "text", label: "Text only" },
  { value: "image-left", label: "Image on the left" },
  { value: "image-right", label: "Image on the right" },
  { value: "image-top", label: "Image on top" },
];

function blankSection(): SectionRow {
  return {
    key: null,
    eyebrow: "",
    title: "",
    body: "",
    layout: "text",
    imageUrl: null,
    imagePublicId: null,
    altText: "",
    ctaLabel: "",
    ctaHref: "",
    isActive: true,
  };
}

export function ContentSectionsEditor({
  sections,
  onChange,
  productSlug,
}: {
  sections: SectionRow[];
  onChange: (sections: SectionRow[]) => void;
  productSlug?: string;
}) {
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const update = (index: number, patch: Partial<SectionRow>) =>
    onChange(sections.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const remove = (index: number) => onChange(sections.filter((_, i) => i !== index));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const drop = (target: number) => {
    if (dragIndex === null || dragIndex === target) return;
    const next = [...sections];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    onChange(next);
    setDragIndex(null);
  };

  const applyPicked = (image: ExistingProductImage) => {
    const index = pickerFor;
    if (index === null) return;
    update(index, { imageUrl: image.imageUrl, imagePublicId: null, altText: image.altText || "" });
    setPickerFor(null);
  };

  const clearImage = (index: number) => update(index, { imageUrl: null, imagePublicId: null });

  return (
    <div className="space-y-4">
      <p className="text-[.7rem] leading-5 text-zinc-600">
        Sections render on the product page in the order shown. The one above the gallery stays put; these
        appear after it, in this order.
      </p>

      {sections.length === 0 ? <p className="text-xs text-zinc-500">No sections yet.</p> : null}

      {sections.map((section, index) => {
        const image = readImage(section);
        return (
          <div
            key={index}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => drop(index)}
            onDragEnd={() => setDragIndex(null)}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <GripVertical size={16} className="cursor-grab text-zinc-300" aria-hidden />
              <span className="text-[.7rem] font-bold text-zinc-500">Section {index + 1}</span>
              <label className="ml-auto flex items-center gap-2 text-[.65rem] font-bold text-zinc-600">
                <input
                  type="checkbox"
                  checked={section.isActive !== false}
                  onChange={(event) => update(index, { isActive: event.target.checked })}
                />
                Show
              </label>
              <button
                type="button"
                aria-label="Move section up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="grid h-8 w-8 place-items-center rounded text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                aria-label="Move section down"
                disabled={index === sections.length - 1}
                onClick={() => move(index, 1)}
                className="grid h-8 w-8 place-items-center rounded text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                aria-label="Remove section"
                onClick={() => remove(index)}
                className="grid h-8 w-8 place-items-center rounded text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">Heading</label>
                <input
                  value={section.title || ""}
                  onChange={(event) => update(index, { title: event.target.value })}
                  className="admin-field"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">
                  Small note above the heading (optional)
                </label>
                <input
                  value={section.eyebrow || ""}
                  onChange={(event) => update(index, { eyebrow: event.target.value })}
                  className="admin-field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">Description</label>
                <textarea
                  value={section.body || ""}
                  onChange={(event) => update(index, { body: event.target.value })}
                  className="admin-field min-h-24"
                />
              </div>
              <div>
                <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">Image position</label>
                <select
                  value={section.layout || "text"}
                  onChange={(event) => update(index, { layout: event.target.value })}
                  className="admin-field"
                >
                  {LAYOUTS.map((layout) => (
                    <option key={layout.value} value={layout.value}>
                      {layout.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">Image alt text</label>
                <input
                  value={section.altText || ""}
                  onChange={(event) => update(index, { altText: event.target.value })}
                  className="admin-field"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPickerFor(index)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-[.65rem] font-bold text-zinc-800 hover:bg-zinc-50"
              >
                Choose image
              </button>
              {image ? (
                <>
                  <span className="max-w-xs truncate text-[.65rem] text-zinc-500">{image}</span>
                  <button
                    type="button"
                    onClick={() => clearImage(index)}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-[.65rem] font-bold text-red-700 hover:bg-red-50"
                  >
                    Remove image
                  </button>
                </>
              ) : (
                <span className="text-[.65rem] text-zinc-500">No image — this section renders as text.</span>
              )}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => onChange([...sections, blankSection()])}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-900 hover:bg-zinc-50"
      >
        <Plus size={14} /> Add section
      </button>

      <ProductImagePicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={applyPicked}
        slug={productSlug}
      />
    </div>
  );
}
