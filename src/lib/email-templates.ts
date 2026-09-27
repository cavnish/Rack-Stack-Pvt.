import "server-only";

/**
 * Email templates for the website inquiry system.
 *
 * Two emails, one shared visual system:
 *   - `customerConfirmationHtml` — sent to the visitor the moment they submit.
 *   - `ownerNotificationHtml`    — sent to the Rack & Stack team, action-first.
 *
 * Client-compatibility rules this file deliberately follows, because Gmail,
 * Apple Mail, Outlook.com and the mobile clients disagree about most of CSS:
 *
 *   - Layout is nested `<table>`s. No flexbox, no grid, no `position`.
 *   - Every visual property is inline. The single `<style>` block only carries
 *     media queries, so a client that strips it still gets a correct desktop
 *     email.
 *   - Content width is 640px, inside Gmail's 1024px clipping threshold.
 *   - The CTA is a real `<a>` wrapped in a VML roundrect for Outlook, because
 *     Outlook ignores `border-radius` and `background` on buttons.
 *   - No CSS custom properties, web fonts, SVG, animation or JavaScript.
 *   - Anything optional is omitted entirely rather than rendered blank, so a
 *     missing field can never show as "undefined", "null" or an em dash.
 */

/** Rack & Stack brand tokens, mirrored from the site design system. */
const BRAND = {
  ink: "#151719",
  graphite: "#202326",
  muted: "#656b70",
  line: "#dfe2e3",
  paper: "#f4f4f1",
  white: "#ffffff",
  red: "#d11f2f",
  redDark: "#ad1220",
  redWash: "#fdf2f3",
} as const;

/** Company contact details, overridable per deployment without a code change. */
export const COMPANY = {
  legalName: "Rack & Stack Storage Systems Pvt. Ltd.",
  email: process.env.RESEND_COMPANY_EMAIL ?? "info@rackandstack.in",
  phone: process.env.RESEND_COMPANY_PHONE ?? "+91 97692 67792",
  address:
    process.env.RESEND_COMPANY_ADDRESS ??
    "Sr. No. 94/1, Umar Compound, Sopara Phata, Vasai-Virar, Maharashtra 401208",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, ""),
} as const;

/**
 * The bare site origin, or null when the deployment has not set one.
 *
 * Callers must omit a link rather than emit `http://localhost:3000` — an email
 * that ships with a localhost button is worse than an email with no button.
 */
function baseUrl(): string | null {
  return COMPANY.siteUrl || null;
}

/** A path on the site. Returns null when no site URL is configured. */
function siteUrl(path = "/"): string | null {
  const base = baseUrl();
  return base ? `${base}${path}` : null;
}

/** Everything the templates may render. Every field except the basics is optional. */
export type InquiryEmailData = {
  /** Display reference, e.g. `RST-2026-00124`. */
  reference: string;
  receivedAt: Date;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  whatsapp?: string | null;
  location?: string | null;
  productName?: string | null;
  serviceName?: string | null;
  /** What the visitor actually typed, not a system-composed summary. */
  message?: string | null;
  requirement?: string | null;
  quantity?: string | null;
  warehouseSize?: string | null;
  loadRequirement?: string | null;
  sourcePage?: string | null;
  /** Database id, used for the admin deep links only. */
  inquiryId?: number;
};

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Helvetica,Arial,sans-serif";
const MONO_STACK = "ui-monospace,'SF Mono','Cascadia Mono',Menlo,Consolas,monospace";

/**
 * Normalises a possibly-absent value to a trimmed string, or "".
 *
 * Every optional field in both templates is rendered through this, which is what
 * guarantees no "undefined", "null", "[object Object]" or bare em dash can
 * reach a recipient.
 */
function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

