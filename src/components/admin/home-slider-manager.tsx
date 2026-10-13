"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";

export type HomeSliderItem = {
  id: number;
  eyebrow: string | null;
  title: string | null;
  highlightedText: string | null;
  headlineLines?: { text: string; color: string | null }[] | null;
  mobileHeadlineLines?: { text: string; color: string | null }[] | null;
  description: string | null;
  imageUrl: string | null;
  imagePublicId?: string | null;
  mobileImageUrl: string | null;
  mobileImagePublicId?: string | null;
  videoUrl: string | null;
  imageAlt: string | null;
  primaryButtonText: string | null;
  primaryButtonUrl: string | null;
  secondaryButtonText: string | null;
  secondaryButtonUrl: string | null;
  tertiaryButtonText: string | null;
  tertiaryButtonUrl: string | null;
  trustPoints: string[] | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  sortOrder: number;
  overlayOpacity: number;
  textAlignment: "left" | "center" | "right";
  autoplay: boolean;
  duration: number;
  titleScale?: number;
  updatedAt?: string | null;
  createdAt?: string | null;
};

/**
 * The slide's headline as coloured lines, for the admin previews.
 *
 * `headlineLines` is preferred; slides saved before that column existed fall
 * back to `title`/`highlightedText`. `color` may be `null`, letting each preview
 * pick a readable default against its own background.
 */
function headlineLinesOf(slide: HomeSliderItem): { text: string; color: string | null }[] {
  if (Array.isArray(slide.headlineLines) && slide.headlineLines.length) return slide.headlineLines;
  return [
    slide.title ? { text: slide.title, color: null } : null,
    slide.highlightedText ? { text: slide.highlightedText, color: "#E31E24" } : null,
  ].filter((line): line is { text: string; color: string | null } => line !== null);
}

