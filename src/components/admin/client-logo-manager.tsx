"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CheckCircle2, CloudUpload, Edit3, ExternalLink, Plus, Power, Trash2 } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";

type LogoItem = {
  id: number;
  name: string;
  imageUrl: string;
  imagePublicId: string | null;
  altText: string;
  sortOrder: number;
  isActive: boolean;
  width: number | null;
  height: number | null;
};

const byOrder = (a: LogoItem, b: LogoItem) => a.sortOrder - b.sortOrder || a.id - b.id;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024;

export function ClientLogoManager({ initialItems, role }: { initialItems: LogoItem[]; role: string }) {
  const router = useRouter();
  const [items, setItems] = useState<LogoItem[]>(() => [...initialItems].sort(byOrder));
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const canDelete = role === "SUPER_ADMIN" || role === "ADMIN";
  const activeCount = useMemo(() => items.filter((item) => item.isActive).length, [items]);

  function resetAdd() {
    setName("");
    setAlt("");
    setFile(null);
    setPreview("");
    if (input.current) input.current.value = "";
  }

  function chooseFile(selected?: File) {
    setError("");
    setMessage("");
    if (!selected) {
      setFile(null);
      setPreview("");
      return;
    }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("Use a JPG, PNG, WebP or AVIF image.");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError("Logo must be under 10MB.");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function add() {
    setError("");
    setMessage("");
    if (!file) {
      setError("Choose a logo image to upload.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Enter the client name (at least 2 characters).");
      return;
    }
    if (alt.trim().length < 2) {
      setError("Enter alternative text for the logo.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("folder", "client-logos");
      form.set("altText", alt.trim());
      const upload = await fetch("/api/admin/upload", { method: "POST", body: form });
      const uploaded = await upload.json().catch(() => ({}));
      if (!upload.ok) {
        setError(uploaded.error || "Upload failed.");
        return;
      }
      const nextOrder = items.length ? Math.max(...items.map((item) => item.sortOrder)) + 1 : 1;
      const response = await fetch("/api/admin/client-logos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          imageUrl: uploaded.imageUrl,
          imagePublicId: uploaded.cloudinaryPublicId,
          altText: alt.trim(),
          sortOrder: nextOrder,
          isActive: true,
          width: uploaded.width ?? null,
          height: uploaded.height ?? null,
        }),
      });
      const created = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(created.error || "Unable to save the logo.");
        return;
      }
      setItems((current) => [...current, created].sort(byOrder));
      resetAdd();
      setShowAdd(false);
      setMessage(`Added ${created.name}.`);
      router.refresh();
    } catch {
      setError("Network error while saving. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(item: LogoItem) {
    setError("");
    setMessage("");
    const next = { ...item, isActive: !item.isActive };
    const response = await fetch(`/api/admin/client-logos/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!response.ok) {
      setError("Unable to update this logo.");
      return;
    }
    setItems((current) => current.map((row) => (row.id === item.id ? next : row)));
  }

  async function move(item: LogoItem, delta: number) {
    setError("");
    setMessage("");
    const ordered = [...items].sort(byOrder);
    const index = ordered.findIndex((row) => row.id === item.id);
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    const renumbered = next.map((row, position) => ({ ...row, sortOrder: position + 1 }));
    setItems(renumbered);
    const responses = await Promise.all(
      renumbered.map((row) =>
        fetch(`/api/admin/client-logos/${row.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        }),
      ),
    );
    if (responses.some((response) => !response.ok)) {
      setError("Unable to reorder logos.");
      setItems(ordered);
      return;
    }
    router.refresh();
  }

  async function remove(item: LogoItem) {
    if (!confirm(`Delete the logo for "${item.name}"? The Cloudinary asset will also be removed.`)) return;
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/client-logos/${item.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Unable to delete this logo.");
      return;
    }
    setItems((current) => current.filter((row) => row.id !== item.id));
    setMessage(`Removed ${item.name}.`);
    router.refresh();
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[.65rem] font-bold uppercase tracking-widest text-red-600">Client experience</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">Client Logos</h1>
          <p className="mt-1 text-xs font-semibold text-zinc-600">
            {items.length} logo{items.length === 1 ? "" : "s"} · {activeCount} active in the homepage marquee
          </p>
        </div>
        <button
          onClick={() => setShowAdd((value) => !value)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800"
        >
          <Plus size={15} /> {showAdd ? "Close" : "Add logo"}
        </button>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p> : null}
      {message ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-800">
          <CheckCircle2 size={14} /> {message}
        </p>
      ) : null}

      {showAdd ? (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-900">Upload a client logo</p>
          <p className="mt-1 text-xs text-zinc-600">PNG, JPG, WebP or AVIF up to 10MB. Stored in Cloudinary at rack-stack/client-logos.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">CLIENT NAME</label>
              <input className="admin-field" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Bank of America" />
            </div>
            <div>
              <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">ALT TEXT</label>
              <input className="admin-field" value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Bank of America logo" />
            </div>
            <div>
              <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">LOGO IMAGE</label>
              <input
                ref={input}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={(event) => chooseFile(event.target.files?.[0])}
                className="admin-field py-1.5 text-xs"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={add}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <CloudUpload size={15} /> {busy ? "Saving…" : "Upload & add"}
              </button>
            </div>
          </div>
          {preview ? (
            <div className="mt-4 flex items-center gap-3">
              <span className="relative block h-16 w-32 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selected logo preview" className="h-full w-full object-contain p-2" />
              </span>
              <span className="text-xs font-semibold text-zinc-600">Preview</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white shadow-sm">
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-600">No client logos yet. Add one to populate the homepage marquee.</div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {items.map((item, index) => (
              <li key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                 <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 sm:w-32">

                  {item.imageUrl ? (
                     <SmartImage src={item.imageUrl} alt={item.altText} fill className="object-contain p-2" sizes="(max-width: 639px) 100vw, 128px" />

                  ) : (
                    <span className="grid h-full w-full place-items-center text-[.6rem] font-bold uppercase tracking-widest text-zinc-500">No image</span>
                  )}
                </div>
                <div className="min-w-0 grow">
                  <p className="truncate text-sm font-semibold text-zinc-900">{item.name}</p>
                  <p className="mt-1 truncate text-[.68rem] text-zinc-500">{item.altText}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[.6rem] font-bold ${
                        item.isActive ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      <Power size={11} /> {item.isActive ? "Active" : "Inactive"}
                    </button>
                    <span className="text-[.62rem] text-zinc-500">Order {item.sortOrder}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:justify-end">
                  <button title="Move up" onClick={() => move(item, -1)} disabled={index === 0} className="grid h-9 w-9 place-items-center rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-30">
                    <ArrowUp size={15} />
                  </button>
                  <button title="Move down" onClick={() => move(item, 1)} disabled={index === items.length - 1} className="grid h-9 w-9 place-items-center rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-30">
                    <ArrowDown size={15} />
                  </button>
                  {item.imageUrl ? (
                    <a title="Preview logo" href={item.imageUrl} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded text-zinc-600 hover:bg-zinc-100">
                      <ExternalLink size={15} />
                    </a>
                  ) : null}
                  <Link title="Replace / edit" href={`/admin/client-logos/${item.id}/edit`} className="grid h-9 w-9 place-items-center rounded text-zinc-600 hover:bg-zinc-100">
                    <Edit3 size={15} />
                  </Link>
                  {canDelete ? (
                    <button title="Delete" onClick={() => remove(item)} className="grid h-9 w-9 place-items-center rounded text-zinc-600 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