/** Escapes for an HTML text node or a double-quoted attribute. */
function escapeHtml(value: unknown): string {
  return text(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escapes for a URL query or path segment. */
function encode(value: unknown): string {
  return encodeURIComponent(text(value));
}

/**
 * A mailto link with the reference and a sensible reply subject already filled
 * in, so a customer's "Reply" is already contextual.
 *
 * The address is inserted literally rather than percent-encoded: `%40` in the
 * address is legal but trips up some mobile clients, and the address has already
 * been validated as an email by the inquiry schema. Only the subject is encoded.
 */
function replyLink(email: string, subject: string): string {
  return `mailto:${escapeHtml(text(email))}?subject=${encode(subject)}`;
}

function formatDate(value: Date): string {
  if (Number.isNaN(value.getTime())) return "";
  // Explicit en-GB with a timezone: the server's locale must not decide how an
  // Indian business reads its own timestamps.
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(value);
}

/** Joins non-empty values, so a product OR a service is shown but never both as blanks. */
function joinValues(...values: Array<string | null | undefined>): string {
  return values.map(text).filter(Boolean).join(" · ");
}

/* ------------------------------------------------------------------ *
 * Shared building blocks
 * ------------------------------------------------------------------ */

/**
 * The preheader: the grey line of text an inbox shows next to the subject.
 * Hidden body copy rather than a `<style>` trick, because only the former is
 * reliably picked up.
 */
function preheader(value: string): string {
  const filler = "&#847;&zwnj;&nbsp;".repeat(60);
  return `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(
    value,
  )}${filler}</div>`;
}

/** Wordmark. The image is the mark; the name is live text so it stays selectable. */
function brandHeader(dark: boolean): string {
  const logo = siteUrl("/logo.png");
  const nameColor = dark ? BRAND.white : BRAND.ink;
  const subColor = dark ? "#8a9096" : BRAND.muted;
  return `<tr>
    <td style="padding:32px 40px 26px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td class="rs-stack" style="vertical-align:middle;width:56px;">
            ${
              logo
                ? `<img src="${escapeHtml(logo)}" width="48" height="48" alt="Rack &amp; Stack Storage Systems" style="display:block;width:48px;height:48px;border:0;outline:none;text-decoration:none;">`
                : // No asset URL configured: the mark is dropped, the wordmark is not.
                  `<span style="display:inline-block;width:48px;height:48px;line-height:48px;background:${
                    dark ? BRAND.graphite : BRAND.paper
                  };color:${BRAND.white};font-family:${FONT_STACK};font-size:20px;font-weight:800;">R&amp;S</span>`
            }
          </td>
          <td class="rs-stack" style="vertical-align:middle;padding-left:14px;">
            <div style="font-family:${FONT_STACK};font-size:17px;font-weight:800;letter-spacing:.12em;line-height:20px;color:${nameColor};">RACK &amp; STACK</div>
            <div style="padding-top:5px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:.19em;line-height:14px;color:${subColor};text-transform:uppercase;">Storage Systems</div>
          </td>
          <td class="rs-hide-sm" style="vertical-align:middle;text-align:right;font-family:${FONT_STACK};font-size:11px;font-weight:700;letter-spacing:.14em;line-height:16px;color:${subColor};text-transform:uppercase;">Industrial Storage &amp; Material Handling</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/** The 2px brand rule that closes the header. */
function accentDivider(): string {
  return `<tr>
    <td style="padding:0 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td width="56" style="width:56px;font-size:0;line-height:0;">&nbsp;</td>
          <td style="font-size:0;line-height:0;border-top:2px solid ${BRAND.red};"></td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/**
 * The primary button.
 *
 * The `<a>` is what actually works everywhere; the VML roundrect is only read by
 * Outlook, which cannot render a padded anchor.
 */
function primaryButton(label: string, href: string | null, brand: string = BRAND.red): string {
  if (!href) return "";
  return `<!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(
        href,
      )}" style="height:46px;v-text-anchor:middle;width:240px;" arcsize="8%" stroke="f" fillcolor="${brand}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${escapeHtml(
          label,
        )}</center>
      </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <a href="${escapeHtml(href)}" style="display:inline-block;background:${brand};color:#ffffff;font-family:${FONT_STACK};font-size:14px;font-weight:700;letter-spacing:.02em;line-height:46px;height:46px;padding:0 28px;border-radius:4px;text-decoration:none;">${escapeHtml(
      label,
    )}</a>
    <!--<![endif]-->`;
}

/** A quieter outline button for the owner email's secondary actions. */
function outlineButton(label: string, href: string | null): string {
  if (!href) return "";
  return `<a href="${escapeHtml(
    href,
  )}" style="display:inline-block;background:${BRAND.ink};color:${BRAND.white};font-family:${FONT_STACK};font-size:13px;font-weight:700;letter-spacing:.02em;line-height:42px;height:42px;padding:0 22px;border:1px solid ${BRAND.graphite};border-radius:4px;text-decoration:none;">${escapeHtml(
    label,
  )}</a>`;
}

/**
 * A label/value information card.
 *
 * Rows are built only from values that exist. `rows` is a plain list so the
 * caller cannot accidentally render an empty row.
 */
function detailCard(
  title: string,
  rows: Array<{ label: string; value: string; mono?: boolean }>,
  options: { accent?: boolean } = {},
): string {
  const present = rows.filter((row) => row.value.length > 0);
  if (present.length === 0) return "";
  const border = options.accent ? BRAND.red : BRAND.line;

  const body = present
    .map(
      (row) => `<tr>
        <td class="rs-row" width="42%" style="width:42%;padding:11px 0;border-bottom:1px solid ${BRAND.line};font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:.12em;line-height:16px;color:${BRAND.muted};text-transform:uppercase;vertical-align:top;">${escapeHtml(
          row.label,
        )}</td>
        <td class="rs-row" style="padding:11px 0;border-bottom:1px solid ${BRAND.line};font-family:${
          row.mono ? MONO_STACK : FONT_STACK
        };font-size:${row.mono ? "16px" : "14px"};font-weight:${row.mono ? "700" : "600"};letter-spacing:${
          row.mono ? ".02em" : "0"
        };line-height:21px;color:${BRAND.ink};word-break:break-word;">${escapeHtml(row.value)}</td>
      </tr>`,
    )
    .join("");

  return `<tr>
    <td style="padding:0 40px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${BRAND.line};border-top:2px solid ${border};border-radius:4px;background:${BRAND.white};">
        <tr>
          <td style="padding:18px 22px 6px;font-family:${FONT_STACK};font-size:10px;font-weight:800;letter-spacing:.15em;line-height:14px;color:${BRAND.muted};text-transform:uppercase;">${escapeHtml(
            title,
          )}</td>
        </tr>
        <tr>
          <td style="padding:0 22px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              ${body}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/** A short prose block, rendered only when there is something to say. */