export function HomeSliderManager({
  initialSlides,
  role,
  notice: initialNotice,
}: {
  initialSlides: HomeSliderItem[];
  role: string;
  notice?: string;
}) {
  const router = useRouter();
  const [slides, setSlides] = useState<HomeSliderItem[]>(initialSlides);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notice, setNotice] = useState(initialNotice ?? "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<HomeSliderItem | null>(null);

  const filtered = useMemo(() => {
    return [...slides]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .filter((slide) => {
        const matchesQuery =
          !query.trim() ||
          (slide.title && slide.title.toLowerCase().includes(query.toLowerCase())) ||
          (slide.eyebrow && slide.eyebrow.toLowerCase().includes(query.toLowerCase())) ||
          (slide.highlightedText && slide.highlightedText.toLowerCase().includes(query.toLowerCase())) ||
          (slide.description && slide.description.toLowerCase().includes(query.toLowerCase()));
        const matchesStatus = statusFilter === "ALL" || slide.status === statusFilter;
        return matchesQuery && matchesStatus;
      });
  }, [slides, query, statusFilter]);

  async function toggleStatus(slide: HomeSliderItem) {
    const nextStatus = slide.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setMessage("");
    setNotice("");
    setPending(true);
    try {
      const response = await fetch(`/api/admin/home-slider/${slide.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...slide, status: nextStatus }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setMessage(err.error || "Unable to update slide status.");
        return;
      }
      setSlides((prev) =>
        prev.map((item) => (item.id === slide.id ? { ...item, status: nextStatus } : item))
      );
      setNotice(
        `Slide #${slide.id} is now ${nextStatus === "PUBLISHED" ? "Live on the homepage" : "saved as Draft"}.`
      );
      router.refresh();
    } catch {
      setMessage("Network error while updating status.");
    } finally {
      setPending(false);
    }
  }

  async function moveSlide(slideId: number, direction: -1 | 1) {
    const sorted = [...slides].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    const index = sorted.findIndex((s) => s.id === slideId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;

    const reordered = [...sorted];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const updated = reordered.map((slide, pos) => ({ ...slide, sortOrder: pos }));

    const changed = updated.filter(
      (s) => s.sortOrder !== sorted.find((old) => old.id === s.id)?.sortOrder
    );
    if (!changed.length) return;

    setMessage("");
    setNotice("");
    setPending(true);
    try {
      for (const s of changed) {
        const res = await fetch(`/api/admin/home-slider/${s.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(s),
        });
        if (!res.ok) {
          setMessage("Failed to save new slide order.");
          return;
        }
      }
      setSlides(updated);
      setNotice("New slide order saved and published.");
      router.refresh();
    } catch {
      setMessage("Network error while reordering slides.");
    } finally {
      setPending(false);
    }
  }

  async function duplicateSlide(slideId: number) {
    setMessage("");
    setNotice("");
    setPending(true);
    try {
      const response = await fetch("/api/admin/home-slider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicateId: slideId }),
      });
      if (!response.ok) {
        setMessage("Unable to duplicate this slide.");
        return;
      }
      const newSlide = await response.json();
      setSlides((prev) => [...prev, newSlide]);
      setNotice("Slide duplicated as draft. Click edit to customize.");
      router.refresh();
    } catch {
      setMessage("Network error while duplicating slide.");
    } finally {
      setPending(false);
    }
  }

  async function deleteSlide(slideId: number) {
    setMessage("");
    setNotice("");
    setPending(true);
    try {
      const response = await fetch(`/api/admin/home-slider/${slideId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setMessage("Unable to delete this slide.");
        return;
      }
      setSlides((prev) => prev.filter((s) => s.id !== slideId));
      setNotice("Slide deleted successfully.");
      setConfirmDelete(null);
      router.refresh();
    } catch {
      setMessage("Network error while deleting slide.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section>
      {/* Header bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-100 text-red-600">
              <SlidersHorizontal size={15} />
            </span>
            <p className="text-[.68rem] font-bold uppercase tracking-widest text-red-600">
              Homepage Configuration
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Hero Slider Slides
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Control the high-impact hero banners, industrial badges, headlines, and call-to-actions shown on the home page.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            <ExternalLink size={14} /> Preview Live
          </Link>
          <Link
            href="/admin/home-slider/new"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800"
          >
            <Plus size={15} /> Add New Slide
          </Link>
        </div>
      </div>

      {/* Notice / Error messages */}
      {notice ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          {notice}
        </div>
      ) : null}
      {message ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
          {message}
        </div>
      ) : null}

      {/* Control bar: search, filters, and view toggle */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search slides by title, badge, text…"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-400"
          >
            <option value="ALL">All Statuses ({slides.length})</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Drafts Only</option>
          </select>
        </div>

        <div className="flex items-center gap-1 border-l border-zinc-200 pl-3">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            title="Visual Grid View"
            className={`grid h-8 w-8 place-items-center rounded-lg transition ${
              viewMode === "grid"
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            aria-label="Table view"
            title="Table View"
            className={`grid h-8 w-8 place-items-center rounded-lg transition ${
              viewMode === "table"
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-sm font-bold text-zinc-700">No slides matched your criteria.</p>
          <p className="mt-1 text-xs text-zinc-500">
            {query || statusFilter !== "ALL"
              ? "Try clearing filters or search terms."
              : "Get started by creating your first hero slider slide."}
          </p>
          <Link
            href="/admin/home-slider/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800"
          >
            <Plus size={14} /> Add First Slide
          </Link>
        </div>
      ) : null}

      {/* Visual Grid View */}
      {viewMode === "grid" && filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((slide, index) => {
            const hasSubheading = slide.description?.includes("\n\n");
            const parts = slide.description ? slide.description.split(/\n\n+/) : [];
            const subheading = hasSubheading ? parts[0] : null;
            const body = hasSubheading ? parts.slice(1).join("\n\n") : slide.description;
            const headlineLines = headlineLinesOf(slide);

            return (
              <div
                key={slide.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Visual Slide Mini-Hero Preview */}
                <div className="relative isolate flex min-h-[220px] flex-col justify-end overflow-hidden bg-zinc-950 p-5 text-white">
                  {slide.imageUrl ? (
                    <SmartImage
                      src={slide.imageUrl}
                      alt={slide.imageAlt || ""}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : null}
                  {/* Left-to-right vignette matching live hero */}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,#060709_0%,#060709_40%,rgba(6,7,9,0.85)_70%,rgba(6,7,9,0.2)_100%)] opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                  {/* Top badges bar */}
                  <div className="relative z-10 mb-auto flex items-start justify-between gap-2">
                    <span className="rounded bg-black/60 px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wider text-zinc-300 backdrop-blur">
                      Slide #{index + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.62rem] font-bold tracking-wider ${
                        slide.status === "PUBLISHED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          slide.status === "PUBLISHED" ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                      />
                      {slide.status}
                    </span>
                  </div>

                  {/* Hero typography preview */}
                  <div className="relative z-10 mt-3">
                    {slide.eyebrow ? (
                      <div className="mb-2 inline-flex items-center">
                        <span className="bg-[#E31E24] px-2.5 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.14em] text-white [clip-path:polygon(0_0,calc(100%-8px)_0,100%_100%,0_100%)] pr-4">
                          {slide.eyebrow}
                        </span>
                      </div>
                    ) : null}

                    <div className="font-black uppercase leading-tight tracking-tight [font-family:var(--font-industrial)]">
                      {headlineLines.map((line, lineIndex) => (
                        <div
                          key={lineIndex}
                          className="line-clamp-1 text-base"
                          style={{ color: line.color || "#FFFFFF" }}
                        >
                          {line.text}
                        </div>
                      ))}
                    </div>

                    <div className="my-2 h-0.5 w-10 bg-[#E31E24]" />

                    {subheading ? (
                      <div className="line-clamp-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-zinc-200">
                        {subheading}
                      </div>
                    ) : null}

                    {body ? (
                      <p className="mt-1 line-clamp-2 text-[0.65rem] leading-relaxed text-zinc-400">
                        {body}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Meta details bar */}
                <div className="border-b border-zinc-100 bg-zinc-50/70 p-3.5 text-[0.68rem] text-zinc-600">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">
                      Duration:{" "}
                      <strong className="text-zinc-800">
                        {slide.duration ? `${slide.duration / 1000}s` : "3.5s"}
                      </strong>
                    </span>
                    <span>
                      Align: <strong className="capitalize text-zinc-800">{slide.textAlignment || "left"}</strong>
                    </span>
                    <span>
                      Opacity:{" "}
                      <strong className="text-zinc-800">{slide.overlayOpacity ?? 72}%</strong>
                    </span>
                  </div>

                  {slide.primaryButtonText ? (
                    <div className="mt-2.5 flex items-center gap-1.5 text-zinc-500">
                      <span className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-[0.6rem] font-bold text-zinc-700">
                        CTA
                      </span>
                      <span className="truncate font-semibold text-zinc-700">
                        {slide.primaryButtonText}
                      </span>
                      {slide.primaryButtonUrl ? (
                        <span className="truncate text-zinc-400">({slide.primaryButtonUrl})</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* Card action buttons */}
                <div className="mt-auto flex items-center justify-between gap-1 p-3">
                  {/* Reorder arrows */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={pending || index === 0}
                      onClick={() => moveSlide(slide.id, -1)}
                      title="Move slide up"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={pending || index === filtered.length - 1}
                      onClick={() => moveSlide(slide.id, 1)}
                      title="Move slide down"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  {/* Status, Duplicate, Edit, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggleStatus(slide)}
                      title={slide.status === "PUBLISHED" ? "Unpublish slide" : "Publish slide"}
                      className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
                        slide.status === "PUBLISHED"
                          ? "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                          : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      {slide.status === "PUBLISHED" ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => duplicateSlide(slide.id)}
                      title="Duplicate slide"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100"
                    >
                      <Copy size={14} />
                    </button>

                    <Link
                      href={`/admin/home-slider/${slide.id}/edit`}
                      title="Edit slide"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-900 bg-zinc-950 text-white transition hover:bg-zinc-800"
                    >
                      <Edit3 size={14} />
                    </Link>

                    {role !== "EDITOR" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setConfirmDelete(slide)}
                        title="Delete slide"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Table View */}
      {viewMode === "table" && filtered.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-zinc-50 text-[0.62rem] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="p-4 w-12">#</th>
                  <th className="p-4">Preview</th>
                  <th className="p-4">Headline & Badge</th>
                  <th className="p-4">CTA Button</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((slide, index) => (
                  <tr key={slide.id} className="hover:bg-zinc-50">
                    <td className="p-4 font-bold text-zinc-400">{index + 1}</td>
                    <td className="p-4">
                      <div className="relative h-12 w-20 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950">
                        {slide.imageUrl ? (
                          <SmartImage
                            src={slide.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4">
                      {slide.eyebrow ? (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[0.62rem] font-bold text-red-600 uppercase">
                          {slide.eyebrow}
                        </span>
                      ) : null}
                      <p className="mt-1 font-bold text-zinc-900">
                        {headlineLinesOf(slide).length === 0 ? (
                          "Untitled slide"
                        ) : (
                          headlineLinesOf(slide).map((line, lineIndex, arr) => (
                            <span key={lineIndex} style={{ color: line.color || "#18181b" }}>
                              {line.text}
                              {lineIndex < arr.length - 1 ? " " : ""}
                            </span>
                          ))
                        )}
                      </p>
                      {slide.description ? (
                        <p className="mt-0.5 line-clamp-1 max-w-md text-[0.68rem] text-zinc-500">
                          {slide.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="p-4">
                      {slide.primaryButtonText ? (
                        <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[0.68rem] font-semibold text-zinc-700">
                          {slide.primaryButtonText}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[0.62rem] font-bold ${
                          slide.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {slide.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-500">
                      {slide.duration ? `${slide.duration / 1000}s` : "3.5s"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={pending || index === 0}
                          onClick={() => moveSlide(slide.id, -1)}
                          title="Move up"
                          className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={pending || index === filtered.length - 1}
                          onClick={() => moveSlide(slide.id, 1)}
                          title="Move down"
                          className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(slide)}
                          title={slide.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                          className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100"
                        >
                          {slide.status === "PUBLISHED" ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateSlide(slide.id)}
                          title="Duplicate"
                          className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100"
                        >
                          <Copy size={13} />
                        </button>
                        <Link
                          href={`/admin/home-slider/${slide.id}/edit`}
                          title="Edit"
                          className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-950 text-white hover:bg-zinc-800"
                        >
                          <Edit3 size={13} />
                        </Link>
                        {role !== "EDITOR" ? (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(slide)}
                            title="Delete"
                            className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-zinc-900">Confirm Slide Deletion</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">
              Are you sure you want to delete slide #
              <strong className="text-zinc-900">{confirmDelete.id}</strong> (
              <span className="italic">{confirmDelete.title || "Untitled"}</span>)? This action
              cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => deleteSlide(confirmDelete.id)}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Delete Slide
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
