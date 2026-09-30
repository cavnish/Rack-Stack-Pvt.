"use client";

/**
 * The one list widget the simplified product editor uses everywhere.
 *
 * Before the product editor was consolidated it had eleven near-identical array
 * editors, one per tab, each hard-coding its own field list, its own add-button
 * blank row and its own two-column grid. They drifted: some offered reorder and
 * some did not, some had an "enable" checkbox and some silently could not be
 * switched off, and a change to one had to be repeated eleven times.
 *
 * A list is a list. This takes the columns and renders add / edit / delete /
 * reorder / enable for all of them, so a new kind of product content costs a
 * column definition instead of a component.
 */

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { ProductImagePicker, type ExistingProductImage } from "@/components/admin/product-image-picker";

export type Row = Record<string, unknown>;

export type ListColumn = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "icon" | "image";
  placeholder?: string;
  required?: boolean;
  help?: string;
  /** Columns wider than a single input cell, e.g. a description. */
  wide?: boolean;
};

/** A blank row, so "Add" always produces a row the schema will accept. */
function blankRow(columns: ListColumn[]): Row {
  const row: Row = {};
  for (const column of columns) row[column.key] = "";
  return row;
}

function Cell({
  column,
  value,
  onChange,
}: {
  column: ListColumn;
  value: unknown;
  onChange: (value: string) => void;
}) {
  if (column.type === "textarea") {
    return (
      <textarea
        value={String(value ?? "")}
        placeholder={column.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="admin-field min-h-20"
        required={column.required}
      />
    );
  }
  return (
    <input
      value={String(value ?? "")}
      placeholder={column.placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="admin-field"
      required={column.required}
    />
  );
}

export function RepeatableList({
  columns,
  rows,
  onChange,
  productSlug,
  emptyLabel = "No rows yet.",
  addLabel = "Add row",
  help,
  defaultIcon = "CheckCircle2",
  /** Supplies the per-row "is active" default; omitted means no toggle. */
  supportsActive = false,
  supportsImage = false,
}: {
  columns: ListColumn[];
  rows: Row[];
  onChange: (rows: Row[]) => void;
  productSlug?: string;
  emptyLabel?: string;
  addLabel?: string;
  help?: string;
  defaultIcon?: string;
  supportsActive?: boolean;
  supportsImage?: boolean;
}) {
  const [pickerFor, setPickerFor] = useState<number | "all" | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const update = (index: number, key: string, value: unknown) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  /**
   * Reorders the whole list, which is the operation the grip is offered for.
   * Keyboard users get the same thing from the up/down buttons, so reordering is
   * never drag-only.
   */
  const drop = (target: number) => {
    if (dragIndex === null || dragIndex === target) return;
    const next = [...rows];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    onChange(next);
    setDragIndex(null);
  };

  const add = () =>
    onChange([
      ...rows,
      {
        ...blankRow(columns),
        ...(columns.some((c) => c.type === "icon") ? { icon: defaultIcon } : {}),
        ...(supportsActive ? { isActive: true } : {}),
      },
    ]);

  const applyPicked = (image: ExistingProductImage) => {
    const target = pickerFor;
    if (target === null) return;
    if (target === "all") {
      onChange([
        ...rows,
        {
          ...blankRow(columns),
          ...(columns.some((c) => c.type === "icon") ? { icon: defaultIcon } : {}),
          ...(supportsActive ? { isActive: true } : {}),
          ...(Object.fromEntries(columns.filter((c) => c.type === "image").map((c) => [c.key, image.imageUrl]))),
          ...(Object.fromEntries(columns.filter((c) => c.key === "altText").map((c) => [c.key, image.altText || ""]))),
        },
      ]);
      return;
    }
    onChange(
      rows.map((row, i) =>
        i === target
          ? {
              ...row,
              ...Object.fromEntries(columns.filter((c) => c.type === "image").map((c) => [c.key, image.imageUrl])),
              ...Object.fromEntries(columns.filter((c) => c.key === "altText").map((c) => [c.key, image.altText || ""])),
            }
          : row,
      ),
    );
  };

  const gridTemplate = [
    "28px",
    ...columns.map((c) => (c.wide || c.type === "textarea" ? "minmax(0,2fr)" : "minmax(0,1fr)")),
    ...(supportsActive ? ["auto"] : []),
    ...(supportsImage ? ["auto"] : []),
    "auto",
  ].join(" ");

  return (
    <div className="space-y-3">
      {rows.length === 0 ? <p className="text-xs text-zinc-500">{emptyLabel}</p> : null}

      {rows.map((row, index) => (
        <div
          key={index}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => drop(index)}
          onDragEnd={() => setDragIndex(null)}
          className="grid items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <GripVertical size={16} className="mt-3 cursor-grab text-zinc-300" aria-hidden />

          {columns.map((column) => (
            <div key={column.key} className="min-w-0">
              <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">{column.label}</label>
              <Cell column={column} value={row[column.key]} onChange={(value) => update(index, column.key, value)} />
              {column.help ? <p className="mt-1 text-[.65rem] leading-4 text-zinc-500">{column.help}</p> : null}
            </div>
          ))}

          {supportsActive ? (
            <label className="mt-5 flex items-center gap-2 text-[.65rem] font-bold text-zinc-600">
              <input
                type="checkbox"
                checked={row.isActive !== false}
                onChange={(event) => update(index, "isActive", event.target.checked)}
              />
              On
            </label>
          ) : null}

          {supportsImage ? (
            <button
              type="button"
              onClick={() => setPickerFor(index)}
              className="mt-5 rounded-lg border border-zinc-300 px-3 py-2 text-[.65rem] font-bold text-zinc-800 hover:bg-zinc-50"
            >
              Choose image
            </button>
          ) : null}

          <div className="mt-5 flex items-center gap-1">
            <button
              type="button"
              aria-label="Move up"
              disabled={index === 0}
              onClick={() => move(index, -1)}
              className="grid h-8 w-8 place-items-center rounded text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              aria-label="Move down"
              disabled={index === rows.length - 1}
              onClick={() => move(index, 1)}
              className="grid h-8 w-8 place-items-center rounded text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
            >
              <ArrowDown size={14} />
            </button>
            <button
              type="button"
              aria-label="Remove row"
              onClick={() => remove(index)}
              className="grid h-8 w-8 place-items-center rounded text-red-600 hover:bg-red-50"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-900 hover:bg-zinc-50"
        >
          <Plus size={14} /> {addLabel}
        </button>
        {supportsImage ? (
          <button
            type="button"
            onClick={() => setPickerFor("all")}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-900 hover:bg-zinc-50"
          >
            <Plus size={14} /> Add row with an existing image
          </button>
        ) : null}
      </div>

      {help ? <p className="text-[.68rem] leading-5 text-zinc-500">{help}</p> : null}

      <ProductImagePicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={applyPicked}
        slug={productSlug}
      />
    </div>
  );
}
