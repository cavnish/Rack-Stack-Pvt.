"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import { HOME_ABOUT_FEATURE_ICONS, homeAboutDefaults } from "@/lib/home-about";

type Data = Record<string, unknown>;
type Feature = { title: string; description: string; icon: string };
type GallerySlot = { image: string; alt: string };

/** Cloudinary folder for About imagery; the upload route files it under the `about` asset group. */
const ABOUT_FOLDER = "home-about";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">
      {children}
      {required ? <span className="text-red-600"> *</span> : null}
    </label>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[.65rem] leading-5 text-zinc-500">{children}</p>;
}

/**
 * One About image: the URL field plus the upload control and the alt text.
 *
 * The alt text is not optional decoration. The section renders three
 * photography slots and an editor adding a new image is very likely to leave the
 * description blank, which is exactly how a CMS field turns into missing alt
 * text on a public page.
 */
function AboutImageField({
  legend,
  help,
  value,
  alt,
  onChange,
  onAltChange,
  onUploadBusy,
}: {
  legend: string;
  help: string;
  value: string;
  alt: string;
  onChange: (url: string) => void;
  onAltChange: (alt: string) => void;
  onUploadBusy: (busy: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <p className="text-[.68rem] font-bold text-zinc-900">{legend}</p>
      <div className="mt-3">
        <Label>Image</Label>
        <input
          className="admin-field"
          value={value}
          placeholder="/assets/images/…"
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="mt-2">
          <ImageUpload
            value={value || undefined}
            folder={ABOUT_FOLDER}
            onBusyChange={onUploadBusy}
            onUploaded={(result) => onChange(result.imageUrl)}
          />
        </div>
        <Help>{help}</Help>
      </div>
      <div className="mt-4">
        <Label>Alt text</Label>
        <input
          className="admin-field"
          value={alt}
          placeholder="Describe the photo for screen readers and search"
          onChange={(event) => onAltChange(event.target.value)}
        />
        <Help>Leave empty to use the built-in description for this slot.</Help>
      </div>
    </div>
  );
}

/**
 * Structured editor for the homepage `about` section.
 *
 * Everything the section renders is editable here: the eyebrow, the heading, the
 * body copy, all three images with their alt text, the feature list and the CTA.
 * The alternative was the generic form, where every one of those lives inside a
 * hand-written JSON blob — workable, but a routine copy or photo change became a
 * chance to break the section.
 *
 * Two details of the renderer are mirrored in the help text, because they change
 * what an editor should type: the heading splits into two lines at its first
 * full stop, and a blank line in the description starts a new paragraph.
 */
export function HomepageAboutEditor({
  initial,
  onSave,
  saving,
  uploading,
  error,
  onUploadBusy,
}: {
  initial: Data;
  onSave: (data: Data) => void;
  saving: boolean;
  uploading?: boolean;
  error: string;
  onUploadBusy?: (busy: boolean) => void;
}) {
  const content = (initial.content ?? {}) as Data;
  const [data, setData] = useState<Data>({ ...initial, content });

  // Fall back to the shipped copy only when the key is missing entirely, never
  // when it is an empty array: an editor who deletes every feature item means it,
  // and treating `[]` as "unset" would quietly put the defaults back on screen
  // and then save them over the top.
  const features: Feature[] = Array.isArray(content.features)
    ? (content.features as Feature[])
    : homeAboutDefaults.features;
  const gallery: GallerySlot[] = homeAboutDefaults.images.slice(1).map((fallback, index) => {
    const row = ((content.gallery as unknown[]) ?? [])[index] as Partial<GallerySlot> | undefined;
    return { image: row?.image ?? fallback.image, alt: row?.alt ?? fallback.alt };
  });
  const mainImage = String(content.image ?? homeAboutDefaults.images[0].image);
  const mainAlt = String(content.imageAlt ?? homeAboutDefaults.images[0].alt);

  function setContent(key: string, value: unknown) {
    setData((current) => ({ ...current, content: { ...(current.content as Data), [key]: value } }));
  }

  function setGallery(index: number, patch: { image?: string; alt?: string }) {
    const next = gallery.map((row, i) => (i === index ? { ...row, ...patch } : row));
    setContent("gallery", next);
  }

  function setFeature(index: number, patch: Partial<Feature>) {
    setContent("features", features.map((feature, i) => (i === index ? { ...feature, ...patch } : feature)));
  }

  function moveFeature(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= features.length) return;
    const next = [...features];
    [next[index], next[target]] = [next[target], next[index]];
    setContent("features", next);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    // Blank rows are dropped here rather than on the server: an editor who
    // clicks "Add item" and then saves should not end up with an empty tile.
    // Icons are normalised onto the shared list so the saved CMS value always
    // names an icon the renderer can draw.
    const clean = features
      .map((feature) => ({
        title: feature.title.trim(),
        description: feature.description.trim(),
        icon: HOME_ABOUT_FEATURE_ICONS.some(({ value }) => value === feature.icon)
          ? feature.icon
          : HOME_ABOUT_FEATURE_ICONS[0].value,
      }))
      .filter((feature) => feature.title);
    onSave({ ...data, content: { ...(data.content as Data), features: clean } });
  }

  const busy = saving || Boolean(uploading);

  return (
    <form onSubmit={submit}>
      <div className="space-y-6 p-5 sm:p-7">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Copy</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label required>Section key</Label>
              <input
                className="admin-field font-mono"
                value={String(data.sectionKey ?? "")}
                required
                onChange={(event) => setData((current) => ({ ...current, sectionKey: event.target.value }))}
              />
              <Help>
                Use <code className="font-mono">about</code>. It is the key the homepage reads for this
                section.
              </Help>
            </div>
            <div>
              <Label>Eyebrow label</Label>
              <input
                className="admin-field"
                value={String(content.label ?? "")}
                onChange={(event) => setContent("label", event.target.value)}
              />
              <Help>Short kicker above the heading. Leave empty for the default.</Help>
            </div>
            <div>
              <Label>Button label</Label>
              <input
                className="admin-field"
                value={String(content.cta ?? "")}
                onChange={(event) => setContent("cta", event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Heading</Label>
              <input
                className="admin-field"
                value={String(data.title ?? "")}
                onChange={(event) => setData((current) => ({ ...current, title: event.target.value }))}
              />
              <Help>
                The first full stop splits this across two lines, so{" "}
                <code className="font-mono">Sentence one. Sentence two.</code> reads as a stacked
                pair. Leave empty for the default heading.
              </Help>
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <textarea
                className="admin-field min-h-40 resize-y"
                value={String(data.subtitle ?? "")}
                onChange={(event) => setData((current) => ({ ...current, subtitle: event.target.value }))}
              />
              <Help>
                Leave a blank line between paragraphs — each block becomes its own paragraph. Leave
                empty for the default copy.
              </Help>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Images</h3>
          <p className="mt-2 text-[.68rem] leading-5 text-zinc-500">
            The section always shows a large lead image with two smaller ones beneath it. Clear a
            field to fall back to the built-in photograph for that slot.
          </p>
          <div className="mt-4 space-y-4">
            <AboutImageField
              legend="Lead image"
              help="Landscape works best. This is the largest image in the section."
              value={mainImage}
              alt={mainAlt}
              onChange={(url) => setContent("image", url)}
              onAltChange={(alt) => setContent("imageAlt", alt)}
              onUploadBusy={onUploadBusy ?? (() => {})}
            />
            {gallery.map((row, index) => (
              <AboutImageField
                key={index}
                legend={`Supporting image ${index + 1}`}
                help="Shown as a half-width thumbnail beneath the lead image."
                value={row.image}
                alt={row.alt}
                onChange={(url) => setGallery(index, { image: url })}
                onAltChange={(alt) => setGallery(index, { alt })}
                onUploadBusy={onUploadBusy ?? (() => {})}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Feature items</h3>
            <button
              type="button"
              onClick={() =>
                setContent("features", [
                  ...features,
                  { title: "", description: "", icon: HOME_ABOUT_FEATURE_ICONS[0].value },
                ])
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-[.68rem] font-bold text-zinc-900 hover:bg-zinc-50"
            >
              <Plus size={13} aria-hidden="true" /> Add item
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="rounded-lg border border-zinc-200 p-4">
                <div className="grid items-end gap-3 sm:grid-cols-[1fr_1.4fr_180px_auto]">
                  <div>
                    <Label>Title</Label>
                    <input
                      className="admin-field"
                      value={feature.title}
                      onChange={(event) => setFeature(index, { title: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <input
                      className="admin-field"
                      value={feature.description}
                      onChange={(event) => setFeature(index, { description: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Icon</Label>
                    <select
                      className="admin-field"
                      value={feature.icon}
                      onChange={(event) => setFeature(index, { icon: event.target.value })}
                    >
                      {HOME_ABOUT_FEATURE_ICONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Move ${feature.title || "item"} up`}
                      disabled={index === 0}
                      onClick={() => moveFeature(index, -1)}
                      className="grid h-9 w-9 place-items-center rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${feature.title || "item"} down`}
                      disabled={index === features.length - 1}
                      onClick={() => moveFeature(index, 1)}
                      className="grid h-9 w-9 place-items-center rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${feature.title || "item"}`}
                      onClick={() =>
                        setContent(
                          "features",
                          features.filter((_, i) => i !== index),
                        )
                      }
                      className="grid h-9 w-9 place-items-center rounded text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {features.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-500">
                No feature items. The list will not render.
              </p>
            ) : null}
          </div>
          <Help>Items render in the order shown, two per row on larger screens, so four reads best.</Help>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Button</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Link</Label>
              <input
                className="admin-field"
                value={String(content.ctaHref ?? "")}
                placeholder="/products"
                onChange={(event) => setContent("ctaHref", event.target.value)}
              />
              <Help>Must be a site-relative path such as <code className="font-mono">/products</code>.</Help>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4">
            <input
              type="checkbox"
              checked={data.enabled !== false}
              onChange={(event) => setData((current) => ({ ...current, enabled: event.target.checked }))}
            />
            <span className="text-sm font-semibold text-zinc-900">Visible on homepage</span>
          </label>
          <div>
            <Label>Display order</Label>
            <input
              className="admin-field"
              type="number"
              value={Number(data.displayOrder ?? 0)}
              onChange={(event) => setData((current) => ({ ...current, displayOrder: Number(event.target.value) }))}
            />
          </div>
        </div>

        <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <summary className="cursor-pointer text-[.68rem] font-bold text-zinc-700">
            Saved section JSON (read-only)
          </summary>
          <p className="mt-2 text-[.65rem] leading-5 text-zinc-500">
            Exactly what this form will write to the <code className="font-mono">content</code> column.
            Useful when checking a value against the published page.
          </p>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded bg-white p-3 font-mono text-[.65rem] leading-5 text-zinc-600">
            {JSON.stringify({ ...(data.content as Data), features }, null, 2)}
          </pre>
        </details>

        {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      </div>

      <div className="flex justify-end border-t border-zinc-200 bg-zinc-50 p-4">
        <button
          disabled={busy}
          className="flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
        >
          <Save size={15} />
          {saving ? "Saving…" : uploading ? "Uploading…" : "Save section"}
        </button>
      </div>
    </form>
  );
}

/**
 * Structured editor for the homepage `offers` section.
 *
 * Only the heading pair and the "View All Systems" button are editable here; the
 * cards themselves live in the dedicated Offer Cards collection, which is where
 * adding, reordering and hiding them belongs.
 */
export function HomepageOffersEditor({
  initial,
  onSave,
  saving,
  error,
}: {
  initial: Data;
  onSave: (data: Data) => void;
  saving: boolean;
  error: string;
}) {
  const content = (initial.content ?? {}) as Data;
  const [data, setData] = useState<Data>({ ...initial, content });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(data);
      }}
    >
      <div className="space-y-6 p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">
              Section key <span className="text-red-600">*</span>
            </label>
            <input
              className="admin-field font-mono"
              value={String(data.sectionKey ?? "")}
              required
              onChange={(event) => setData((current) => ({ ...current, sectionKey: event.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">Heading</label>
            <input
              className="admin-field"
              value={String(data.title ?? "")}
              onChange={(event) => setData((current) => ({ ...current, title: event.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">Description</label>
            <textarea
              className="admin-field min-h-24 resize-y"
              value={String(data.subtitle ?? "")}
              onChange={(event) => setData((current) => ({ ...current, subtitle: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">Button label</label>
            <input
              className="admin-field"
              value={String(content.ctaLabel ?? "")}
              onChange={(event) =>
                setData((current) => ({ ...current, content: { ...(current.content as Data), ctaLabel: event.target.value } }))
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">Button link</label>
            <input
              className="admin-field"
              value={String(content.ctaHref ?? "")}
              placeholder="/products"
              onChange={(event) =>
                setData((current) => ({ ...current, content: { ...(current.content as Data), ctaHref: event.target.value } }))
              }
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4">
            <input
              type="checkbox"
              checked={data.enabled !== false}
              onChange={(event) => setData((current) => ({ ...current, enabled: event.target.checked }))}
            />
            <span className="text-sm font-semibold text-zinc-900">Visible on homepage</span>
          </label>
          <div>
            <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">Display order</label>
            <input
              className="admin-field"
              type="number"
              value={Number(data.displayOrder ?? 0)}
              onChange={(event) => setData((current) => ({ ...current, displayOrder: Number(event.target.value) }))}
            />
          </div>
        </div>

        <p className="rounded-lg bg-zinc-50 p-3 text-[.68rem] leading-5 text-zinc-600">
          The cards in this section are managed in <strong>Homepage → Offer Cards</strong>. Add, edit,
          reorder, hide or delete them there; this screen only sets the heading and the button.
        </p>

        {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      </div>

      <div className="flex justify-end border-t border-zinc-200 bg-zinc-50 p-4">
        <button
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
        >
          <Save size={15} />
          {saving ? "Saving…" : "Save section"}
        </button>
      </div>
    </form>
  );
}
