import { notFound } from "next/navigation";
import type { InquiryEmailData } from "@/lib/email-templates";

/**
 * `/preview/emails` — a development-only viewer for the two inquiry emails.
 *
 * HTML email cannot be checked by reading the template. It has to be rendered by
 * the clients that matter, and the failure modes are visual and width-specific:
 * a 600px card that fits a desktop client can still force a horizontal scroll on
 * a 320px phone, and a button that reads as one wide target in a browser can
 * wrap to two lines in Outlook.
 *
 * So this renders the real `customerConfirmationHtml` / `ownerNotificationHtml`
 * output — not a mock-up — inside iframes at the widths the email is actually
 * read at, with a device toolbar, a subject-line readout, and a
 * longest-plausible-field case next to a required-fields-only case.
 *
 * `srcDoc` rather than `dangerouslySetInnerHTML` so the full document, doctype
 * and `<style>` block the client will actually receive is what gets rendered.
 *
 * This route 404s in production. It exposes sample data and the admin URL shape,
 * and there is no reason for either to be reachable on a live site.
 */
export const dynamic = "force-dynamic";

/** The widths this is judged on: the 320px floor through to the full 600px card. */
const WIDTHS = [320, 375, 414, 430, 600] as const;

/**
 * Every field populated, with the values a real industrial enquiry tends to
 * carry: a long company name, a long product name, a long location and a
 * requirement several sentences long. If the layout survives this it survives
 * the short cases.
 */
const FULL: InquiryEmailData = {
  reference: "RST-2026-00124",
  receivedAt: new Date("2026-10-02T09:42:00+05:30"),
  inquiryId: 124,
  name: "Anand Venkatesan Iyer",
  email: "anand.iyer@precisionforgecomponents.in",
  phone: "9876543210",
  company: "Precision Forge & Components Private Limited",
  whatsapp: "9876543210",
  location: "Plot 42, Chakan Industrial Area, Pune, Maharashtra 410501",
  productName: "Heavy Duty Steel Pallet Racking System (2200mm x 1100mm x 7000mm)",
  serviceName: "Turnkey Warehouse Installation & Commissioning",
  quantity: "1,850 rack frames / approx 14,800 pallet positions",
  warehouseSize: "68,000 sq. ft. clear height 35 ft.",
  loadRequirement: "1500 kg per level, UDL 4.5 MT per bay, seismic zone III",
  message:
    "We are consolidating three godowns into a single facility and need a racking layout that handles both palletised steel coils and finished machined components.\n\nPlease share a GA drawing with aisle widths, and confirm whether your team handles the fire-rated in-rack sprinkler arrangement or whether that has to be coordinated with our civil contractor.\n\nTimeline: layout approval needed by 20 November 2026.",
  requirement: "Heavy duty racking for a 68,000 sq ft consolidated warehouse.",
  sourcePage: "/request-a-quote",
};

/**
 * Only the fields the schema requires, with the reference omitted too.
 *
 * This is the case that catches the silent gaps: an optional field renders as
 * nothing here, so any card, row, button or divider that was still reserving
 * space for an absent value shows up immediately as a hole in the layout.
 */
const MINIMAL: InquiryEmailData = {
  reference: "",
  receivedAt: new Date("2026-10-02T09:42:00+05:30"),
  name: "Ravi Kumar",
  email: "ravi@example.com",
  phone: "9812345678",
  message: "Need 40 pallet racks delivered to Nashik. Please call me.",
};

