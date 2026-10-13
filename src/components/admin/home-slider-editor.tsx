"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Eye,
  MoveUpRight,
  Plus,
  Rocket,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import { SmartImage } from "@/components/site/smart-image";

type HeadlineLineState = { text: string; color: string | null };

const HEADLINE_WHITE = "#FFFFFF";
const HEADLINE_RED = "#E31E24";

/** Accepts `#RGB`/`#RRGGBB` (with or without `#`) and returns canonical `#RRGGBB`, or `""`. */
function normalizeHex(value: string): string {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return "";
  const hex = match[1];
  const full = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
  return `#${full.toUpperCase()}`;
}

function colorDistance(a: string, b: string): number {
  return Math.max(
    Math.abs(parseInt(a.slice(1, 3), 16) - parseInt(b.slice(1, 3), 16)),
    Math.abs(parseInt(a.slice(3, 5), 16) - parseInt(b.slice(3, 5), 16)),
    Math.abs(parseInt(a.slice(5, 7), 16) - parseInt(b.slice(5, 7), 16)),
  );
}

/** Human label for the current colour, used to name each headline line in the editor. */
function headlineLineLabel(color: string | null): string {
  const hex = normalizeHex(color ?? "");
  if (hex && colorDistance(hex, HEADLINE_WHITE) <= 40) return "White Ultra-Bold";
  if (hex && colorDistance(hex, HEADLINE_RED) <= 40) return "Brand Red Ultra-Bold";
  return "Custom Colour";
}

/**
 * Seeds the per-line headline editor from a slide.
 *
 * Preference order: the stored `headlineLines`, then the legacy
 * `title`/`highlightedText` pair (white + brand red), then an empty two-line
 * scaffold so a brand new slide still opens with "Line 1 / Line 2".
 */
function initialStateLines(data: Record<string, unknown>): HeadlineLineState[] {
  const raw = data.headlineLines;
  if (Array.isArray(raw) && raw.length) {
    const parsed = raw
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const record = entry as Record<string, unknown>;
        const text = typeof record.text === "string" ? record.text : "";
        const color = typeof record.color === "string" && record.color ? normalizeHex(record.color) || null : null;
        return { text, color } as HeadlineLineState;
      })
      .filter((entry): entry is HeadlineLineState => entry !== null);
    if (parsed.length) return parsed;
  }
  const derived: HeadlineLineState[] = [];
  if (data.title) derived.push({ text: String(data.title), color: HEADLINE_WHITE });
  if (data.highlightedText) derived.push({ text: String(data.highlightedText), color: HEADLINE_RED });
  return derived.length ? derived : [{ text: "", color: HEADLINE_WHITE }, { text: "", color: HEADLINE_RED }];
}

/**
 * Seeds the mobile headline-lines editor from a slide.
 *
 * Preference order: the stored `mobileHeadlineLines`, then a copy of the
 * desktop lines so a fresh slide inherits a usable mobile split that the admin
 * can tighten per breakpoint (empty mobile lines make the hero reuse the
 * desktop lines, so leaving the field blank is always safe).
 */
function initialStateMobileLines(data: Record<string, unknown>): HeadlineLineState[] {
  const raw = data.mobileHeadlineLines;
  if (Array.isArray(raw) && raw.length) {
    const parsed = raw
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const record = entry as Record<string, unknown>;
        const text = typeof record.text === "string" ? record.text : "";
        const color = typeof record.color === "string" && record.color ? normalizeHex(record.color) || null : null;
        return { text, color } as HeadlineLineState;
      })
      .filter((entry): entry is HeadlineLineState => entry !== null);
    if (parsed.length) return parsed;
  }
  return initialStateLines(data).map((line) => ({ ...line }));
}