function paragraph(value: string | null | undefined, color: string = BRAND.muted, size = 15): string {
  const body = text(value);
  if (!body) return "";
  return `<tr>
    <td style="padding:0 40px 24px;font-family:${FONT_STACK};font-size:${size}px;font-weight:400;line-height:1.65;color:${color};">${escapeHtml(
      body,
    )}</td>
  </tr>`;
}

/**
 * The dark "what happens next" band.
 *
 * Steps that have no copy are skipped, and the row falls back to fewer columns
 * rather than leaving gaps — so the band never renders three empty circles.
 */
function stepsBand(steps: Array<{ title: string; body: string }>): string {
  const present = steps.filter((step) => text(step.title) && text(step.body));
  if (present.length === 0) return "";
  const width = Math.floor(100 / present.length);

  const cells = present
    .map(
      (step, index) => `<td class="rs-stack" width="${width}%" style="width:${width}%;padding:0 ${index === 0 ? "0" : "10px"} 0 ${index === present.length - 1 ? "0" : "10px"};vertical-align:top;">
            <div style="padding-bottom:12px;">
              <span style="display:inline-block;width:30px;height:30px;line-height:30px;background:${BRAND.graphite};border:1px solid ${BRAND.red};border-radius:15px;font-family:${MONO_STACK};font-size:10px;font-weight:700;letter-spacing:.04em;color:${BRAND.white};text-align:center;">${String(
                index + 1,
              ).padStart(2, "0")}</span>
            </div>
            <div style="font-family:${FONT_STACK};font-size:14px;font-weight:700;letter-spacing:-.01em;line-height:20px;color:${BRAND.white};">${escapeHtml(
              step.title,
            )}</div>
            <div style="padding-top:6px;font-family:${FONT_STACK};font-size:13px;font-weight:400;line-height:1.6;color:#a8aeb3;">${escapeHtml(
              step.body,
            )}</div>
          </td>`,
    )
    .join("");

  return `<tr>
    <td style="background:${BRAND.ink};padding:32px 40px 34px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-bottom:6px;font-family:${FONT_STACK};font-size:10px;font-weight:800;letter-spacing:.15em;line-height:14px;color:${BRAND.red};text-transform:uppercase;">What happens next</td>
        </tr>
        <tr>
          <td style="padding-top:14px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>${cells}</tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/**
 * The premium footer, shared by both emails.
 *
 * Contact details are omitted when not configured rather than printed as
 * placeholders, so a half-configured deployment still looks finished.
 */
function footer(note?: string): string {
  const website = siteUrl();
  const contact = [
    COMPANY.phone
      ? `<a href="tel:${encodeURIComponent(COMPANY.phone.replace(/\s+/g, ""))}" style="color:#c9ced2;text-decoration:none;">${escapeHtml(
          COMPANY.phone,
        )}</a>`
      : "",
    `<a href="mailto:${escapeHtml(COMPANY.email)}" style="color:#c9ced2;text-decoration:none;">${escapeHtml(
      COMPANY.email,
    )}</a>`,
    website ? `<a href="${escapeHtml(website)}" style="color:#c9ced2;text-decoration:none;">${escapeHtml(
      website.replace(/^https?:\/\//, ""),
    )}</a>` : "",
  ].filter(Boolean);

  return `<tr>
    <td style="background:${BRAND.ink};padding:30px 40px 32px;border-top:1px solid #2b2f33;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="font-family:${FONT_STACK};font-size:13px;font-weight:700;letter-spacing:.02em;line-height:18px;color:${BRAND.white};">${escapeHtml(
            COMPANY.legalName,
          )}</td>
        </tr>
        <tr>
          <td style="padding-top:10px;font-family:${FONT_STACK};font-size:12px;font-weight:400;line-height:20px;color:#8a9096;">${escapeHtml(
            COMPANY.address,
          )}</td>
        </tr>
        <tr>
          <td class="rs-stack" style="padding-top:12px;font-family:${FONT_STACK};font-size:12px;font-weight:600;line-height:20px;">
            ${contact.join(
              `<span style="color:#4a4f54;padding:0 8px;">/</span>`,
            )}
          </td>
        </tr>
        ${
          note
            ? `<tr><td style="padding-top:14px;font-family:${FONT_STACK};font-size:11px;font-weight:600;letter-spacing:.04em;line-height:16px;color:#6b7176;text-transform:uppercase;">${escapeHtml(
                note,
              )}</td></tr>`
            : ""
        }
        <tr>
          <td style="padding-top:18px;font-family:${FONT_STACK};font-size:11px;font-weight:400;line-height:16px;color:#5f656a;">© ${new Date(
            formatDate(new Date()).length ? new Date().getFullYear() : new Date().getFullYear(),
          )} ${escapeHtml(COMPANY.legalName)}. All rights reserved.</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/**
 * The shared document shell.
 *
 * `role="presentation"` on every layout table keeps screen readers from
 * announcing the scaffolding. The `<style>` block is progressive enhancement
 * only: a client that drops it still receives a correct 640px desktop email.
 */
