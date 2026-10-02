/**
 * The Suspense fallback for `InquiryForm`.
 *
 * `InquiryForm` reads `useSearchParams` to preselect the product or service from
 * the `?product=` / `?service=` query, and that suspends during static
 * generation. Every page that renders it therefore needs a boundary or it cannot
 * be prerendered and falls back to rendering per request.
 *
 * This used to be covered implicitly by the root `app/loading.tsx`, which wrapped
 * every route in a boundary. Removing that file (so `notFound()` could set a real
 * 404 status instead of being swallowed by an already-flushed shell) exposed the
 * missing boundaries at the call sites, which is why each one now declares its own.
 *
 * The height mirrors the compact form rather than collapsing to nothing, because a
 * form that pops into existence after hydration pushes the rest of the page down.
 */
export function InquiryFormFallback({ compact = false }: { compact?: boolean }) {
  return (
    <div aria-hidden="true" className={compact ? "space-y-3" : "space-y-4"}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-11 rounded-lg bg-zinc-100" />
        <div className="h-11 rounded-lg bg-zinc-100" />
      </div>
      <div className="h-11 rounded-lg bg-zinc-100" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-11 rounded-lg bg-zinc-100" />
        <div className="h-11 rounded-lg bg-zinc-100" />
      </div>
      <div className="h-24 rounded-lg bg-zinc-100" />
      <div className="h-12 w-full rounded-lg bg-zinc-200 sm:w-64" />
    </div>
  );
}
