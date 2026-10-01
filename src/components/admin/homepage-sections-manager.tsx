"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Info,
  Plus,
  Rocket,
  Trash2,
} from "lucide-react";
import {
  HOMEPAGE_BAND_BLURBS,
  HOMEPAGE_BAND_KEYS,
  HOMEPAGE_BAND_LABELS,
  HOMEPAGE_BAND_ORDERS,
  isHomepageBandKey,
  type HomepageBandKey,
} from "@/lib/homepage-bands";

export type HomepageSectionRow = {
  id: number;
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown> | null;
  enabled: boolean;
  displayOrder: number;
  updatedAt?: string | null;
};

const ENDPOINT = "/api/admin/homepage";
const byOrder = (a: HomepageSectionRow, b: HomepageSectionRow) => a.displayOrder - b.displayOrder || a.id - b.id;

/** How many images a band's `content` currently points at, for the summary line. */
function imageCount(content: Record<string, unknown> | null): number {
  if (!content) return 0;
  let count = typeof content.image === "string" && content.image ? 1 : 0;
  if (typeof content.background === "string" && content.background) count += 1;
  if (Array.isArray(content.gallery)) {
    count += content.gallery.filter((slot) => {
      const image = (slot as Record<string, unknown> | null)?.image;
      return typeof image === "string" && Boolean(image);
    }).length;
  }
  return count;
}

/** The editorial lists a band holds, so the row can say what it actually contains. */
function listSummary(content: Record<string, unknown> | null): string {
  if (!content) return "";
  const counts: string[] = [];
  const add = (key: string, singular: string, plural: string) => {
    const value = content[key];
    if (Array.isArray(value) && value.length) counts.push(`${value.length} ${value.length === 1 ? singular : plural}`);
  };
  add("features", "feature", "features");
  add("gallery", "image", "images");
  add("items", "capability", "capabilities");
  add("cards", "point", "points");
  add("stats", "figure", "figures");
  add("steps", "step", "steps");
  return counts.join(" · ");
}

/**
 * `/admin/homepage`.
 *
 * This replaces the generic table for this collection, which could not answer the
 * three questions that matter on this screen:
 *
 *   - which bands are actually on the public page? The table's Status column
 *     reads `status` and `isActive` while this table has `enabled`, so every row
 *     displayed "—" and an editor could not tell a live band from a hidden one.
 *   - what order are they in? `displayOrder` was not a registered ordering field,
 *     so the table sorted alphabetically by section key and the list order bore no
 *     relation to the order the page rendered.
 *   - is this row used at all? A row whose `sectionKey` is not one the homepage
 *     renders — the residue of a rename, or a band that was never wired up — is
 *     invisible on the site while occupying a slot in the table. Those rows are
 *     marked here and are the *only* ones that can be deleted.
 */
