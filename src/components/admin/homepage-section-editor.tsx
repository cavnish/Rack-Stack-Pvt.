"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import { SmartImage } from "@/components/site/smart-image";
import { HOME_ABOUT_FEATURE_ICONS, homeAboutDefaults } from "@/lib/home-about";

type Data = Record<string, unknown>;
type Feature = { title: string; description: string; icon: string };

/**
 * One About image slot as it is stored.
 *
 * `imagePublicId` is the Cloudinary asset the URL came from. It is not something
 * an editor sets, but the save route needs it: a replaced photograph is deleted
 * from Cloudinary by reading the id off the row it is replacing, so a row that
 * kept only the URL left every superseded original on the account forever.
 */
type GallerySlot = { image: string; imagePublicId: string | null; alt: string };

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
 * One About image: a live preview, the URL field, the upload control and the alt
 * text.
 *
 * The preview is the point of this component. `ImageUpload` shows a 56px
 * thumbnail, which confirms that *a* file arrived but cannot answer the question
 * an editor actually has: "is this the wide shot I want, cropped the way it will
 * appear, or a portrait that is about to be cropped down to a sliver?" So the
 * slot is previewed above the controls at the aspect ratio the section renders
 * it at.
 *
 * A blank value is a real state rather than a missing one — it means "use the
 * built-in photograph for this slot", which is exactly what the renderer does.
 * The component says so, because an empty box sitting under a picture that is
 * plainly still on the live page otherwise reads as a failed save.
 */
