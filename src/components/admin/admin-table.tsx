"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowDownUp, ArrowUp, Copy, Edit3, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SmartImage } from "@/components/site/smart-image";

const labels: Record<string, string> = {
  homepage: "Homepage sections",
  blog: "Blog posts",
  "contact-messages": "Contact messages",
  seo: "SEO settings",
  settings: "Site settings",
  activity: "Activity logs",
  media: "Media library",
};
const noCreate = new Set(["inquiries", "contact-messages", "activity", "media", "seo", "settings"]);
const noEdit = new Set(["activity", "media"]);
const noDelete = new Set(["inquiries", "contact-messages", "activity", "seo", "settings", "users"]);

function display(row: Record<string, unknown>) {
  return String(row.name || row.title || row.clientName || row.question || row.email || row.action || row.sectionKey || `Record #${row.id}`);
}
function secondary(row: Record<string, unknown>) {
  return String(row.category || row.industry || row.company || row.entityType || row.entity || row.email || row.requirement || row.subject || "");
}
function thumbnail(row: Record<string, unknown>) {
  const candidate = row.thumbnail || row.imageUrl || row.logo || row.coverImage || row.featuredImage || row.image || row.ogImage;
  return typeof candidate === "string" && candidate.trim() ? candidate : undefined;
}

export function AdminTable({ entity, initialRows, role }: { entity: string; initialRows: Record<string, unknown>[]; role: string }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [featured, setFeatured] = useState("ALL");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");
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
          if (entity === "home-slider") return (Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)) * (sortAsc ? 1 : -1);
          return (sortAsc ? 1 : -1) * display(a).localeCompare(display(b));
        }),
    [rows, query, status, featured, sortAsc, entity],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function remove(ids: number[]) {
    const names = rows
      .filter((row) => ids.includes(Number(row.id)))
      .map(display)
      .slice(0, 4)
      .join(", ");
    if (!confirm(`Are you sure you want to delete ${ids.length} record(s)?\n\n${names}\n\nImportant business records may be archived rather than permanently destroyed.`)) return;
    setMessage("");
    setPending(true);
    try {
      const results = await Promise.all(ids.map((id) => fetch(`/api/admin/${entity}/${id}`, { method: "DELETE" })));
      if (results.some((response) => !response.ok)) {
        setMessage("One or more records could not be deleted. Check your permissions.");
        return;
      }
      setRows((value) => value.filter((row) => !ids.includes(Number(row.id))));
      setSelected([]);
      router.refresh();
    } catch {
      setMessage("Network error while deleting. Please try again.");
    } finally {
      setPending(false);
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

  async function move(id: number, direction: -1 | 1) {
    const idx = rows.findIndex((row) => Number(row.id) === id);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= rows.length) return;
    const current = rows[idx];
    const other = rows[target];
    const a = Number(current.sortOrder ?? 0);
    const b = Number(other.sortOrder ?? 0);
    const swapA = a !== b ? b : a + direction;
    const swapB = a !== b ? a : b;
    if (swapA < 0 || swapB < 0) return;
    setMessage("");
    setPending(true);
    try {
      const results = await Promise.all([
        fetch(`/api/admin/home-slider/${current.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...current, sortOrder: swapA }),
        }),
        fetch(`/api/admin/home-slider/${other.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...other, sortOrder: swapB }),
        }),
      ]);
      if (results.some((response) => !response.ok)) {
        setMessage("Unable to reorder. Please try again.");
        return;
      }
      setRows((value) => {
        const arr = [...value];
        [arr[idx], arr[target]] = [arr[target], arr[idx]];
        arr[idx] = { ...arr[idx], sortOrder: swapB };
        arr[target] = { ...arr[target], sortOrder: swapA };
        return arr;
      });
      router.refresh();
    } catch {
      setMessage("Network error while reordering. Please try again.");
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
              onClick={() => remove(selected)}
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
                    <td className="max-w-[240px] truncate p-4 text-xs text-zinc-600">{secondary(row) || "—"}</td>
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
                        {entity === "home-slider" ? (
                          <span className="mr-1 flex items-center">
                            <button
                              title="Move up"
                              onClick={() => move(Number(row.id), -1)}
                              disabled={pending || Number(row.id) === Number(rows[0]?.id)}
                              className="grid h-8 w-8 place-items-center rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              title="Move down"
                              onClick={() => move(Number(row.id), 1)}
                              disabled={pending || Number(row.id) === Number(rows[rows.length - 1]?.id)}
                              className="grid h-8 w-8 place-items-center rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </span>
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
                            onClick={() => remove([Number(row.id)])}
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
    </section>
  );
}