export type SliderFormData = {
  id?: number;
  eyebrow?: string | null;
  title?: string | null;
  highlightedText?: string | null;
  headlineLines?: { text: string; color: string | null }[] | null;
  mobileHeadlineLines?: { text: string; color: string | null }[] | null;
  subheading?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  mobileImageUrl?: string | null;
  mobileImagePublicId?: string | null;
  videoUrl?: string | null;
  imageAlt?: string | null;
  primaryButtonText?: string | null;
  primaryButtonUrl?: string | null;
  secondaryButtonText?: string | null;
  secondaryButtonUrl?: string | null;
  tertiaryButtonText?: string | null;
  tertiaryButtonUrl?: string | null;
  trustPoints?: string[] | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  sortOrder?: number;
  overlayOpacity?: number;
  textAlignment?: "left" | "center" | "right";
  autoplay?: boolean;
  duration?: number;
  titleScale?: number;
};

/**
 * Editor for one set of per-line headline blocks (desktop or mobile).
 *
 * Both sets share the same authoring model — each box is one headline line, an
 * Enter inside a box adds a hard line break within it, and colour is chosen per
 * line — so the two controls render through one field and can never drift apart.
 */
function HeadlineLinesField({
  title,
  lines,
  onChange,
  helper,
  addLabel = "Add headline line",
  extraActions,
}: {
  title: string;
  lines: HeadlineLineState[];
  onChange: (next: HeadlineLineState[]) => void;
  helper?: ReactNode;
  addLabel?: string;
  extraActions?: ReactNode;
}) {
  function update(index: number, patch: Partial<HeadlineLineState>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }
  function add() {
    onChange([...lines, { text: "", color: null }]);
  }
  function remove(index: number) {
    if (lines.length <= 1) return;
    onChange(lines.filter((_, i) => i !== index));
  }

  return (
    <div className="sm:col-span-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label className="block text-xs font-bold text-zinc-700">
          {title} ({lines.length})
        </label>
        <span className="text-[0.62rem] font-semibold text-zinc-500">
          Press Enter for a new line inside a box · font family &amp; weight stay identical · colour is per line
        </span>
      </div>
      {helper ? <div className="mt-1 text-[0.68rem] text-zinc-500">{helper}</div> : null}

      <div className="mt-3 space-y-3">
        {lines.map((line, index) => {
          const swatch = normalizeHex(line.color ?? "") || "#FFFFFF";
          return (
            <div key={index} className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700">
                  Headline Line {index + 1}
                  <span className="rounded-full bg-zinc-200/80 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-zinc-600">
                    {headlineLineLabel(line.color)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={lines.length <= 1}
                  title="Remove this headline line"
                  className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-zinc-400 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={11} /> Remove
                </button>
              </div>

              <textarea
                rows={2}
                value={line.text}
                onChange={(e) => update(index, { text: e.target.value })}
                onKeyDown={(e) => {
                  // Enter must insert a line break here, never submit the form.
                  if (e.key === "Enter") e.stopPropagation();
                }}
                placeholder={
                  index === 0 ? "PRECISION STORAGE" : index === 1 ? "RACKING SOLUTIONS" : "ANOTHER HEADLINE LINE"
                }
                className="admin-field w-full font-black uppercase leading-tight"
                style={{ color: swatch === "#FFFFFF" ? "#18181b" : swatch }}
              />

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-[0.62rem] font-bold text-zinc-600">
                  <input
                    type="color"
                    value={swatch}
                    onChange={(e) => update(index, { color: normalizeHex(e.target.value) || null })}
                    aria-label={`Colour for headline line ${index + 1}`}
                    className="h-7 w-9 cursor-pointer rounded border border-zinc-300 bg-white p-0.5"
                  />
                  Colour
                </label>
                <input
                  type="text"
                  value={line.color ?? ""}
                  onChange={(e) => update(index, { color: e.target.value.toUpperCase() })}
                  onBlur={(e) => update(index, { color: normalizeHex(e.target.value) || null })}
                  placeholder="#FFFFFF"
                  className="admin-field w-28 text-xs uppercase"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => update(index, { color: HEADLINE_WHITE })}
                    className="rounded border border-zinc-300 bg-white px-2 py-1 text-[0.6rem] font-bold text-zinc-700 hover:bg-zinc-50"
                  >
                    White
                  </button>
                  <button
                    type="button"
                    onClick={() => update(index, { color: HEADLINE_RED })}
                    className="rounded border border-zinc-300 bg-white px-2 py-1 text-[0.6rem] font-bold text-red-600 hover:bg-red-50"
                  >
                    Red
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
        >
          <Plus size={13} /> {addLabel}
        </button>
        {extraActions}
      </div>
    </div>
  );
}

export function HomeSliderEditor({
  initialData = {},
  onSave,
  onPublish,
  saving,
  publishing,
  uploading,
  error,
  onUploadBusy,
}: {
  initialData?: Record<string, unknown>;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onPublish?: (payload: Record<string, unknown>) => Promise<void>;
  saving: boolean;
  publishing?: boolean;
  uploading: boolean;
  error?: string;
  onUploadBusy: (busy: boolean) => void;
}) {
  // Parse initial description into subheading and body if present
  const rawDescription = String(initialData.description || "");
  const initialParts = rawDescription.split(/\n\n+/);
  const initialSubheading =
    initialData.subheading !== undefined
      ? String(initialData.subheading || "")
      : initialParts.length > 1
        ? initialParts[0]
        : "";
  const initialBody =
    initialParts.length > 1 ? initialParts.slice(1).join("\n\n") : rawDescription;

  const [eyebrow, setEyebrow] = useState(String(initialData.eyebrow || "RACK & STACK STORAGE SYSTEMS"));
  const [headlineLines, setHeadlineLines] = useState<HeadlineLineState[]>(() => initialStateLines(initialData));
  const [mobileHeadlineLines, setMobileHeadlineLines] = useState<HeadlineLineState[]>(() =>
    initialStateMobileLines(initialData),
  );
  const [subheading, setSubheading] = useState(initialSubheading);
  const [bodyDescription, setBodyDescription] = useState(initialBody);

  const [imageUrl, setImageUrl] = useState(String(initialData.imageUrl || "/assets/images/hero/home-sliders-uny8efktot7jpzcmos1k-2a270d4046.webp"));
  const [imagePublicId, setImagePublicId] = useState(String(initialData.imagePublicId || ""));
  const [mobileImageUrl, setMobileImageUrl] = useState(String(initialData.mobileImageUrl || ""));
  const [mobileImagePublicId, setMobileImagePublicId] = useState(String(initialData.mobileImagePublicId || ""));
  const [videoUrl, setVideoUrl] = useState(String(initialData.videoUrl || ""));
  const [imageAlt, setImageAlt] = useState(String(initialData.imageAlt || ""));

  const [primaryButtonText, setPrimaryButtonText] = useState(String(initialData.primaryButtonText || "View Products"));
  const [primaryButtonUrl, setPrimaryButtonUrl] = useState(String(initialData.primaryButtonUrl || "/products"));
  const [secondaryButtonText, setSecondaryButtonText] = useState(String(initialData.secondaryButtonText || "Request a Quote"));
  const [secondaryButtonUrl, setSecondaryButtonUrl] = useState(String(initialData.secondaryButtonUrl || "/request-a-quote"));
  const [tertiaryButtonText, setTertiaryButtonText] = useState(String(initialData.tertiaryButtonText || "Talk to Us"));
  const [tertiaryButtonUrl, setTertiaryButtonUrl] = useState(String(initialData.tertiaryButtonUrl || "/contact"));

  const [trustPoints, setTrustPoints] = useState<string[]>(
    Array.isArray(initialData.trustPoints)
      ? (initialData.trustPoints as string[])
      : ["MANUFACTURER", "SUPPLY", "INSTALLATION"]
  );
  const [newTrustPoint, setNewTrustPoint] = useState("");

  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(
    (initialData.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "PUBLISHED"
  );
  const [sortOrder, setSortOrder] = useState<number>(Number(initialData.sortOrder ?? 0));
  const [overlayOpacity, setOverlayOpacity] = useState<number>(Number(initialData.overlayOpacity ?? 75));
  const [textAlignment, setTextAlignment] = useState<"left" | "center" | "right">(
    (initialData.textAlignment as "left" | "center" | "right") || "left"
  );
  const [autoplay, setAutoplay] = useState<boolean>(initialData.autoplay !== false);
  const [duration, setDuration] = useState<number>(Number(initialData.duration || 7000));
  const [titleScale, setTitleScale] = useState<number>(Number(initialData.titleScale ?? 1));
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  function buildPayload(explicitStatus?: "PUBLISHED" | "DRAFT") {
    // Combine subheading and body into description
    const fullDescription = subheading.trim()
      ? `${subheading.trim()}\n\n${bodyDescription.trim()}`
      : bodyDescription.trim();

    // Normalise the per-line headline. Newlines inside a line are preserved so
    // an Enter pressed in the textarea becomes a real break; blank lines drop.
    const lines = headlineLines
      .map((line) => ({
        text: line.text.replace(/\r\n/g, "\n").trim(),
        color: line.color ? normalizeHex(line.color) || null : null,
      }))
      .filter((line) => line.text.length > 0);

    // The optional mobile split follows the same shape. Empty is meaningful:
    // an empty array makes the hero fall back to the desktop lines on phones.
    const mobileLines = mobileHeadlineLines
      .map((line) => ({
        text: line.text.replace(/\r\n/g, "\n").trim(),
        color: line.color ? normalizeHex(line.color) || null : null,
      }))
      .filter((line) => line.text.length > 0);

    return {
      ...initialData,
      eyebrow: eyebrow.trim() || null,
      headlineLines: lines,
      mobileHeadlineLines: mobileLines,
      // Mirror into the legacy pair so list previews and any older consumer keep
      // the same copy. The hero itself renders `headlineLines`.
      title: lines[0]?.text ?? null,
      highlightedText: lines.length > 1 ? lines.slice(1).map((line) => line.text).join("\n") : null,
      description: fullDescription || null,
      imageUrl: imageUrl.trim() || null,
      imagePublicId: imagePublicId.trim() || null,
      mobileImageUrl: mobileImageUrl.trim() || null,
      mobileImagePublicId: mobileImagePublicId.trim() || null,
      videoUrl: videoUrl.trim() || null,
      imageAlt: imageAlt.trim() || null,
      primaryButtonText: primaryButtonText.trim() || null,
      primaryButtonUrl: primaryButtonUrl.trim() || null,
      secondaryButtonText: secondaryButtonText.trim() || null,
      secondaryButtonUrl: secondaryButtonUrl.trim() || null,
      tertiaryButtonText: tertiaryButtonText.trim() || null,
      tertiaryButtonUrl: tertiaryButtonUrl.trim() || null,
      trustPoints: trustPoints.filter(Boolean),
      status: explicitStatus || status,
      sortOrder: Number(sortOrder),
      overlayOpacity: Math.max(0, Math.min(100, Number(overlayOpacity))),
      textAlignment,
      autoplay,
      duration: Math.max(2000, Number(duration)),
      titleScale: Math.max(0.5, Number(titleScale) || 1),
    };
  }

  function handleAddTrustPoint() {
    if (!newTrustPoint.trim()) return;
    setTrustPoints([...trustPoints, newTrustPoint.trim().toUpperCase()]);
    setNewTrustPoint("");
  }

  function handleRemoveTrustPoint(index: number) {
    setTrustPoints(trustPoints.filter((_, i) => i !== index));
  }

  const busy = saving || (publishing ?? false) || uploading;

  // The preview mirrors the public hero: mobile lines below 768px, desktop
  // lines above. The admin can force either side with the toggle, and an empty
  // mobile block always falls back to the desktop lines (exactly as the site).
  const previewLines =
    (previewDevice === "mobile" && mobileHeadlineLines.some((line) => line.text.trim())
      ? mobileHeadlineLines
      : headlineLines).filter((line) => line.text.trim());

  return (
    <div className="space-y-8">
      {/* Top Banner Live Preview Container */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 shadow-md">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-zinc-900/80 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Live Preview (Exact Hero Presentation)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-zinc-950/80 p-0.5 text-[0.62rem] font-bold">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                aria-pressed={previewDevice === "desktop"}
                className={`rounded-md px-2.5 py-1 uppercase tracking-wider transition ${
                  previewDevice === "desktop" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                aria-pressed={previewDevice === "mobile"}
                className={`rounded-md px-2.5 py-1 uppercase tracking-wider transition ${
                  previewDevice === "mobile" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Mobile
              </button>
            </div>
            <span className="hidden text-[0.68rem] text-zinc-400 sm:inline">Updates live as you edit</span>
          </div>
        </div>

        {/* The Live Hero Visual Container — constrained to a phone column while the
              Mobile toggle is active, so the mobile line split wraps exactly as
              it will on a handset. */}
        <div
          className={`relative isolate flex min-h-[420px] flex-col overflow-hidden bg-zinc-950 text-white transition-all ${
            previewDevice === "mobile"
              ? "mx-auto w-full max-w-[400px] justify-start p-5 pt-7 sm:p-6 sm:pt-9"
              : "justify-center p-6 sm:p-10 md:p-14"
          }`}
        >
          {imageUrl ? (
            <div className="absolute inset-0">
              <SmartImage
                src={imageUrl}
                alt={imageAlt || "Hero preview"}
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
          ) : null}

          {/* Vignette Gradient Overlay */}
          <div
            className="absolute inset-0 bg-[linear-gradient(90deg,#060709_0%,#060709_32%,rgba(6,7,9,0.92)_52%,rgba(6,7,9,0.4)_78%,rgba(6,7,9,0.12)_100%)] max-md:bg-[linear-gradient(180deg,#060709_0%,rgba(6,7,9,0.94)_65%,rgba(6,7,9,0.65)_100%)]"
            style={{ opacity: 0.6 + (Math.max(0, Math.min(100, overlayOpacity)) / 100) * 0.4 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/35 pointer-events-none" />

          {/* Inner Content Block */}
          <div
            className={`relative z-10 max-w-2xl ${
              textAlignment === "center"
                ? "mx-auto text-center items-center"
                : textAlignment === "right"
                  ? "ml-auto text-right items-end"
                  : "text-left items-start"
            }`}
          >
            {/* Red Angled Ribbon Badge */}
            {eyebrow ? (
              <div className="inline-flex items-center relative mb-4 sm:mb-5 select-none">
                <span className="relative z-10 bg-[#E31E24] text-white font-black uppercase text-[0.72rem] sm:text-xs tracking-[0.16em] px-4 py-1.5 shadow-lg hero-badge-angled pr-7">
                  {eyebrow}
                </span>
                <span
                  className="absolute -bottom-1.5 right-0.5 w-3.5 h-2 bg-[#8b0f14] [clip-path:polygon(0_0,100%_0,0_100%)] -z-0"
                  aria-hidden="true"
                />
              </div>
            ) : null}

            {/* Massive Bold Headline — one coloured block per line, matching the
                public hero exactly (same font family/weight, colour per line). */}
            {previewLines.length > 0 ? (
              <h1
                className="hero-industrial-title text-balance"
                style={{ "--headline-scale": titleScale } as CSSProperties}
              >
                {previewLines.map((line, index) => (
                  <span
                    key={index}
                    className="block whitespace-pre-line drop-shadow-md"
                    style={line.color ? { color: normalizeHex(line.color) || line.color } : undefined}
                  >
                    {line.text}
                  </span>
                ))}
              </h1>
            ) : null}

            {/* Red Horizontal Accent Line */}
            <div
              className={`w-16 sm:w-20 h-1 sm:h-1.5 bg-[#E31E24] mt-4 mb-4 ${
                textAlignment === "center"
                  ? "mx-auto"
                  : textAlignment === "right"
                    ? "ml-auto"
                    : ""
              }`}
              aria-hidden="true"
            />

            {/* Subheading & Description */}
            <div className="space-y-2">
              {subheading ? (
                <h2 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wider text-white drop-shadow-sm">
                  {subheading}
                </h2>
              ) : null}
              {bodyDescription ? (
                <p className="hero-description text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-xl text-pretty font-normal">
                  {bodyDescription}
                </p>
              ) : null}
            </div>

            {/* CTAs */}
            <div
              className={`mt-6 flex flex-wrap items-center gap-3 ${
                textAlignment === "center"
                  ? "justify-center"
                  : textAlignment === "right"
                    ? "justify-end"
                    : "justify-start"
              }`}
            >
              {primaryButtonText ? (
                <span className="btn-primary inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs px-5 py-2.5 shadow-lg shadow-red-950/40">
                  {primaryButtonText}
                  <MoveUpRight size={14} />
                </span>
              ) : null}
              {secondaryButtonText ? (
                <span className="btn-light inline-flex items-center font-bold uppercase tracking-wider text-xs px-5 py-2.5 backdrop-blur-sm bg-white/10">
                  {secondaryButtonText}
                </span>
              ) : null}
              {tertiaryButtonText ? (
                <span className="inline-flex items-center gap-1.5 border-b border-white/25 px-1 pb-0.5 text-xs font-bold uppercase tracking-[.14em] text-zinc-200">
                  {tertiaryButtonText}
                  <MoveUpRight size={12} />
                </span>
              ) : null}
            </div>

            {/* Trust points */}
            {trustPoints.length > 0 ? (
              <ul
                className={`mt-5 flex flex-wrap gap-x-5 gap-y-1.5 ${
                  textAlignment === "center"
                    ? "justify-center"
                    : textAlignment === "right"
                      ? "justify-end"
                      : "justify-start"
                }`}
              >
                {trustPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-zinc-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E31E24] shadow-[0_0_6px_rgba(227,30,36,0.6)]" />
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {/* Editing Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(buildPayload());
        }}
        className="space-y-6"
      >
        {/* Section 1: Typography & Copy */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="border-b border-zinc-100 pb-3 text-sm font-bold text-zinc-900">
            1. Headline, Badge & Copy
          </h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-zinc-700">
                Eyebrow Red Badge Text
              </label>
              <input
                type="text"
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                placeholder="RACK & STACK STORAGE SYSTEMS"
                className="admin-field w-full font-bold uppercase tracking-wider"
              />
              <p className="mt-1 text-[0.68rem] text-zinc-500">
                Displays as the slanted red ribbon tag above the main headline.
              </p>
            </div>

            <HeadlineLinesField
              title="Headline Lines — Desktop"
              lines={headlineLines}
              onChange={setHeadlineLines}
              helper={
                <>
                  Each box is one headline line shown on desktop and tablet. The
                  colour picker (or a hex such as <code className="rounded bg-zinc-100 px-1">#E31E24</code>) sets
                  that line&apos;s colour — white lines first, then brand-red lines.
                </>
              }
            />

            <div className="sm:col-span-2 rounded-lg border border-red-100 bg-red-50/40 p-3">
              <HeadlineLinesField
                title="Headline Lines — Mobile (optional)"
                lines={mobileHeadlineLines}
                onChange={setMobileHeadlineLines}
                addLabel="Add mobile line"
                helper={
                  <>
                    Phones (<span className="font-semibold">&lt;768px</span>) wrap this copy dynamically near the
                    top of the hero. Keep lines short (2&ndash;4 words) so the headline stays one or two tight
                    rows. <span className="font-semibold">Keep this empty to reuse the desktop lines</span>.
                  </>
                }
                extraActions={
                  mobileHeadlineLines.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setMobileHeadlineLines([])}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700"
                      title="Clear the mobile split so phones fall back to the desktop headline"
                    >
                      Use desktop lines instead
                    </button>
                  ) : null
                }
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label className="block text-xs font-bold text-zinc-700">
                  Headline Size (desktop &amp; mobile)
                </label>
                <span className="text-[0.62rem] font-semibold text-zinc-500">
                  {Math.round(titleScale * 100)}% of default
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  { label: "Small", value: 0.8 },
                  { label: "Normal", value: 1 },
                  { label: "Large", value: 1.15 },
                  { label: "X-Large", value: 1.3 },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setTitleScale(preset.value)}
                    aria-pressed={Math.abs(titleScale - preset.value) < 0.001}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      Math.abs(titleScale - preset.value) < 0.001
                        ? "bg-red-600 text-white shadow-sm"
                        : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="0.5"
                max="1.6"
                step="0.05"
                value={titleScale}
                onChange={(e) => setTitleScale(Number(e.target.value))}
                aria-label="Headline size scale"
                className="mt-3 w-full accent-red-600"
              />
              <p className="mt-1 text-[0.68rem] text-zinc-500">
                Scales the title block — e.g. &ldquo;Heavy Duty Racking Built&rdquo; / &ldquo;BUILT FOR YOUR
                OPERATION.&rdquo; — on desktop and mobile, and updates the preview above live. 1 keeps the
                curated default size.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-zinc-700">
                Tagline / Subheading Statement
              </label>
              <input
                type="text"
                value={subheading}
                onChange={(e) => setSubheading(e.target.value)}
                placeholder="ENGINEERED FOR INDUSTRIAL STORAGE"
                className="admin-field w-full font-bold uppercase tracking-wider text-zinc-800"
              />
              <p className="mt-1 text-[0.68rem] text-zinc-500">
                Bold uppercase statement displayed below the red accent line.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-zinc-700">
                Body Description Paragraph
              </label>
              <textarea
                rows={3}
                value={bodyDescription}
                onChange={(e) => setBodyDescription(e.target.value)}
                placeholder="We design, manufacture and install high-quality industrial storage and warehouse racking systems that maximise space utilisation, improve inventory organisation and support efficient material handling."
                className="admin-field w-full leading-relaxed"
              />
              <p className="mt-1 text-[0.68rem] text-zinc-500">
                Detailed description paragraph explaining capabilities and engineering standards.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Background Images */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="border-b border-zinc-100 pb-3 text-sm font-bold text-zinc-900">
            2. Hero Background Images
          </h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-700">
                Desktop Background Image
              </label>
              <ImageUpload
                folder="home-sliders"
                value={imageUrl || undefined}
                onUploaded={(result) => {
                  setImageUrl(result.imageUrl);
                  setImagePublicId(result.cloudinaryPublicId || "");
                }}
                onBusyChange={onUploadBusy}
              />
              <p className="mt-1 text-[0.68rem] text-zinc-500">
                High-resolution industrial warehouse photo (1920x1080 or wider recommended).
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-700">
                Mobile Background Image (Optional)
              </label>
              <ImageUpload
                folder="home-sliders"
                value={mobileImageUrl || undefined}
                onUploaded={(result) => {
                  setMobileImageUrl(result.imageUrl);
                  setMobileImagePublicId(result.cloudinaryPublicId || "");
                }}
                onBusyChange={onUploadBusy}
              />
              <p className="mt-1 text-[0.68rem] text-zinc-500">
                Optional mobile crop. If left blank, uses desktop image.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-700">
                Image Alt Text
              </label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Industrial pallet racking warehouse system"
                className="admin-field w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-700">
                Background Video URL (Optional MP4)
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/warehouse-bg.mp4"
                className="admin-field w-full"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Buttons & CTAs */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="border-b border-zinc-100 pb-3 text-sm font-bold text-zinc-900">
            3. Call-to-Action Buttons
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
              <span className="mb-2 block text-xs font-bold text-red-600">Primary Button</span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={primaryButtonText}
                  onChange={(e) => setPrimaryButtonText(e.target.value)}
                  placeholder="View Products"
                  className="admin-field w-full text-xs font-semibold"
                />
                <input
                  type="text"
                  value={primaryButtonUrl}
                  onChange={(e) => setPrimaryButtonUrl(e.target.value)}
                  placeholder="/products"
                  className="admin-field w-full text-xs"
                />
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
              <span className="mb-2 block text-xs font-bold text-zinc-700">Secondary Button</span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={secondaryButtonText}
                  onChange={(e) => setSecondaryButtonText(e.target.value)}
                  placeholder="Request a Quote"
                  className="admin-field w-full text-xs font-semibold"
                />
                <input
                  type="text"
                  value={secondaryButtonUrl}
                  onChange={(e) => setSecondaryButtonUrl(e.target.value)}
                  placeholder="/request-a-quote"
                  className="admin-field w-full text-xs"
                />
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
              <span className="mb-2 block text-xs font-bold text-zinc-700">Tertiary Link</span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={tertiaryButtonText}
                  onChange={(e) => setTertiaryButtonText(e.target.value)}
                  placeholder="Talk to Us"
                  className="admin-field w-full text-xs font-semibold"
                />
                <input
                  type="text"
                  value={tertiaryButtonUrl}
                  onChange={(e) => setTertiaryButtonUrl(e.target.value)}
                  placeholder="/contact"
                  className="admin-field w-full text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Trust Points */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="border-b border-zinc-100 pb-3 text-sm font-bold text-zinc-900">
            4. Trust Points / Value Badges
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Short proof points shown beneath the buttons (e.g. &ldquo;MANUFACTURER&rdquo;, &ldquo;SUPPLY&rdquo;, &ldquo;INSTALLATION&rdquo;).
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {trustPoints.map((point, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-800"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                {point}
                <button
                  type="button"
                  onClick={() => handleRemoveTrustPoint(index)}
                  className="ml-1 text-zinc-400 hover:text-red-600"
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>

          <div className="mt-4 flex max-w-sm items-center gap-2">
            <input
              type="text"
              value={newTrustPoint}
              onChange={(e) => setNewTrustPoint(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTrustPoint();
                }
              }}
              placeholder="e.g. CUSTOM LAYOUTS"
              className="admin-field flex-1 text-xs uppercase"
            />
            <button
              type="button"
              onClick={handleAddTrustPoint}
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800"
            >
              <Plus size={13} /> Add
            </button>
          </div>
        </div>

        {/* Section 5: Slider Configuration & Publishing */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="border-b border-zinc-100 pb-3 text-sm font-bold text-zinc-900">
            5. Display Settings & Publishing Status
          </h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-700">
                Publishing Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED")}
                className="admin-field w-full font-bold"
              >
                <option value="PUBLISHED">PUBLISHED (Live on site)</option>
                <option value="DRAFT">DRAFT (Hidden)</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-700">
                Darkness Vignette Opacity ({overlayOpacity}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                className="mt-2 w-full accent-red-600"
              />
              <span className="text-[0.68rem] text-zinc-500">
                70-80% ensures perfect contrast on all screens.
              </span>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-700">
                Text Alignment
              </label>
              <select
                value={textAlignment}
                onChange={(e) => setTextAlignment(e.target.value as "left" | "center" | "right")}
                className="admin-field w-full"
              >
                <option value="left">Left (Industrial standard)</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-700">
                Slide Hold Duration (ms)
              </label>
              <input
                type="number"
                step="500"
                min="2000"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="admin-field w-full"
              />
              <span className="text-[0.68rem] text-zinc-500">
                Default: 7000ms (7 seconds)
              </span>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-700">
                Sort Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="admin-field w-full"
              />
              <span className="text-[0.68rem] text-zinc-500">
                0 is the first slide seen by visitors.
              </span>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoplay}
                  onChange={(e) => setAutoplay(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 accent-red-600"
                />
                <span className="text-xs font-bold text-zinc-800">
                  Enable Autoplay Rotation
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-xl backdrop-blur">
          <Link
            href="/admin/home-slider"
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-950 bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              <Save size={15} />
              {saving && !publishing ? "Saving…" : "Save changes"}
            </button>

            {onPublish ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onPublish(buildPayload("PUBLISHED"))}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/30 transition hover:bg-red-700 disabled:opacity-50"
              >
                <Rocket size={15} />
                {publishing ? "Publishing live…" : "Save & Publish"}
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
