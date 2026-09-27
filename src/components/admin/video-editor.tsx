"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { InstagramEmbed } from "@/components/media/instagram-reel";
import { parseInstagramUrl } from "@/lib/instagram";

type Data = Record<string, unknown>;

export type VideoRelationOptions = {
  products: Array<{ id: number; name: string }>;
  services: Array<{ id: number; name: string }>;
};

/**
 * The three places a Reel can appear. Every one of these is a real section on
 * the site, and a Reel with none of them switched on is simply hidden.
 */
const PLACEMENTS = [
  { key: "showOnHome", label: "Home", help: "Show in the homepage Reel section." },
  { key: "showOnProducts", label: "Products", help: "Show in the Products section." },
  { key: "showOnServices", label: "Services", help: "Show in the Services section." },
] as const;

/**
 * Editor for a single Reel.
 *
 * The whole point of this screen is that an editor only has to know two things:
 * what to call the Reel, and where it lives on Instagram. Everything else on
 * this form is a placement decision that already has a sensible default, and
 * the Reel itself is delivered by Instagram's official embed — there is no file
 * to upload, no poster to generate, no duration to enter and no category to
 * invent.
 *
 * The product/service pickers are optional and collapsed by default. They only
 * narrow a Reel down to one product or service page instead of the whole
 * section, so leaving them empty is a valid, complete configuration.
 */
