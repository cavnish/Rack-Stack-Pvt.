"use client";
import { useState } from "react";
import { CheckCircle2, Download } from "lucide-react";

export function CatalogDownload({ available, gated }: { available: boolean; gated: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  async function requestDownload(data: Record<string, string>) {
    setState("loading"); setError("");
    try {
      const response = await fetch("/api/catalog-downloads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, sourcePage: location.pathname }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Catalog download is unavailable right now.");
      setState("done");
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Network error. Please try again."); setState("error");
    }
  }
  if (!available) return <div className="border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><strong>Catalog Is Being Updated.</strong><p className="mt-1 text-amber-800">Please contact our team for the latest product information while we prepare the new catalog.</p></div>;
  if (!gated) return <div><button disabled={state==="loading"} onClick={()=>requestDownload({})} className="btn-primary w-full sm:w-auto"><Download size={17}/>{state==="loading"?"Preparing download…":"Download Catalog"}</button>{state==="done"&&<p className="mt-3 flex items-center gap-2 text-sm text-green-700"><CheckCircle2 size={16}/>Your catalog opened in a new tab.</p>}{state==="error"&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</div>;
  return <form onSubmit={(event)=>{event.preventDefault();requestDownload(Object.fromEntries(new FormData(event.currentTarget)) as Record<string,string>)}} className="grid gap-4 sm:grid-cols-2">
    <div><label className="form-label">Name *</label><input name="name" className="form-field" required minLength={2}/></div>
    <div><label className="form-label">Company *</label><input name="company" className="form-field" required minLength={2}/></div>
    <div><label className="form-label">Email *</label><input name="email" type="email" className="form-field" required/></div>
    <div><label className="form-label">Phone *</label><input name="phone" type="tel" className="form-field" required minLength={7}/></div>
    <input name="website" className="hidden" tabIndex={-1} autoComplete="off"/>
    {state==="error"&&<p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
    {state==="done"&&<p className="flex items-center gap-2 text-sm text-green-700 sm:col-span-2"><CheckCircle2 size={16}/>You&apos;re all set. The catalog opened in a new tab.</p>}
    <button disabled={state==="loading"} className="btn-primary sm:col-span-2"><Download size={17}/>{state==="loading"?"Preparing download…":"Get the Catalog"}</button>
    <p className="text-[.68rem] leading-5 text-zinc-500 sm:col-span-2">We only use these details to send the catalog and follow up if needed. See our privacy policy.</p>
  </form>;
}