export default async function EmailPreviewPage() {
  /**
   * 404 in production, checked here rather than at module scope. A top-level
   * `notFound()` runs while Next is still collecting page data during
   * `next build`, which fails the whole build with a `NEXT_HTTP_ERROR_FALLBACK`
   * instead of just pruning this route.
   */
  if (process.env.NODE_ENV === "production") notFound();

  const { customerConfirmationHtml, ownerNotificationHtml, COMPANY } = await import(
    "@/lib/email-templates"
  );

  const owner = ownerNotificationHtml(FULL);
  const minimalOwner = ownerNotificationHtml(MINIMAL);

  const full: Array<{ label: string; subject: string; html: string }> = [
    { label: "OWNER — New Inquiry Received", subject: owner.subject, html: owner.html },
    {
      label: "CUSTOMER — Inquiry Confirmation",
      subject: "We have your inquiry | Rack & Stack Storage Systems",
      html: customerConfirmationHtml(FULL),
    },
  ];

  const minimal: Array<{ label: string; html: string }> = [
    { label: "OWNER — required fields only", html: minimalOwner.html },
    { label: "CUSTOMER — required fields only", html: customerConfirmationHtml(MINIMAL) },
  ];

  /**
   * The templates drop the logo and the admin button when there is no public
   * site URL. `NEXT_PUBLIC_SITE_URL` is `http://localhost:3000` locally, which
   * is treated as unset on purpose, so without this notice the missing button
   * reads as a bug in the template rather than a missing environment variable.
   */
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const loopback = /localhost|127\.0\.0\.1/i.test(siteUrl);
  const noLinks = !siteUrl || loopback;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-300">
      <div className="mx-auto max-w-[1400px]">
        <header className="border-b border-white/15 pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Rack &amp; Stack — inquiry email preview
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-400">
            Real template output from{" "}
            <code className="text-neutral-200">src/lib/email-templates.ts</code>, rendered at the widths
            it is actually read at. Reload after editing a template. This route 404s in production.
          </p>
        </header>

        {noLinks ? (
          <div className="mt-6 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
            <strong className="font-semibold">Logo and admin buttons are hidden.</strong>{" "}
            <code>NEXT_PUBLIC_SITE_URL</code> is{" "}
            {siteUrl ? <code>{siteUrl}</code> : "unset"}
            {loopback ? " — a loopback origin is treated as unset so a dev build never ships dead localhost links." : "."}{" "}
            Restart the dev server with{" "}
            <code className="text-amber-100">NEXT_PUBLIC_SITE_URL=https://rackandstack.in</code> to see the
            logo, the VIEW INQUIRY button and the website footer link.
          </div>
        ) : null}

        {full.map((template) => (
          <section key={template.label} className="mt-10">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="text-lg font-bold text-white">{template.label}</h2>
              <p className="text-xs text-neutral-400">
                <span className="uppercase tracking-wider text-neutral-500">Subject: </span>
                {template.subject}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-start gap-6">
              {WIDTHS.map((width) => (
                <figure key={width} className="shrink-0">
                  <figcaption className="mb-2 font-mono text-xs text-neutral-500">{width}px</figcaption>
                  <div
                    className="overflow-hidden rounded-md border border-white/15 bg-white shadow-2xl"
                    style={{ width, height: width >= 600 ? 900 : 1100 }}
                  >
                    <iframe
                      title={`${template.label} at ${width}px`}
                      srcDoc={template.html}
                      style={{ width, height: "100%", border: 0 }}
                    />
                  </div>
                </figure>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-14 border-t border-white/15 pt-8">
          <h2 className="text-lg font-bold text-white">Empty-field handling</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-400">
            The same templates with only the fields the API requires. Anything still reserving space for an
            absent optional value shows up here as a gap. Shown at 390px.
          </p>
          <div className="mt-4 flex flex-wrap items-start gap-6">
            {minimal.map((template) => (
              <figure key={template.label} className="shrink-0">
                <figcaption className="mb-2 text-xs text-neutral-500">{template.label}</figcaption>
                <div
                  className="overflow-hidden rounded-md border border-white/15 bg-white shadow-2xl"
                  style={{ width: 390, height: 900 }}
                >
                  <iframe
                    title={template.label}
                    srcDoc={template.html}
                    style={{ width: 390, height: "100%", border: 0 }}
                  />
                </div>
              </figure>
            ))}
          </div>
        </section>

        <footer className="mt-12 border-t border-white/15 pt-4 text-xs text-neutral-500">
          Company contact resolved to {COMPANY.email} · {COMPANY.phone} · site {COMPANY.siteUrl || "(unset)"}
        </footer>
      </div>
    </main>
  );
}