function documentShell(opts: {
  title: string;
  preheader: string;
  content: string;
  footerNote?: string;
}): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(opts.title)}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0;mso-table-rspace:0;}
  img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
  body{margin:0;padding:0;width:100%!important;}
  table{border-collapse:collapse!important;}
  a{color:${BRAND.red};}
  @media only screen and (max-width:660px){
    .rs-pad{padding-left:22px!important;padding-right:22px!important;}
    .rs-row{display:block!important;width:100%!important;padding-bottom:8px!important;}
    .rs-row + .rs-row{border-top:0!important;padding-top:0!important;}
    .rs-stack{display:block!important;width:100%!important;padding-left:0!important;padding-right:0!important;padding-bottom:16px!important;}
    .rs-stack:last-child{padding-bottom:0!important;}
    .rs-hide-sm{display:none!important;}
    .rs-headline{font-size:27px!important;line-height:1.18!important;}
    .rs-btn{display:block!important;text-align:center!important;}
    .rs-btn a{display:block!important;padding:0 16px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.paper};">
${preheader(opts.preheader)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.paper};">
  <tr>
    <td align="center" style="padding:28px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:100%;max-width:640px;background-color:${BRAND.white};border:1px solid ${BRAND.line};border-radius:6px;overflow:hidden;">
        ${opts.content}
        ${footer(opts.footerNote)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/* ------------------------------------------------------------------ *
 * Email 1 — customer confirmation
 * ------------------------------------------------------------------ */

export const CUSTOMER_SUBJECT = "Your requirement has been received | Rack & Stack";
export const CUSTOMER_PREHEADER = "Thank you for contacting Rack & Stack Storage Systems.";

/** The reference block: the one number the customer will be asked for. */
function referenceCard(reference: string): string {
  if (!reference) return "";
  return `<tr>
    <td class="rs-pad" style="padding:0 40px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${BRAND.line};border-left:3px solid ${BRAND.red};border-radius:4px;background:${BRAND.paper};">
        <tr>
          <td class="rs-pad" style="padding:20px 24px;">
            <div style="font-family:${FONT_STACK};font-size:10px;font-weight:800;letter-spacing:.15em;line-height:14px;color:${BRAND.muted};text-transform:uppercase;">Inquiry Reference</div>
            <div style="padding-top:8px;font-family:${MONO_STACK};font-size:26px;font-weight:700;letter-spacing:.04em;line-height:32px;color:${BRAND.red};">${escapeHtml(
              reference,
            )}</div>
            <div style="padding-top:10px;font-family:${FONT_STACK};font-size:13px;font-weight:400;line-height:19px;color:${BRAND.muted};">Please keep this reference number for future correspondence.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

export function customerConfirmationHtml(data: InquiryEmailData): string {
  const firstName = text(data.name).split(/\s+/)[0] ?? "";
  const greeting = firstName ? `Thank you, ${firstName}.` : "Thank you.";
  const productOrService = joinValues(data.serviceName, data.productName);

  const summaryRows = [
    { label: productOrService ? "Service / Product" : "Enquiry About", value: productOrService },
    { label: "Name", value: text(data.name) },
    { label: "Company", value: text(data.company) },
    { label: "Email", value: text(data.email) },
    { label: "Phone", value: text(data.phone) },
    { label: "Location", value: text(data.location) },
    { label: "Quantity", value: text(data.quantity) },
    { label: "Available Space", value: text(data.warehouseSize) },
    { label: "Load Requirement", value: text(data.loadRequirement) },
    { label: "Requirement", value: text(data.message) || text(data.requirement) },
  ];

  const hero = `<tr>
    <td class="rs-pad" style="background:${BRAND.ink};padding:38px 40px 40px;">
      <div style="font-family:${FONT_STACK};font-size:10px;font-weight:800;letter-spacing:.16em;line-height:14px;color:${BRAND.red};text-transform:uppercase;">Requirement Received</div>
      <h1 class="rs-headline" style="margin:0;padding:16px 0 0;font-family:${FONT_STACK};font-size:32px;font-weight:700;letter-spacing:-.02em;line-height:1.15;color:${BRAND.white};">${escapeHtml(
        greeting,
      )}</h1>
      <p style="margin:0;padding:12px 0 0;font-family:${FONT_STACK};font-size:17px;font-weight:500;line-height:1.5;color:#c2c7cb;">We&apos;ve received your requirement.</p>
    </td>
  </tr>`;

  const body = `${hero}
  ${referenceCard(text(data.reference))}
  ${paragraph(
    "Our team has received your requirement and will review the information provided. A member of our team will contact you shortly to understand your application, storage requirements and next steps.",
    BRAND.graphite,
    15,
  )}
  ${detailCard("What you submitted", summaryRows)}
  ${stepsBand([
    {
      title: "Requirement Review",
      body: "We review your application, product requirements and project details.",
    },
    {
      title: "Team Contact",
      body: "Our team contacts you to clarify dimensions, quantities, location and application.",
    },
    {
      title: "Solution & Quote",
      body: "We prepare the appropriate storage solution and commercial proposal.",
    },
  ])}
  <tr>
    <td class="rs-pad" align="center" style="padding:34px 40px 32px;border-top:1px solid ${BRAND.line};">
      <div class="rs-btn">${primaryButton("View Our Solutions", siteUrl("/products"))}</div>
      <p style="margin:20px 0 0;font-family:${FONT_STACK};font-size:13px;font-weight:400;line-height:20px;color:${BRAND.muted};">
        Need to discuss your requirement sooner?<br>
        Simply <a href="${escapeHtml(replyLink(data.email, `Re: ${text(data.reference)} — Rack & Stack`))}" style="color:${BRAND.red};text-decoration:underline;">reply to this email</a>.
      </p>
    </td>
  </tr>`;

  return documentShell({
    title: `${greeting} — ${COMPANY.legalName}`,
    preheader: CUSTOMER_PREHEADER,
    content: `<tr><td class="rs-pad" style="background:${BRAND.white};">${brandHeader(
      false,
    )}</td></tr>
    ${accentDivider()}
    ${body}`,
  });
}

/* ------------------------------------------------------------------ *
 * Email 2 — owner / admin notification
 * ------------------------------------------------------------------ */

export function ownerNotificationHtml(data: InquiryEmailData): { subject: string; html: string } {
  const reference = text(data.reference);
  const name = text(data.name);
  const subject = `New Inquiry Received • ${name || "Website enquiry"}${
    reference ? ` • ${reference}` : ""
  }`;

  /**
   * Admin links are derived from the deployment's own site URL, never invented.
   * With no site URL configured the buttons are simply dropped rather than
   * pointing the owner at localhost.
   */
  const adminBase = baseUrl();
  const inquiryHref = adminBase
    ? data.inquiryId
      ? `${adminBase}/admin/inquiries/${data.inquiryId}/edit`
      : `${adminBase}/admin/inquiries`
    : null;
  const dashboardHref = adminBase ? `${adminBase}/admin/inquiries` : null;

  const hero = `<tr>
    <td class="rs-pad" style="background:${BRAND.ink};padding:38px 40px 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td class="rs-stack" style="vertical-align:top;">
            <div style="font-family:${FONT_STACK};font-size:10px;font-weight:800;letter-spacing:.16em;line-height:14px;color:${BRAND.red};text-transform:uppercase;">Website Lead</div>
            <h1 class="rs-headline" style="margin:0;padding:16px 0 0;font-family:${FONT_STACK};font-size:32px;font-weight:700;letter-spacing:-.02em;line-height:1.15;color:${BRAND.white};">New Inquiry Received</h1>
            <p style="margin:0;padding:12px 0 0;font-family:${FONT_STACK};font-size:16px;font-weight:400;line-height:1.55;color:#c2c7cb;">A new customer requirement has been submitted through the website.</p>
          </td>
          <td class="rs-stack" width="190" style="width:190px;vertical-align:top;padding-top:16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${BRAND.red};border-radius:4px;background:#22161a;">
              <tr>
                <td style="padding:14px 16px;">
                  <div style="font-family:${FONT_STACK};font-size:9px;font-weight:800;letter-spacing:.15em;line-height:12px;color:#e0a0a7;text-transform:uppercase;">New Inquiry</div>
                  <div style="padding-top:6px;font-family:${MONO_STACK};font-size:18px;font-weight:700;letter-spacing:.03em;line-height:24px;color:${BRAND.white};">${escapeHtml(
                    reference,
                  )}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  const customerRows = [
    { label: "Customer", value: text(data.name) },
    { label: "Company", value: text(data.company) },
    { label: "Email", value: text(data.email) },
    { label: "Phone", value: text(data.phone) },
    { label: "WhatsApp", value: text(data.whatsapp) },
    { label: "Location", value: text(data.location) },
  ];

  const requirementRows = [
    { label: "Service / Product", value: joinValues(data.serviceName, data.productName) },
    { label: "Quantity", value: text(data.quantity) },
    { label: "Warehouse Size", value: text(data.warehouseSize) },
    { label: "Load Requirement", value: text(data.loadRequirement) },
  ];

  // The free-text requirement gets its own block: it is prose, and a label/value
  // row would wrap it badly on a phone.
  const freeText = text(data.message) || text(data.requirement);
  const requirementBlock = freeText
    ? `<tr>
        <td class="rs-pad" style="padding:0 40px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${BRAND.line};border-left:3px solid ${BRAND.red};border-radius:4px;background:${BRAND.redWash};">
            <tr>
              <td class="rs-pad" style="padding:20px 24px;">
                <div style="font-family:${FONT_STACK};font-size:10px;font-weight:800;letter-spacing:.15em;line-height:14px;color:${BRAND.muted};text-transform:uppercase;">Requirement Details</div>
                <div style="padding-top:10px;font-family:${FONT_STACK};font-size:15px;font-weight:400;line-height:1.65;color:${BRAND.ink};white-space:pre-wrap;word-break:break-word;">${escapeHtml(
                  freeText,
                )}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  const received = formatDate(data.receivedAt);
  const statusRows = [
    { label: "Status", value: "New website inquiry" },
    { label: "Received", value: received },
    { label: "Reference", value: reference },
    { label: "Source", value: text(data.sourcePage) },
  ];

  const actions = [
    { label: "Reply to Customer", href: replyLink(data.email, `Re: ${reference || "Your Rack & Stack enquiry"}`) },
    { label: "View Inquiry", href: inquiryHref },
    { label: "Open Admin Dashboard", href: dashboardHref },
  ].filter((action) => action.href);

  const actionsBlock = actions.length
    ? `<tr>
        <td class="rs-pad" style="padding:0 40px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding-bottom:12px;font-family:${FONT_STACK};font-size:10px;font-weight:800;letter-spacing:.15em;line-height:14px;color:${BRAND.muted};text-transform:uppercase;">Quick Actions</td>
            </tr>
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>${actions
                    .map(
                      (action, index) =>
                        `<td class="rs-btn" style="padding:${index > 0 ? "10px 0 0" : "0"} 0 0 ${
                          index > 0 ? "0" : "0"
                        };">${primaryButton(action.label, action.href, index === 0 ? BRAND.ink : BRAND.red)}</td>`,
                    )
                    .join("")}</tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  const content = `<tr><td class="rs-pad" style="background:${BRAND.white};">${brandHeader(
    true,
  )}</td></tr>
    ${accentDivider()}
    ${hero}
    ${detailCard("Customer Details", customerRows)}
    ${requirementBlock}
    ${detailCard("Requirement", requirementRows, { accent: true })}
    ${actionsBlock}
    ${detailCard("Inquiry Status", statusRows)}
    <tr>
      <td class="rs-pad" style="padding:0 40px 30px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.paper};border-radius:4px;">
          <tr>
            <td class="rs-pad" style="padding:18px 22px;">
              <div style="font-family:${FONT_STACK};font-size:10px;font-weight:800;letter-spacing:.15em;line-height:14px;color:${BRAND.red};text-transform:uppercase;">Recommended Next Step</div>
              <p style="margin:0;padding:8px 0 0;font-family:${FONT_STACK};font-size:14px;font-weight:400;line-height:1.6;color:${BRAND.graphite};">Review the requirement and contact the customer to confirm application details, dimensions, quantity and project timeline.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  return {
    subject,
    html: documentShell({
      title: `New Inquiry${reference ? ` ${reference}` : ""}`,
      preheader: "A new requirement has been submitted through the Rack & Stack website.",
      content,
      footerNote: "Internal notification • Website Inquiry System",
    }),
  };
}