export function HomepageSectionsManager({
  initialRows,
  role,
  notice,
}: {
  initialRows: HomepageSectionRow[];
  role: string;
  notice?: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<HomepageSectionRow[]>(() => [...initialRows].sort(byOrder));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(notice ?? "");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [choice, setChoice] = useState("");
  const canDelete = role === "SUPER_ADMIN" || role === "ADMIN";

  const live = rows.filter((row) => row.enabled && isHomepageBandKey(row.sectionKey)).length;
  const unusedRows = useMemo(() => rows.filter((row) => !isHomepageBandKey(row.sectionKey)), [rows]);
  const usedKeys = useMemo(
    () => new Set(rows.filter((row) => isHomepageBandKey(row.sectionKey)).map((row) => row.sectionKey)),
    [rows],
  );
  const missing = HOMEPAGE_BAND_KEYS.filter((key) => !usedKeys.has(key));

  async function put(row: HomepageSectionRow) {
    const response = await fetch(`${ENDPOINT}/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    return { ok: response.ok, body: await response.json().catch(() => ({})) };
  }

  /**
   * Commits a new order, renumbering from the list position.
   *
   * `displayOrder` on this table is whatever the seed and the editors left behind
   * — a mix of 0, 1, 3, 4, 5, 8, 9 and 14. Swapping two neighbouring values would
   * therefore often swap two identical numbers and move nothing. Writing
   * `displayOrder` for every row removes the precondition, and only the rows that
   * actually changed are sent so an unrelated `updatedAt` is not churned.
   */
  async function commitOrder(ordered: HomepageSectionRow[], previous: HomepageSectionRow[]) {
    setError("");
    const before = new Map(previous.map((row) => [row.id, row]));
    const numbered = ordered.map((row, position) => ({ ...row, displayOrder: position }));
    setRows(numbered);
    const changed = numbered.filter((row) => before.get(row.id)?.displayOrder !== row.displayOrder);
    if (!changed.length) return;
    const results = await Promise.all(changed.map((row) => put(row)));
    const failed = results.find((result) => !result.ok);
    if (failed) {
      setError(failed.body?.error || "The new order was rejected.");
      setRows(previous);
      return;
    }
    setMessage("Order saved. The homepage sections are now in this sequence.");
    router.refresh();
  }

  function move(row: HomepageSectionRow, delta: -1 | 1) {
    const ordered = [...rows].sort(byOrder);
    const index = ordered.findIndex((item) => item.id === row.id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    void commitOrder(next, ordered);
  }

  function dropOn(target: HomepageSectionRow) {
    const ordered = [...rows].sort(byOrder);
    const from = ordered.findIndex((row) => row.id === draggingId);
    const to = ordered.findIndex((row) => row.id === target.id);
    setDraggingId(null);
    if (draggingId === null || from < 0 || to < 0 || from === to) return;
    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void commitOrder(next, ordered);
  }

  async function toggle(row: HomepageSectionRow) {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await put({ ...row, enabled: !row.enabled });
      if (!result.ok) {
        setError(result.body?.error || "Unable to change this section's visibility.");
        return;
      }
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, enabled: !row.enabled } : item)));
      setMessage(
        row.enabled
          ? `“${row.title || row.sectionKey}” is now hidden from the homepage.`
          : `“${row.title || row.sectionKey}” is now live on the homepage.`,
      );
      router.refresh();
    } catch {
      setError("Network error while changing visibility. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    setError("");
    setMessage("");
    const key = choice as HomepageBandKey;
    if (!isHomepageBandKey(key)) {
      setError("Choose which section to add.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // No `content`: the band's fields default on the server, and a section is
        // created switched off so adding one never changes the live page.
        body: JSON.stringify({
          sectionKey: key,
          enabled: false,
          displayOrder: rows.length,
        }),
      });
      const created = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(created.error || "Unable to add this section.");
        return;
      }
      setRows((current) => [...current, created as HomepageSectionRow].sort(byOrder));
      setChoice("");
      setShowAdd(false);
      setMessage(`“${HOMEPAGE_BAND_LABELS[key]}” has been added, switched off. Edit it, then switch it on to put it on the page.`);
      router.refresh();
    } catch {
      setError("Network error while adding. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Deletes a row the public homepage does not use.
   *
   * The guard is on the server as well as here — `deleteEntity` refuses any key
   * the homepage renders — because the button being hidden is a convenience, not
   * a control. A crafted request must not be able to take a live band off the site.
   */
  async function remove(row: HomepageSectionRow) {
    setError("");
    setMessage("");
    if (
      !confirm(
        `Delete “${row.title || row.sectionKey}”? It is not used anywhere on the public homepage, so nothing on the live site will change. This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${ENDPOINT}/${row.id}`, { method: "DELETE" });
      const reason = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(reason.error || "Unable to delete this section.");
        return;
      }
      setRows((current) => current.filter((item) => item.id !== row.id));
      setMessage(`“${row.title || row.sectionKey}” has been deleted.`);
      router.refresh();
    } catch {
      setError("Network error while deleting. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function publishAll() {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "homepage" }),
      });
      const reason = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(reason.error || "Publishing failed.");
        return;
      }
      setMessage("Homepage republished from the database. The live page matches these sections.");
      router.refresh();
    } catch {
      setError("Network error while publishing. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[.65rem] font-bold uppercase tracking-widest text-red-600">Homepage</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">Homepage Sections</h1>
          <p className="mt-1 text-xs font-semibold text-zinc-600">
            {live} of {HOMEPAGE_BAND_KEYS.length} bands live · {unusedRows.length} unused{" "}
            {unusedRows.length === 1 ? "row" : "rows"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={publishAll}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          >
            <Rocket size={15} /> {busy ? "Working…" : "Republish"}
          </button>
          <button
            onClick={() => setShowAdd((value) => !value)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800"
          >
            <Plus size={15} /> {showAdd ? "Close" : "Add section"}
          </button>
        </div>
      </div>

      <p className="mt-3 max-w-3xl text-xs leading-5 text-zinc-600">
        Every band of the homepage is a section here, in the order the page renders them. Drag a row
        or use the arrows to move it, switch one off to take it off the page without losing its
        content, and open one to edit its copy and images.
      </p>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-800">
          <CheckCircle2 size={14} /> {message}
        </p>
      ) : null}

      {showAdd ? (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-900">Add a homepage section</p>
          <p className="mt-1 text-xs text-zinc-600">
            Only sections that are not on the page yet are listed. The new section starts switched
            off, so adding one never changes the live homepage by surprise.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1.6fr_auto]">
            <div>
              <label htmlFor="homepage-add-choice" className="mb-1 block text-[.65rem] font-bold text-zinc-600">
                SECTION
              </label>
              <select
                id="homepage-add-choice"
                className="admin-field"
                value={choice}
                onChange={(event) => setChoice(event.target.value)}
              >
                <option value="">Choose a section…</option>
                {missing.map((key) => (
                  <option key={key} value={key}>
                    {HOMEPAGE_BAND_LABELS[key]} — {HOMEPAGE_BAND_BLURBS[key]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={add}
                disabled={busy || !choice}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Plus size={15} /> {busy ? "Adding…" : "Add section"}
              </button>
            </div>
          </div>
          {missing.length === 0 ? (
            <p className="mt-3 text-xs font-semibold text-green-700">Every homepage band is already present.</p>
          ) : null}
        </div>
      ) : null}

      {missing.length > 0 && !showAdd ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
          <Info size={14} className="mt-px shrink-0" />
          <span>
            {missing.length} band{missing.length === 1 ? " is" : "s are"} missing from the homepage:{" "}
            {missing.map((key) => HOMEPAGE_BAND_LABELS[key]).join(", ")}. Use &ldquo;Add
            section&rdquo; to put {missing.length === 1 ? "it" : "them"} back.
          </span>
        </p>
      ) : null}

      <ul className="mt-6 grid gap-3">
        {[...rows].sort(byOrder).map((row, index) => {
          const used = isHomepageBandKey(row.sectionKey);
          const key = row.sectionKey as HomepageBandKey;
          const images = imageCount(row.content);
          const lists = listSummary(row.content);
          return (
            <li
              key={row.id}
              draggable={!busy}
              onDragStart={() => setDraggingId(row.id)}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropOn(row)}
              className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow ${
                used && row.enabled
                  ? "border-zinc-200"
                  : used
                    ? "border-dashed border-zinc-300 opacity-75"
                    : "border-dashed border-amber-300 bg-amber-50/40"
              } ${draggingId === row.id ? "ring-2 ring-red-500" : ""}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3 sm:w-14 sm:shrink-0 sm:flex-col sm:items-center">
                  <span
                    className="inline-flex cursor-grab items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1.5 text-[.6rem] font-bold text-zinc-500 active:cursor-grabbing"
                    title="Drag to reorder"
                  >
                    <GripVertical size={13} /> {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="min-w-0 grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-zinc-900">
                      {row.title || (used ? HOMEPAGE_BAND_LABELS[key] : row.sectionKey)}
                    </h2>
                    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[.62rem] text-zinc-600">
                      {row.sectionKey}
                    </code>
                    {used ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[.6rem] font-bold ${
                          row.enabled ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {row.enabled ? <Eye size={11} /> : <EyeOff size={11} />}
                        {row.enabled ? "Live" : "Hidden"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[.6rem] font-bold text-amber-800">
                        <EyeOff size={11} /> Not on the homepage
                      </span>
                    )}
                  </div>

                  {used ? (
                    <p className="mt-1.5 text-[.7rem] italic leading-5 text-zinc-500">{HOMEPAGE_BAND_BLURBS[key]}</p>
                  ) : null}

                  {row.subtitle ? (
                    <p className="mt-1.5 line-clamp-2 text-[.7rem] leading-5 text-zinc-600">{row.subtitle}</p>
                  ) : (
                    <p className="mt-1.5 text-[.7rem] italic leading-5 text-zinc-400">No description set.</p>
                  )}

                  {lists || images ? (
                    <p className="mt-2 text-[.65rem] font-semibold text-zinc-500">
                      {[lists, images ? `${images} image${images === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-1">
                  <button
                    title="Move up"
                    aria-label={`Move ${row.title || row.sectionKey} up`}
                    onClick={() => move(row, -1)}
                    disabled={busy || index === 0}
                    className="grid h-9 w-9 place-items-center rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    title="Move down"
                    aria-label={`Move ${row.title || row.sectionKey} down`}
                    onClick={() => move(row, 1)}
                    disabled={busy || index === rows.length - 1}
                    className="grid h-9 w-9 place-items-center rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
                  >
                    <ArrowDown size={15} />
                  </button>
                  {used ? (
                    <button
                      title={row.enabled ? "Hide from the homepage" : "Show on the homepage"}
                      aria-label={`${row.enabled ? "Hide" : "Show"} ${row.title || row.sectionKey} on the homepage`}
                      onClick={() => toggle(row)}
                      disabled={busy}
                      className={`grid h-9 w-9 place-items-center rounded disabled:opacity-50 ${
                        row.enabled ? "text-zinc-600 hover:bg-zinc-100" : "text-amber-600 hover:bg-amber-50"
                      }`}
                    >
                      {row.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  ) : null}
                  <Link
                    title="Edit this section"
                    href={`/admin/homepage/${row.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded px-2 py-2 text-[.65rem] font-bold text-zinc-700 hover:bg-zinc-100"
                  >
                    <Edit3 size={15} /> Edit
                  </Link>
                  {/* Only for a row the homepage does not use. Every other row is a
                      fixed band of the front page and cannot be deleted at all. */}
                  {!used && canDelete ? (
                    <button
                      title="Delete this unused section"
                      aria-label={`Delete ${row.title || row.sectionKey}`}
                      onClick={() => remove(row)}
                      disabled={busy}
                      className="grid h-9 w-9 place-items-center rounded text-zinc-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : null}
                </div>
              </div>

              {!used ? (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-[.65rem] leading-5 text-amber-900">
                  <Info size={13} className="mt-0.5 shrink-0" />
                  <span>
                    The homepage has no band for the key <code className="font-mono">{row.sectionKey}</code>, so this
                    row&rsquo;s copy is not rendered anywhere on the site. It is usually the residue of a rename. It can be
                    deleted safely; nothing on the live page will change.
                  </span>
                </p>
              ) : null}
            </li>
          );
        })}

        {rows.length === 0 ? (
          <li className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center text-sm text-zinc-600">
            There are no homepage sections at all. Use &ldquo;Add section&rdquo; to build the page back up.
          </li>
        ) : null}
      </ul>

      {unusedRows.length > 0 ? (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-[.65rem] leading-5 text-amber-900">
          <strong>{unusedRows.length}</strong> row{unusedRows.length === 1 ? "" : "s"} here{" "}
          {unusedRows.length === 1 ? "is" : "are"} not used by the public homepage and can be deleted. Every band that
          <em> is</em> part of the page is permanent: switching one off is how you take it down, and its content stays put.
        </p>
      ) : null}

      <p className="mt-4 text-[.65rem] leading-5 text-zinc-500">
        Two supporting collections feed the homepage:{" "}
        <Link href="/admin/home-slider" className="font-semibold text-zinc-700 underline">
          Home Slider
        </Link>{" "}
        supplies the hero slides and{" "}
        <Link href="/admin/home-offer-cards" className="font-semibold text-zinc-700 underline">
          Home Products
        </Link>{" "}
        supplies the &ldquo;What We Offer&rdquo; grid.
      </p>
    </section>
  );
}