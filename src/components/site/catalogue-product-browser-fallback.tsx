/**
 * The Suspense fallback for the catalogue browser on `/products`.
 *
 * `useSearchParams` suspends during static generation, so the page needs a
 * boundary or it cannot be prerendered at all. This is what shows for that one
 * frame.
 *
 * It mirrors the browser's grid (`md:grid-cols-2 xl:grid-cols-3` of equal-height
 * cards with a 16:10 image) rather than a spinner, because a spinner would
 * collapse to a few pixels and then push the whole page down when the real grid
 * arrives — a visible layout shift on the largest page of the site. The
 * placeholder cards are the same size as the real ones, so the swap is invisible.
 */
export function CatalogueProductBrowserFallback({ rows = 2 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: rows * 3 }, (_, index) => (
        <div key={index} className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="aspect-[16/10] w-full bg-zinc-100" />
          <div className="flex flex-1 flex-col gap-2.5 p-5">
            <div className="h-4 w-2/3 rounded bg-zinc-100" />
            <div className="h-3 w-full rounded bg-zinc-100" />
            <div className="h-3 w-4/5 rounded bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
