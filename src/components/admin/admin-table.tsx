"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowDownUp, ArrowUp, Copy, Edit3, Eye, EyeOff, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SmartImage } from "@/components/site/smart-image";

const labels: Record<string, string> = {
  homepage: "Homepage sections",
  "home-offer-cards": "Homepage offer cards",
  blog: "Blog posts",
  "contact-messages": "Contact messages",
  seo: "SEO settings",
  settings: "Site settings",
  activity: "Activity logs",
  media: "Media library",
  videos: "Reels",
};
const noCreate = new Set(["inquiries", "contact-messages", "activity", "media", "seo", "settings"]);
const noEdit = new Set(["activity", "media"]);
const noDelete = new Set(["inquiries", "contact-messages", "activity", "seo", "settings", "users"]);

/**
 * Collections whose order is editorial, and the field that holds it.
 *
 * Keyed by entity rather than hardcoded per table so a collection only has to
 * declare its ordering field once: the row sort, the move buttons and the save
 * payload all read the same key, and a field rename cannot desynchronise them.
 */
const orderFields: Record<string, string> = {
  "home-slider": "sortOrder",
  "home-offer-cards": "displayOrder",
  testimonials: "displayOrder",
};

/**
 * Collections that carry a publish switch in the list.
 *
 * Only offered where publishing is a status change rather than a flag, and
 * scoped to the entities that are actually ordered for public display, because
 * a "Publish" button that does nothing visible is worse than no button. Each
 * one writes through the same `PUT` route as the editor, so a status flipped
 * here goes through identical validation and triggers the same publish.
 */
const publishable = new Set(["testimonials"]);

function display(row: Record<string, unknown>) {
  return String(row.name || row.title || row.clientName || row.question || row.email || row.action || row.sectionKey || `Record #${row.id}`);
}
function secondary(entity: string, row: Record<string, unknown>) {
  // Keyed on the entity, not on a field: a hero slider with a background video
  // also carries `videoUrl`, and it must not be summarised as a Reel.
  if (entity === "videos") {
    const placements = [row.showOnHome && "Home", row.showOnProducts && "Products", row.showOnServices && "Services"].filter(Boolean);
    return [row.isActive === false ? "Hidden" : "Live", ...placements].filter(Boolean).join(" · ");
  }
  return String(row.category || row.industry || row.company || row.entityType || row.entity || row.email || row.requirement || row.subject || "");
}
function thumbnail(row: Record<string, unknown>) {
  const candidate = row.thumbnail || row.heroImage || row.imageUrl || row.logo || row.coverImage || row.featuredImage || row.image || row.ogImage || row.posterUrl;
  return typeof candidate === "string" && candidate.trim() ? candidate : undefined;
}

