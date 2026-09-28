"use client";

import { useRef, useState } from "react";
import { CloudUpload } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";

export type UploadResult = {
  imageUrl: string;
  cloudinaryPublicId?: string | null;
  width?: number | null;
  height?: number | null;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Cloudinary upload control for a single image field.
 *
 * Lives in its own module because two very different editors need it: the
 * generic JSON-aware field renderer in `entity-editor.tsx`, and the structured
 * section editors that model their images explicitly. Keeping the copy here
 * means both get the same type/size checks, preview and clear behaviour.
 */
export function ImageUpload({
  value,
  folder = "cms",
  onUploaded,
  onBusyChange,
}: {
  value?: string;
  folder?: string;
  onUploaded: (result: UploadResult) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setDone(false);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Use a JPG, PNG, WebP or AVIF image.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 10MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setLoading(true);
    onBusyChange?.(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("folder", folder || "cms");
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      onUploaded({ imageUrl: data.imageUrl, cloudinaryPublicId: data.cloudinaryPublicId, width: data.width, height: data.height });
      setDone(true);
    } catch {
      setError("Network error while uploading.");
    } finally {
      setLoading(false);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <span className="relative block h-14 w-14 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            <SmartImage src={value} alt="Selected image preview" fill className="object-contain p-1" sizes="56px" />
          </span>
        ) : null}
        <label
          className={`inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-[.68rem] font-bold text-zinc-800 transition hover:bg-zinc-50 ${
            loading ? "cursor-wait opacity-60" : "cursor-pointer"
          }`}
        >
          <CloudUpload size={13} />
          {loading ? "Uploading…" : value ? "Replace image" : "Upload to Cloudinary"}
          <input ref={inputRef} className="hidden" type="file" accept={ACCEPTED_TYPES.join(",")} disabled={loading} onChange={pick} />
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => {
              onUploaded({ imageUrl: "" });
              setError("");
              setDone(false);
            }}
            className="text-[.68rem] font-bold text-red-600 hover:underline"
          >
            Remove
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-[.68rem] font-semibold text-red-600">{error}</p> : null}
      {done && !error ? <p className="mt-2 text-[.68rem] font-semibold text-green-600">Upload complete.</p> : null}
    </div>
  );
}