function AboutImageField({
  legend,
  help,
  value,
  alt,
  fallback,
  onChange,
  onAltChange,
  onUploadBusy,
}: {
  legend: string;
  help: string;
  value: string;
  alt: string;
  /** The shipped photograph this slot falls back to when `value` is blank. */
  fallback: string;
  onChange: (value: { image: string; imagePublicId: string | null }) => void;
  onAltChange: (alt: string) => void;
  onUploadBusy: (busy: boolean) => void;
}) {
  const usingFallback = !value;
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <p className="text-[.68rem] font-bold text-zinc-900">{legend}</p>

      <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
        <SmartImage src={value || fallback} alt={alt || legend} fill sizes="460px" className="object-cover" />
      </div>

      <div className="mt-3">
        <Label>Image</Label>
        <input
          className="admin-field"
          value={value}
          placeholder="/assets/images/…"
          // A pasted or hand-typed URL has no Cloudinary asset behind it, so the
          // stored id is cleared with it. Otherwise the row keeps naming an
          // earlier upload and the save route destroys a file this slot is no
          // longer using.
          onChange={(event) => onChange({ image: event.target.value, imagePublicId: null })}
        />
        <div className="mt-2">
          <ImageUpload
            value={value || undefined}
            folder={ABOUT_FOLDER}
            onBusyChange={onUploadBusy}
            onUploaded={(result) =>
              onChange({ image: result.imageUrl, imagePublicId: result.cloudinaryPublicId ?? null })
            }
          />
        </div>
        {usingFallback ? (
          <p className="mt-2 rounded bg-amber-50 px-2.5 py-1.5 text-[.65rem] font-semibold text-amber-800">
            Using the built-in photograph for this slot. Type a path or upload a file to replace it.
          </p>
        ) : null}
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
 * A `sectionKey` field that cannot be renamed.
 *
 * The key is the identity the front page dispatches on. It used to be a free
 * text input, and changing `about` to `about-2` saved without complaint, removed
 * the whole section from the homepage, and — because the editor picks its form
 * from the key — silently downgraded itself to a raw JSON textarea. Shown as
 * read-only text with the key spelled out instead.
 */
function SectionKeyBanner() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-[.68rem] font-bold text-zinc-900">
        About{" "}
        <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[.65rem] font-normal text-zinc-700">
          about
        </code>
      </p>
      <p className="mt-1 text-[.65rem] leading-5 text-zinc-600">
        The key is how the homepage identifies this section, so it is fixed. Renaming it would save
        cleanly and then take the section off the public page.
      </p>
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
  /**
   * The whole form reads from this state and nothing reads `initial` for a field
   * value.
   *
   * It used to be `const content = initial.content`, so every content-bound input
   * was a controlled field whose `onChange` updated state that no render ever
   * looked at. A keystroke landed in the state, the component re-rendered, and
   * the input was handed the original prop value again — the field looked frozen
   * and the typed text never reached the save payload. That covered the eyebrow
   * label, the button label, the button link, all three image URLs and all three
   * alt texts, plus the whole feature list, because those were derived from the
   * same frozen snapshot. Only the four fields that read `data.*` (heading,
   * description, visibility, order) worked, which is exactly the "some fields
   * save and some don't" report.
   */
  const [data, setData] = useState<Data>(() => ({
    ...initial,
    content: { ...((initial.content ?? {}) as Data) },
  }));

  // A router refresh can swap the row underneath this form; without this the
  // editor would go on showing the record that was open a moment ago.
  const signature = JSON.stringify([initial.id, initial.updatedAt]);
  const lastSignature = useRef(signature);
  useEffect(() => {
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;
    setData({ ...initial, content: { ...((initial.content ?? {}) as Data) } });
    // `initial` is a fresh object every render, and the signature is what
    // actually identifies a different row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const content = data.content as Data;

  // Fall back to the shipped copy only when the key is missing entirely, never
  // when it is an empty array: an editor who deletes every feature item means it,
  // and treating `[]` as "unset" would quietly put the defaults back on screen
  // and then save them over the top.
  const features: Feature[] = Array.isArray(content.features)
    ? (content.features as Feature[])
    : homeAboutDefaults.features;
  const gallery: GallerySlot[] = homeAboutDefaults.images.slice(1).map((fallback, index) => {
    const row = ((content.gallery as unknown[]) ?? [])[index] as Partial<GallerySlot> | undefined;
    return {
      // `??` would not do here: an empty string is a deliberate "use the built-in
      // photograph" and has to survive the round trip, so the check is explicit.
      image: typeof row?.image === "string" ? row.image : fallback.image,
      imagePublicId: typeof row?.imagePublicId === "string" ? row.imagePublicId : null,
      alt: typeof row?.alt === "string" ? row.alt : fallback.alt,
    };
  });
  const mainImage = typeof content.image === "string" ? content.image : homeAboutDefaults.images[0].image;
  const mainImagePublicId = typeof content.imagePublicId === "string" ? content.imagePublicId : null;
  const mainAlt = typeof content.imageAlt === "string" ? content.imageAlt : homeAboutDefaults.images[0].alt;

  function setContent(key: string, value: unknown) {
    setData((current) => ({ ...current, content: { ...(current.content as Data), [key]: value } }));
  }

  /**
   * Writes several `content` keys in one update.
   *
   * Needed wherever a pair has to stay consistent — an image URL and the Cloudinary
   * id it came from. Two separate `setContent` calls would each read `current`
   * from their own updater, which does work, but the two writes are then separate
   * renders and an interrupted one can leave a URL pointing at an asset the row
   * no longer records.
   */
  function setContentMany(values: Data) {
    setData((current) => ({ ...current, content: { ...(current.content as Data), ...values } }));
  }

  function setTop(key: string, value: unknown) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function setGallery(index: number, patch: Partial<GallerySlot>) {
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
    onSave({
      ...data,
      sectionKey: "about",
      content: {
        ...content,
        features: clean,
        // The three slots are always written out in full. Writing only the
        // changed one would leave the others absent from the payload, and the
        // save route replaces `content` wholesale — so an edit to the lead image
        // silently emptied the two thumbnails.
        image: mainImage,
        imagePublicId: mainImagePublicId,
        imageAlt: mainAlt,
        gallery,
      },
    });
  }

  const busy = saving || Boolean(uploading);

  return (
    <form onSubmit={submit}>
      <div className="space-y-6 p-5 sm:p-7">
        <SectionKeyBanner />
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Copy</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Eyebrow label</Label>
              <input
                className="admin-field"
                value={String(content.label ?? "")}
                onChange={(event) => setContent("label", event.target.value)}
              />
              <Help>
                Short kicker above the heading. A label that just repeats the heading is not shown twice,
                so the shipped &ldquo;About Rack &amp; Stack&rdquo; stays out of the way. Leave empty for that
                default.
              </Help>
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
                onChange={(event) => setTop("title", event.target.value)}
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
                onChange={(event) => setTop("subtitle", event.target.value)}
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
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <AboutImageField
              legend="Lead image"
              help="Landscape works best. This is the largest image in the section."
              value={mainImage}
              fallback={homeAboutDefaults.images[0].image}
              alt={mainAlt}
              onChange={(value) =>
                setContentMany({ image: value.image, imagePublicId: value.imagePublicId })
              }
              onAltChange={(alt) => setContent("imageAlt", alt)}
              onUploadBusy={onUploadBusy ?? (() => {})}
            />
            <div className="space-y-4">
              {gallery.map((row, index) => (
                <AboutImageField
                  key={index}
                  legend={`Supporting image ${index + 1}`}
                  help="Shown as a half-width thumbnail beneath the lead image."
                  value={row.image}
                  fallback={homeAboutDefaults.images[index + 1].image}
                  alt={row.alt}
                  onChange={(value) => setGallery(index, { image: value.image, imagePublicId: value.imagePublicId })}
                  onAltChange={(alt) => setGallery(index, { alt })}
                  onUploadBusy={onUploadBusy ?? (() => {})}
                />
              ))}
            </div>
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
              onChange={(event) => setTop("enabled", event.target.checked)}
            />
            <span className="text-sm font-semibold text-zinc-900">Visible on homepage</span>
          </label>
          <div>
            <Label>Display order</Label>
            <input
              className="admin-field"
              type="number"
              value={Number(data.displayOrder ?? 0)}
              onChange={(event) => setTop("displayOrder", Number(event.target.value))}
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
            {JSON.stringify({ ...content, image: mainImage, imageAlt: mainAlt, gallery, features }, null, 2)}
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
  const [data, setData] = useState<Data>(() => ({
    ...initial,
    content: { ...((initial.content ?? {}) as Data) },
  }));
  // Read from state, not from `initial` — see the same note on the About editor.
  // `ctaLabel` and `ctaHref` are controlled inputs, so deriving them from the
  // unchanged prop made both fields drop every keystroke.
  const content = data.content as Data;
  const setContent = (key: string, value: unknown) =>
    setData((current) => ({ ...current, content: { ...(current.content as Data), [key]: value } }));

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
              onChange={(event) => setContent("ctaLabel", event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[.68rem] font-bold text-zinc-700">Button link</label>
            <input
              className="admin-field"
              value={String(content.ctaHref ?? "")}
              placeholder="/products"
              onChange={(event) => setContent("ctaHref", event.target.value)}
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