export function AdminTable({ entity, initialRows, role, notice: initialNotice }: { entity: string; initialRows: Record<string, unknown>[]; role: string; notice?: string }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [featured, setFeatured] = useState("ALL");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState(initialNotice ?? "");
  const [confirming, setConfirming] = useState<{ ids: number[]; label: string } | null>(null);
  const [pending, setPending] = useState(false);
  const pageSize = 10;

  const filtered = useMemo(
    () =>
      rows
        .filter(
          (row) =>
            display(row).toLowerCase().includes(query.toLowerCase()) &&
            (status === "ALL" || row.status === status) &&
            (featured === "ALL" || String(Boolean(row.featured)) === featured),
        )
        .sort((a, b) => {
          const orderField = orderFields[entity];
          if (orderField) return (Number(a[orderField] ?? 0) - Number(b[orderField] ?? 0)) * (sortAsc ? 1 : -1);
          return (sortAsc ? 1 : -1) * display(a).localeCompare(display(b));
        }),
    [rows, query, status, featured, sortAsc, entity],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  /**
   * Stage a delete, then ask.
   *
   * This was a bare `window.confirm`, which blocks the main thread, cannot be
   * styled to match the rest of the admin, and — on a narrow screen — truncates
   * the record names so the editor confirms a delete of something they cannot
   * read. The names matter more than the yes/no here: a row in a list of
   * near-identical records is exactly the one you delete by mistake, so they
   * are shown in full before the destructive button is pressed.
   */
  function askRemove(ids: number[]) {
    if (!ids.length) return;
    const names = rows
      .filter((row) => ids.includes(Number(row.id)))
      .map(display)
      .slice(0, 4);
    const label = names.length === 1 ? names[0] : `${names.join(", ")}${ids.length > names.length ? ` and ${ids.length - names.length} more` : ""}`;
    setMessage("");
    setNotice("");
    setConfirming({ ids, label });
  }

  async function remove(ids: number[]) {
    setMessage("");
    setNotice("");
    setPending(true);
    try {
      const results = await Promise.all(ids.map((id) => fetch(`/api/admin/${entity}/${id}`, { method: "DELETE" })));
      const failed = results.find((response) => !response.ok);
      if (failed) {
        const reason = await failed.json().catch(() => ({}));
        setMessage(reason.error || "One or more records could not be deleted. Check your permissions.");
        return;
      }
      setRows((value) => value.filter((row) => !ids.includes(Number(row.id))));
      setSelected([]);
      setNotice(`${ids.length} record${ids.length === 1 ? "" : "s"} deleted.`);
      router.refresh();
    } catch {
      setMessage("Network error while deleting. Please try again.");
    } finally {
      setPending(false);
      setConfirming(null);
    }
  }

  async function duplicate(id: number) {
    setMessage("");
    setPending(true);
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicateId: id }),
      });
      if (!response.ok) {
        setMessage("Unable to duplicate this product.");
        return;
      }
      router.refresh();
      location.reload();
    } catch {
      setMessage("Network error while duplicating. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const orderField = orderFields[entity];

  /**
   * Move a row one place, then renumber the whole collection.
   *
   * This used to exchange the two neighbouring values. That is only correct when
   * every row already holds a distinct, gapless number — and a testimonial list
   * never does: `displayOrder` defaults to 0, so a section built by adding rows
   * is a run of identical values. Swapping two zeros produced `0, 0` again, the
   * move did nothing, and — because the optimistic state and the two `PUT`
   * payloads were computed in opposite directions — the row on screen ended up
   * showing the one value the database was not given. The list then disagreed
   * with the published site until a manual reload.
   *
   * Renumbering from the new position removes the precondition entirely: the
   * order is the list order, and each row is written with its own index. Only
   * rows whose value actually changed are sent, so a move in a fully
   * renumbered collection costs one request instead of all of them.
   */
  async function move(id: number, direction: -1 | 1) {
    if (!orderField) return;
    const idx = rows.findIndex((row) => Number(row.id) === id);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= rows.length) return;
    const reordered = [...rows];
    [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
    const numbered = reordered.map((row, position) => ({ ...row, [orderField]: position }));
    const changed = numbered.filter((row) => Number(row[orderField] ?? 0) !== Number(rows.find((before) => before.id === row.id)?.[orderField] ?? 0));
    if (!changed.length) return;
    setMessage("");
    setNotice("");
    setPending(true);
    try {
      for (const row of changed) {
        const response = await fetch(`/api/admin/${entity}/${row.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });
        if (!response.ok) {
          const reason = await response.json().catch(() => ({}));
          setMessage(`Unable to reorder: ${reason.error || "the server rejected the new order"}. No rows were moved.`);
          return;
        }
      }
      setRows(numbered);
      setNotice("Order saved. It is live on the site once the page is republished.");
      router.refresh();
    } catch {
      setMessage("Network error while reordering. Please try again.");
    } finally {
      setPending(false);
    }
  }

  /**
   * Publish or unpublish a record without opening the editor.
   *
   * The same contract as `toggleActive`: the row is only updated once the API
   * has accepted the write, so a rejected save can never leave the list
   * claiming a state the site is not in.
   */
  async function toggleStatus(row: Record<string, unknown>) {
    const next = row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setMessage("");
    setNotice("");
    setPending(true);
    try {
      const response = await fetch(`/api/admin/${entity}/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, status: next }),
      });
      if (!response.ok) {
        const reason = await response.json().catch(() => ({}));
        setMessage(`Unable to ${next === "PUBLISHED" ? "publish" : "unpublish"}: ${reason.error || "please try again."}`);
        return;
      }
      setRows((value) => value.map((item) => (item.id === row.id ? { ...item, status: next } : item)));
      setNotice(`“${display(row)}” is now ${next === "PUBLISHED" ? "published" : "a draft"} and no longer shown on the site.`);
      router.refresh();
    } catch {
      setMessage("Network error while changing publish state. Please try again.");
    } finally {
      setPending(false);
    }
  }

  /**
   * Shows or hides a record without opening the editor.
   *
   * Only offered where the collection actually has a visibility flag. Hiding is
   * a save, not a local toggle, so the row is only updated once the API has
   * accepted it — otherwise a failed write would leave the screen claiming a
   * state the site is not in.
   */
  async function toggleActive(row: Record<string, unknown>) {
    setMessage("");
    setPending(true);
    try {
      const response = await fetch(`/api/admin/${entity}/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, isActive: !row.isActive }),
      });
      if (!response.ok) {
        setMessage("Unable to change visibility. Please try again.");
        return;
      }
      setRows((value) => value.map((item) => (item.id === row.id ? { ...item, isActive: !item.isActive } : item)));
      router.refresh();
    } catch {
      setMessage("Network error while changing visibility. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[.65rem] font-bold uppercase tracking-widest text-red-600">Content management</p>
          <h1 className="mt-2 text-2xl font-bold capitalize tracking-tight text-zinc-900">{labels[entity] || entity}</h1>
          <p className="mt-1 text-xs font-semibold text-zinc-600">{rows.length} total records</p>
        </div>
        {!noCreate.has(entity) ? (
          <Link
            href={`/admin/${entity}/new`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800"
          >
            <Plus size={15} /> Add new
          </Link>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-zinc-200 p-4">
          <div className="relative min-w-[220px] grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="admin-field pl-9"
              placeholder="Search records…"
              aria-label="Search records"
            />
          </div>
          {rows.some((row) => row.status) ? (
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="admin-field w-auto"
              aria-label="Filter by status"
            >
              <option value="ALL">All statuses</option>
              {["DRAFT", "PUBLISHED", "ARCHIVED", "NEW", "CONTACTED", "QUALIFIED", "QUOTATION_SENT", "WON", "LOST", "SPAM", "READ", "REPLIED"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          ) : null}
          {rows.some((row) => "featured" in row) ? (
            <select
              value={featured}
              onChange={(e) => {
                setFeatured(e.target.value);
                setPage(1);
              }}
              className="admin-field w-auto"
              aria-label="Filter featured"
            >
              <option value="ALL">All records</option>
              <option value="true">Featured</option>
              <option value="false">Not featured</option>
            </select>
          ) : null}
          {selected.length > 0 && !noDelete.has(entity) && role !== "EDITOR" ? (
            <button
              onClick={() => askRemove(selected)}
              disabled={pending}
              className="rounded-lg bg-red-50 px-4 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              Delete selected ({selected.length})
            </button>
          ) : null}
        </div>

        {message ? (
          <p role="alert" className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {message}
          </p>
        ) : null}
        {!message && notice ? (
          <p role="status" className="border-b border-green-100 bg-green-50 px-4 py-3 text-xs font-semibold text-green-700">
            {notice}
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-zinc-50 text-[.62rem] font-bold uppercase tracking-wider text-zinc-600">
              <tr>
                <th className="w-12 p-4">
                  <input
                    type="checkbox"
                    aria-label="Select page"
                    checked={visible.length > 0 && visible.every((row) => selected.includes(Number(row.id)))}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? Array.from(new Set([...selected, ...visible.map((row) => Number(row.id))]))
                          : selected.filter((id) => !visible.some((row) => Number(row.id) === id)),
                      )
                    }
                  />
                </th>
                <th className="p-4">
                  <button className="flex items-center gap-2 hover:text-zinc-900" onClick={() => setSortAsc(!sortAsc)}>
                    Record <ArrowDownUp size={12} />
                  </button>
                </th>
                <th className="p-4">Context</th>
                <th className="p-4">Status</th>
                <th className="p-4">Updated / created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visible.map((row) => {
                const image = thumbnail(row);
                const idx = rows.findIndex((item) => item.id === row.id);
                return (
                  <tr className="hover:bg-zinc-50" key={String(row.id)}>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        aria-label={`Select ${display(row)}`}
                        checked={selected.includes(Number(row.id))}
                        onChange={(e) =>
                          setSelected(e.target.checked ? [...selected, Number(row.id)] : selected.filter((x) => x !== Number(row.id)))
                        }
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {image ? (
                          <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                             <SmartImage src={image} alt="" fill className="object-contain p-1" sizes="40px" />

                          </span>
                        ) : null}
                        <div className="min-w-0">
                          <p className="max-w-xs truncate text-sm font-semibold text-zinc-900">{display(row)}</p>
                          <p className="mt-0.5 text-[.67rem] text-zinc-500">ID {String(row.id)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[240px] truncate p-4 text-xs text-zinc-600">{secondary(entity, row) || "—"}</td>
                    <td className="p-4">
                      {row.status ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[.62rem] font-bold ${
                            row.status === "PUBLISHED" || row.status === "WON"
                              ? "bg-green-50 text-green-700"
                              : row.status === "DRAFT" || row.status === "NEW"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {String(row.status)}
                        </span>
                      ) : row.isActive !== undefined ? (
                        <span className={`rounded-full px-2.5 py-1 text-[.62rem] font-bold ${row.isActive ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-600"}`}>
                          {row.isActive ? "Active" : "Disabled"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-4 text-xs text-zinc-600">
                      {row.updatedAt || row.createdAt ? new Date(String(row.updatedAt || row.createdAt)).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        {orderField ? (
                          <span className="mr-1 flex items-center">
                            <button
                              title="Move up"
                              onClick={() => move(Number(row.id), -1)}
                              disabled={pending || idx === 0}
                              className="grid h-8 w-8 place-items-center rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              title="Move down"
                              onClick={() => move(Number(row.id), 1)}
                              disabled={pending || idx === rows.length - 1}
                              className="grid h-8 w-8 place-items-center rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </span>
                        ) : null}
                        {orderField && row.isActive !== undefined ? (
                          <button
                            title={row.isActive ? "Hide from the site" : "Show on the site"}
                            aria-label={row.isActive ? `Hide ${display(row)}` : `Show ${display(row)}`}
                            onClick={() => toggleActive(row)}
                            disabled={pending}
                            className={`grid h-8 w-8 place-items-center rounded disabled:opacity-50 ${row.isActive ? "text-zinc-600 hover:bg-zinc-100" : "text-amber-600 hover:bg-amber-50"}`}
                          >
                            {row.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                        ) : null}
                        {publishable.has(entity) && row.status ? (
                          <button
                            title={row.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                            aria-label={`${row.status === "PUBLISHED" ? "Unpublish" : "Publish"} ${display(row)}`}
                            onClick={() => toggleStatus(row)}
                            disabled={pending}
                            className={`inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-[.62rem] font-bold disabled:opacity-50 ${
                              row.status === "PUBLISHED" ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200" : "bg-red-50 text-red-700 hover:bg-red-100"
                            }`}
                          >
                            {row.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                          </button>
                        ) : null}
                        {entity === "products" ? (
                          <button
                            title="Duplicate"
                            onClick={() => duplicate(Number(row.id))}
                            disabled={pending}
                            className="grid h-8 w-8 place-items-center rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                          >
                            <Copy size={14} />
                          </button>
                        ) : null}
                        {!noEdit.has(entity) ? (
                          <Link
                            title="Edit"
                            href={`/admin/${entity}/${row.id}/edit`}
                            className="grid h-8 w-8 place-items-center rounded text-zinc-600 hover:bg-zinc-100"
                          >
                            <Edit3 size={14} />
                          </Link>
                        ) : null}
                        {!noDelete.has(entity) && role !== "EDITOR" ? (
                          <button
                            title="Delete"
                            aria-label={`Delete ${display(row)}`}
                            onClick={() => askRemove([Number(row.id)])}
                            disabled={pending}
                            className="grid h-8 w-8 place-items-center rounded text-zinc-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 ? <div className="p-12 text-center text-sm text-zinc-600">No records match the current filters.</div> : null}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 p-4 text-xs font-semibold text-zinc-600">
          <span>
            Page {currentPage} of {pages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="rounded border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= pages}
              onClick={() => setPage(currentPage + 1)}
              className="rounded border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {confirming ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          onClick={(event) => {
            // Clicking the backdrop cancels, but a click that started inside the
            // panel must not dismiss it — otherwise the drag that ends over the
            // backdrop deletes nothing and the dialog vanishes anyway.
            if (event.target === event.currentTarget && !pending) setConfirming(null);
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 id="confirm-delete-title" className="text-lg font-bold tracking-tight text-zinc-900">
              Delete {confirming.ids.length === 1 ? "this record" : `${confirming.ids.length} records`}?
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              You are about to delete <span className="font-semibold text-zinc-900">{confirming.label}</span>. This removes it
              permanently and takes it off the published site.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={pending}
                className="rounded-lg border border-zinc-300 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => remove(confirming.ids)}
                disabled={pending}
                className="rounded-lg bg-red-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {pending ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
