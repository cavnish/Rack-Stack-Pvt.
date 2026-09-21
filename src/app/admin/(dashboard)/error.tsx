"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin route error", error);
  }, [error]);

  return (
    <section className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle size={22} />
      </span>
      <h1 className="mt-5 text-xl font-bold tracking-tight text-zinc-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-600">
        This admin screen could not load. Your data is safe. Try again, or return to the dashboard if the problem continues.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800"
        >
          <RotateCcw size={15} /> Try again
        </button>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-900 hover:bg-zinc-50"
        >
          Back to dashboard
        </Link>
      </div>
      {error.digest && <p className="mt-4 text-[.65rem] text-zinc-400">Reference: {error.digest}</p>}
    </section>
  );
}
