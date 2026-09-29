import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { CTASection } from "@/components/site/ui";

/**
 * Route-group level 404 boundary.
 *
 * Without this, `notFound()` inside (site) routes falls through to the root
 * boundary, which renders outside the site chrome and is served with a 200
 * status. Declaring it here keeps the header/footer and returns a real 404.
 */
export default function SiteNotFound() {
  return (
    <main>
      <section className="bg-zinc-950 py-14 text-white">
        <div className="container-shell max-w-3xl">
          <p className="eyebrow text-red-400">Error 404</p>
          <h1 className="hero-heading mt-5">Page Not Found</h1>
          <p className="hero-description mt-5 text-zinc-300">
            The page may have moved or no longer exists. Use the links below to get back on track.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="btn-primary">
              <ArrowLeft size={16} />
              Return Home
            </Link>
            <Link href="/search" className="btn-light">
              <Search size={16} />
              Search Website
            </Link>
          </div>
        </div>
      </section>
      <CTASection title="Need Help Finding Something?" />
    </main>
  );
}
