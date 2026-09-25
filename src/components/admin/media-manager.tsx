"use client";
import { useRef, useState } from "react";
import { CheckCircle2, Clipboard, CloudUpload, Trash2 } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";

type Item = {
  id: number;
  filename: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  altText: string;
  folder: string;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  createdAt: string | Date;
};

const FOLDERS = ["products", "services", "projects", "clients", "client-logos", "gallery", "homepage", "home-sliders", "pages", "blog", "testimonials", "industries", "branding"];
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024;

export function MediaManager({ initialItems, role, cloudinaryReady = true }: { initialItems: Item[]; role: string; cloudinaryReady?: boolean }) {
  const [items, setItems] = useState(initialItems);
  const [folder, setFolder] = useState("products");
  const [alt, setAlt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");
  const input = useRef<HTMLInputElement>(null);

  function chooseFile(file?: File) {
    setError("");
    setMessage("");
    if (!file) {
      setPreview("");
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Use a JPG, PNG, WebP or AVIF image.");
      setPreview("");
      if (input.current) input.current.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 10MB.");
      setPreview("");
      if (input.current) input.current.value = "";
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  async function upload(file?: File) {
    setError("");
    setMessage("");
    if (!file) {
      setError("Choose an image to upload.");
      return;
    }
    if (!alt.trim()) {
      setError("Provide alternative text for the image.");
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      data.set("file", file);
      data.set("folder", folder);
      data.set("altText", alt);
      const response = await fetch("/api/admin/upload", { method: "POST", body: data });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || "Upload failed.");
        return;
      }
      setItems((value) => [body, ...value]);
      setAlt("");
      setPreview("");
      setMessage(`Uploaded ${body.filename} to rack-stack/${folder}.`);
      if (input.current) input.current.value = "";
    } catch {
      setError("Network error while uploading.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(item: Item) {
    if (!confirm(`Delete media "${item.filename}" from Cloudinary and the library? This cannot be undone.`)) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Unable to delete media.");
        return;
      }
      setItems((value) => value.filter((x) => x.id !== item.id));
      setMessage(`Removed ${item.filename}.`);
    } catch {
      setError("Network error while deleting.");
    }
  }

  return (
    <section>
      <div>
        <p className="text-[.65rem] font-bold uppercase tracking-widest text-red-600">Cloudinary</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">Media Library</h1>
        <p className="mt-1 text-xs text-zinc-600">Upload, preview, organize and reuse optimized website images.</p>
      </div>

      {!cloudinaryReady ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          Cloudinary credentials are not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to enable uploads.
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-[1fr_1fr_1.2fr_auto]">
        <div>
          <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">FOLDER</label>
          <select className="admin-field" value={folder} onChange={(e) => setFolder(e.target.value)}>
            {FOLDERS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">ALT TEXT</label>
          <input className="admin-field" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" />
        </div>
        <div>
          <label className="mb-1 block text-[.65rem] font-bold text-zinc-600">IMAGE</label>
          <input
            ref={input}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="admin-field py-1.5 text-xs"
            onChange={(e) => chooseFile(e.target.files?.[0])}
          />
        </div>
        <button
          disabled={loading || !cloudinaryReady}
          onClick={() => upload(input.current?.files?.[0])}
          className="mt-auto flex h-[42px] items-center gap-2 rounded-lg bg-zinc-950 px-4 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          <CloudUpload size={15} />
          {loading ? "Uploading…" : "Upload"}
        </button>
      </div>

      {preview ? (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3">
          <span className="relative block h-14 w-14 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={preview} alt="Selected upload preview" className="h-full w-full object-contain p-1" />

          </span>
          <p className="text-xs font-semibold text-zinc-700">Ready to upload: {folder}</p>
        </div>
      ) : null}

      {error ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p> : null}
      {message ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-800">
          <CheckCircle2 size={14} /> {message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white" key={item.id}>
            <div className="relative h-44 bg-zinc-100">
               <SmartImage src={item.imageUrl} alt={item.altText} fill className="object-contain p-3" sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 300px" />

            </div>
            <div className="p-4">
              <p className="truncate text-xs font-bold text-zinc-900">{item.filename}</p>
              <p className="mt-1 text-[.65rem] text-zinc-500">
                {item.width}×{item.height} · {item.fileSize ? `${Math.round(item.fileSize / 1024)} KB` : "size unknown"}
              </p>
              <p className="mt-2 line-clamp-2 text-[.68rem] text-zinc-600">{item.altText}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.imageUrl);
                    setMessage("Image URL copied to clipboard.");
                  }}
                  className="flex grow items-center justify-center gap-1 rounded bg-zinc-100 py-2 text-[.65rem] font-bold text-zinc-800 hover:bg-zinc-200"
                >
                  <Clipboard size={12} /> Copy URL
                </button>
                {role !== "EDITOR" ? (
                  <button onClick={() => remove(item)} aria-label={`Delete ${item.filename}`} className="grid w-9 place-items-center rounded bg-red-50 text-red-600 hover:bg-red-100">
                    <Trash2 size={13} />
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-600">No Cloudinary media has been uploaded yet.</div>
      ) : null}
    </section>
  );
}