export function VideoEditor({
  initial,
  onSave,
  saving,
  error,
  options,
}: {
  initial: Data;
  onSave: (data: Data) => void;
  saving: boolean;
  error: string;
  options: VideoRelationOptions;
}) {
  const [targeting, setTargeting] = useState(
    (Array.isArray(initial.productIds) && initial.productIds.length > 0) ||
      (Array.isArray(initial.serviceIds) && initial.serviceIds.length > 0),
  );
  const [data, setData] = useState<Data>({
    ...initial,
    title: initial.title ?? "",
    instagramUrl: initial.instagramUrl ?? "",
    isActive: initial.isActive ?? true,
    showOnHome: initial.showOnHome ?? true,
    showOnProducts: initial.showOnProducts ?? false,
    showOnServices: initial.showOnServices ?? false,
    displayOrder: initial.displayOrder ?? 0,
    productIds: Array.isArray(initial.productIds) ? initial.productIds : [],
    serviceIds: Array.isArray(initial.serviceIds) ? initial.serviceIds : [],
  });

  function set(key: string, value: unknown) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function toggleRelation(key: "productIds" | "serviceIds", id: number) {
    const current = (data[key] as number[]) ?? [];
    const removing = current.includes(id);
    setData((existing) => ({
      ...existing,
      [key]: removing ? current.filter((value) => value !== id) : [...current, id],
      // A targeted page can only be reached through its section, so choosing a
      // product or service turns that placement on rather than leaving the
      // Reel configured in a way that can never appear.
      ...(removing
        ? {}
        : key === "productIds"
          ? { showOnProducts: true }
          : { showOnServices: true }),
    }));
  }

  const title = String(data.title ?? "").trim();
  const instagramUrl = String(data.instagramUrl ?? "").trim();
  // Checked as the editor types so a bad link is obvious before saving. The
  // server repeats the check, because a request can bypass the form entirely.
  const urlCheck = parseInstagramUrl(instagramUrl);
  const canSave = title.length > 0 && urlCheck.ok;
  const productIds = (data.productIds as number[]) ?? [];
  const serviceIds = (data.serviceIds as number[]) ?? [];

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;
        onSave(data);
      }}
    >
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_240px]">
        <div className="min-w-0 space-y-5">
          <div>
            <label htmlFor="reel-title" className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">
              Reel Name *
            </label>
            <input
              id="reel-title"
              className="admin-field"
              value={title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="Installed pallet racking — Pune"
              autoComplete="off"
            />
            <p className="mt-1 text-[.65rem] text-zinc-500">Shown under the Reel card.</p>
          </div>

          <div>
            <label htmlFor="reel-url" className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">
              Instagram Reel URL *
            </label>
            <input
              id="reel-url"
              className="admin-field"
              value={instagramUrl}
              onChange={(event) => set("instagramUrl", event.target.value)}
              placeholder="https://www.instagram.com/reel/…/"
              inputMode="url"
              autoComplete="off"
              aria-invalid={instagramUrl.length > 0 && !urlCheck.ok}
            />
            {instagramUrl ? (
              urlCheck.ok ? (
                <p className="mt-1.5 text-[.65rem] font-semibold text-emerald-700">
                  Valid Reel &middot; saved as {urlCheck.ref.permalink}
                </p>
              ) : (
                <p className="mt-1.5 text-[.68rem] font-semibold text-red-600">{urlCheck.reason}</p>
              )
            ) : null}
            <p className="mt-1 text-[.65rem] leading-4 text-zinc-500">
              Open the Reel on Instagram, tap the share icon and paste the link here. Instagram&rsquo;s official
              embed plays it on the site &mdash; nothing is uploaded or downloaded, and the Reel always starts
              muted with a sound button.
            </p>
          </div>

          <fieldset>
            <legend className="mb-2 text-[.68rem] font-bold text-zinc-700">Where it appears</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {PLACEMENTS.map((placement) => (
                <CheckField
                  key={placement.key}
                  label={placement.label}
                  checked={Boolean(data[placement.key])}
                  onChange={(value) => set(placement.key, value)}
                  help={placement.help}
                />
              ))}
            </div>
            <p className="mt-2 text-[.65rem] text-zinc-500">
              Leave all three off and this Reel stays in the admin but never appears on the site.
            </p>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reel-order" className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">
                Display order
              </label>
              <input
                id="reel-order"
                className="admin-field"
                type="number"
                value={String(data.displayOrder ?? 0)}
                onChange={(event) => set("displayOrder", Number(event.target.value) || 0)}
              />
              <p className="mt-1 text-[.65rem] text-zinc-500">Lower numbers appear first.</p>
            </div>
            <CheckField
              label="Enabled"
              checked={Boolean(data.isActive)}
              onChange={(value) => set("isActive", value)}
              help="Off pulls this Reel from the site without deleting it."
            />
          </div>

          {targeting ? (
            <div className="rounded-xl border border-zinc-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[.7rem] font-bold text-zinc-800">Narrow to specific pages (optional)</p>
                  <p className="mt-1 text-[.65rem] leading-4 text-zinc-500">
                    Pick the products and services this Reel is about, and it will also appear on their own
                    pages. Leave empty to show it across the whole section only.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTargeting(false)}
                  className="shrink-0 text-[.65rem] font-bold text-zinc-500 hover:text-zinc-900"
                >
                  Hide
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <RelationList
                  title="Products"
                  empty="No products yet."
                  options={options.products}
                  selected={productIds}
                  onToggle={(id) => toggleRelation("productIds", id)}
                />
                <RelationList
                  title="Services"
                  empty="No services yet."
                  options={options.services}
                  selected={serviceIds}
                  onToggle={(id) => toggleRelation("serviceIds", id)}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setTargeting(true)}
              className="text-[.68rem] font-bold text-red-700 hover:underline"
            >
              + Target specific product or service pages
            </button>
          )}

          {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </div>

        {/*
          A true-to-life 9:16 preview using the same embed the site uses, so a
          Reel that will not play here is visibly not going to play there.
        */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-[.68rem] font-bold text-zinc-700">Preview</p>
          <div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-2xl border border-zinc-200">
            {urlCheck.ok ? (
              // Keyed on the URL so a corrected link previews the corrected Reel
              // instead of the one Instagram already replaced with an iframe.
              <InstagramEmbed
                key={urlCheck.ref.permalink}
                permalink={urlCheck.ref.permalink}
                title={title || "Instagram Reel preview"}
              />
            ) : (
              <div className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-2 bg-zinc-950 p-6 text-center">
                <p className="text-xs leading-5 text-zinc-400">
                  {instagramUrl
                    ? urlCheck.reason
                    : "Paste an Instagram Reel URL to preview it."}
                </p>
              </div>
            )}
          </div>
          <p className="mt-3 text-[.62rem] leading-4 text-zinc-500">
            The site shows the Reel in a 9:16 frame with rounded corners, and gives every visitor a sound button.
          </p>
        </aside>
      </div>

      <div className="flex justify-end border-t border-zinc-200 bg-zinc-50 p-4">
        <button
          disabled={saving || !canSave}
          className="flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
        >
          <Save size={15} />
          {saving ? "Saving…" : "Save Reel"}
        </button>
      </div>
    </form>
  );
}

function RelationList({
  title,
  empty,
  options,
  selected,
  onToggle,
}: {
  title: string;
  empty: string;
  options: Array<{ id: number; name: string }>;
  selected: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-[.68rem] font-bold text-zinc-700">
        {title}
        <span className="font-normal text-zinc-400">({selected.length} selected)</span>
      </p>
      {options.length === 0 ? (
        <p className="text-[.68rem] text-zinc-400">{empty}</p>
      ) : (
        <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2">
          {options.map((option) => {
            const checked = selected.includes(option.id);
            return (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[.7rem] text-zinc-700 hover:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(option.id)}
                  className="h-3.5 w-3.5 accent-red-600"
                />
                <span className="truncate">{option.name}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CheckField({
  label,
  checked,
  onChange,
  help,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  help?: string;
}) {
  return (
    <label className="flex h-full cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
      />
      <span>
        <span className="block text-[.7rem] font-bold text-zinc-800">{label}</span>
        {help ? <span className="mt-0.5 block text-[.63rem] leading-4 text-zinc-500">{help}</span> : null}
      </span>
    </label>
  );
}
