// Premium Rack & Stack-branded email notifications via Resend.
// Templates are responsive, mobile-first HTML built on table-based layout
// for maximum email-client compatibility. All user data is escaped before render.

import "server-only";

import { Resend } from "resend";

// Brand palette
const BRAND = {
  deepNavy: "#071C27",
  darkNavy: "#04141C",
  navy: "#123B4A",
  orange: "#FF6B1A",
  brightOrange: "#FF7A00",
  lightOrange: "#FFB366",
  cream: "#FFF8F2",
  slate: "#475569",
  slateLight: "#64748B",
  border: "#E2E8F0",
  white: "#FFFFFF",
};

// Rack & Stack logo.
// Replace this URL with your actual Cloudinary/static logo URL.
const LOGO_URL =
  "https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/vYOUR_VERSION/rack-stack/general/logo.png";

const WEBSITE_URL = "https://rackandstack.in";

const OFFICE_PHONE = "+91 97692 67792";
const OFFICE_EMAIL = "info@rackandstack.in";

const COMPANY_NAME = "Rack & Stack Storage Systems Pvt. Ltd.";
const TAGLINE = "Supply & Installation Across India";

/**
 * The public contact identity for both templates.
 *
 * Exported because `/preview/emails` reads it back to show which values the
 * deployment actually resolved, which is how a missing environment variable is
 * told apart from a template bug.
 */
export const COMPANY = {
  legalName: COMPANY_NAME,
  email: process.env.RESEND_COMPANY_EMAIL?.trim() || OFFICE_EMAIL,
  phone: process.env.RESEND_COMPANY_PHONE?.trim() || OFFICE_PHONE,
  address:
    process.env.RESEND_COMPANY_ADDRESS?.trim() ||
    "Sr. No. 94/1, Umar Compound, Sopara Phata, Vasai-Virar, Maharashtra 401208",
  siteUrl: WEBSITE_URL,
} as const;

/**
 * The shape the template builders render from.
 *
 * Deliberately a `Record` of strings: these builders are shared with the legacy
 * lead path, which passes snake_case database columns directly, so the field
 * names stay permissive and every read goes through `escape()` or a `String()`
 * coercion rather than trusting a typed contract that the DB path does not meet.
 */
export type LeadRecord = Record<string, string | number | Date | null | undefined>;

let resendClient: Resend | null = null;

function getResend() {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set in .env");
  }

  resendClient = new Resend(apiKey);

  return resendClient;
}

// Business sender.
// RESEND_FROM_EMAIL is recommended.
// FROM_EMAIL remains as a legacy fallback.
export function resolveFromEmail() {
  const from =
    process.env.RESEND_FROM_EMAIL ||
    process.env.FROM_EMAIL ||
    "";

  return from.trim();
}

// Business notification recipients.
export function resolveNotificationRecipients() {
  const primary = (
    process.env.LEAD_NOTIFICATION_EMAIL || ""
  ).trim();

  const list = primary
    ? [primary]
    : (process.env.NOTIFY_EMAILS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  return Array.from(new Set(list));
}

// Extract bare email from:
// Name <email@example.com>
// or:
// email@example.com
function emailAddressOf(sender: unknown): string {
  const match = String(sender).match(/<([^>]+)>/);

  return match
    ? match[1].trim()
    : String(sender).trim();
}

// Query Resend to confirm configured sender domain.
export async function getSenderDomainStatus() {
  try {
    const from = resolveFromEmail();

    if (!from || !process.env.RESEND_API_KEY) {
      return {
        from: from || null,
        domain: null,
        status: "not_configured",
      };
    }

    const domain =
      emailAddressOf(from).split("@")[1] || null;

    if (!domain) {
      return {
        from,
        domain: null,
        status: "unknown",
      };
    }

    const { data, error } =
      await getResend().domains.list();

    if (error) {
      return {
        from,
        domain,
        status: "unknown",
        detail: error.message,
      };
    }

    const match = (data?.data ?? []).find(
      (d: { name?: string }) => d?.name === domain
    );

    return {
      from,
      domain,
      status: match
        ? match.status
        : "not_found_in_resend",
    };
  } catch (err) {
    return {
      from: resolveFromEmail() || null,
      domain: null,
      status: "unknown",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function sendEmail(message: {
  from: string;
  to: string | string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}) {
  const { data, error } =
    await getResend().emails.send(message);

  if (error) {
    const code = error.statusCode
      ? ` (HTTP ${error.statusCode})`
      : "";

    throw new Error(
      `${error.message || "Resend rejected the email"}${code}`
    );
  }

  return data;
}

// Escape all user-controlled values before inserting into HTML.
function escape(str: unknown): string {
  if (str == null) return "";

  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Preserve line breaks safely.
function escapeMultiline(str: unknown): string {
  return escape(str).replace(/\r?\n/g, "<br/>");
}

// ------------------------------------------------------------
// BRAND HEADER
// ------------------------------------------------------------

function brandHeaderHtml(title: string) {
  return `
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="
        background:${BRAND.darkNavy};
        border-radius:16px 16px 0 0;
        overflow:hidden;
      "
    >
      <tr>
        <td style="padding:28px 28px 20px;">

          <table
            role="presentation"
            width="100%"
            cellpadding="0"
            cellspacing="0"
          >
            <tr>
              <td style="vertical-align:middle;">

                <a
                  href="${WEBSITE_URL}"
                  style="text-decoration:none;"
                >

                  <table
                    role="presentation"
                    cellpadding="0"
                    cellspacing="0"
                  >
                    <tr>

                      <td
                        style="
                          vertical-align:middle;
                          padding-right:12px;
                        "
                      >
                        <img
                          src="${LOGO_URL}"
                          alt="Rack & Stack"
                          width="48"
                          height="48"
                          style="
                            display:block;
                            width:48px;
                            height:48px;
                            border-radius:8px;
                          "
                        />
                      </td>

                      <td style="vertical-align:middle;">

                        <span
                          style="
                            font-family:Arial, Helvetica, sans-serif;
                            font-size:21px;
                            font-weight:900;
                            color:${BRAND.white};
                            letter-spacing:0.4px;
                          "
                        >
                          RACK &amp; STACK
                        </span>

                        <div
                          style="
                            font-family:Arial, Helvetica, sans-serif;
                            font-size:9px;
                            font-weight:700;
                            color:${BRAND.lightOrange};
                            letter-spacing:2.5px;
                            margin-top:4px;
                          "
                        >
                          STORAGE SYSTEMS
                        </div>

                      </td>

                    </tr>
                  </table>

                </a>

              </td>
            </tr>

            <tr>
              <td style="padding-top:16px;">

                <div
                  style="
                    font-family:Arial, Helvetica, sans-serif;
                    font-size:24px;
                    font-weight:800;
                    color:${BRAND.white};
                    line-height:1.25;
                  "
                >
                  ${title}
                </div>

              </td>
            </tr>

          </table>

          <div
            style="
              height:4px;
              background:${BRAND.orange};
              border-radius:2px;
              margin-top:16px;
            "
          ></div>

        </td>
      </tr>
    </table>
  `;
}

// ------------------------------------------------------------
// FOOTER
// ------------------------------------------------------------

function brandFooterHtml() {
  return `
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="
        background:${BRAND.deepNavy};
        border-radius:0 0 16px 16px;
      "
    >
      <tr>

        <td style="padding:24px 28px 28px;">

          <table
            role="presentation"
            width="100%"
            cellpadding="0"
            cellspacing="0"
          >

            <tr>
              <td style="padding-bottom:10px;">

                <span
                  style="
                    font-family:Arial, Helvetica, sans-serif;
                    font-size:10px;
                    font-weight:700;
                    color:${BRAND.orange};
                    letter-spacing:2px;
                  "
                >
                  ${TAGLINE}
                </span>

              </td>
            </tr>

            <tr>
              <td>

                <span
                  style="
                    font-family:Arial, Helvetica, sans-serif;
                    font-size:13px;
                    color:#DCE6EC;
                  "
                >

                  <a
                    href="tel:+919769267792"
                    style="
                      color:${BRAND.lightOrange};
                      text-decoration:none;
                    "
                  >
                    ${OFFICE_PHONE}
                  </a>

                  &nbsp;&nbsp;&nbsp;&middot;&nbsp;&nbsp;&nbsp;

                  <a
                    href="mailto:${OFFICE_EMAIL}"
                    style="
                      color:${BRAND.lightOrange};
                      text-decoration:none;
                    "
                  >
                    ${OFFICE_EMAIL}
                  </a>

                </span>

              </td>
            </tr>

          </table>

          <div
            style="
              border-top:1px solid rgba(255,255,255,0.12);
              margin-top:18px;
              padding-top:12px;
            "
          >

            <span
              style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:10px;
                color:#6F93A6;
              "
            >
              &copy; ${new Date().getFullYear()}
              ${escape(COMPANY_NAME)}
            </span>

          </div>

        </td>

      </tr>
    </table>
  `;
}

// ------------------------------------------------------------
// EMAIL LAYOUT
// ------------------------------------------------------------

function layoutHtml(bodyHtml: string) {
  return `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<meta
  http-equiv="X-UA-Compatible"
  content="IE=edge"
/>

<title>${escape(COMPANY_NAME)}</title>

<style>

  @media only screen and (max-width: 480px) {

    .container {
      width:100% !important;
    }

    .content-pad {
      padding:24px 18px !important;
    }

    .stack-col {
      display:block !important;
      width:100% !important;
    }

  }

  body,
  table,
  td {
    mso-line-height-rule:exactly;
  }

</style>

</head>

<body
  style="
    margin:0;
    padding:24px 12px;
    background:#EEF1F3;
  "
>

  <div
    class="container"
    style="
      max-width:600px;
      margin:0 auto;
      font-family:Arial, Helvetica, sans-serif;
    "
  >

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="
        width:100%;
        background:${BRAND.white};
        border-radius:16px;
        box-shadow:0 8px 24px rgba(7,28,39,0.10);
      "
    >

      <tr>

        <td>

          <table
            role="presentation"
            width="100%"
            cellpadding="0"
            cellspacing="0"
          >

            <tr>

              <td>

                ${bodyHtml}

              </td>

            </tr>

          </table>

        </td>

      </tr>

    </table>

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
    >

      <tr>

        <td
          style="
            padding:16px 12px 4px;
            text-align:center;
          "
        >

          <span
            style="
              font-family:Arial, Helvetica, sans-serif;
              font-size:10px;
              color:#8FA3AE;
            "
          >
            You received this because of an inquiry
            on rackandstack.in
          </span>

        </td>

      </tr>

    </table>

  </div>

</body>

</html>
  `;
}

// ------------------------------------------------------------
// INTERNAL / BUSINESS EMAIL
// ------------------------------------------------------------

function buildInternalHtml(lead: LeadRecord) {

  const submittedAt =
    new Date(
      lead.created_at || Date.now()
    ).toLocaleString("en-IN", {
      timeZone:"Asia/Kolkata",
      dateStyle:"medium",
      timeStyle:"short",
    });

  const detailsRows = [

    [
      "Contact Name",
      escape(lead.name),
    ],

    [
      "Company",
      escape(lead.company),
    ],

    [
      "Customer Email",
      `
        <a
          href="mailto:${escape(lead.email)}"
          style="
            color:${BRAND.navy};
            font-weight:600;
            text-decoration:none;
          "
        >
          ${escape(lead.email)}
        </a>
      `,
    ],

    [
      "Phone",
      `
        <a
          href="tel:${escape(lead.phone)}"
          style="
            color:${BRAND.navy};
            font-weight:600;
            text-decoration:none;
          "
        >
          ${escape(lead.phone)}
        </a>
      `,
    ],

    [
      "Product / Service",
      escape(
        lead.service ||
        lead.product ||
        ""
      ),
    ],

    [
      "Submitted",
      escape(submittedAt),
    ],

  ]
    .map(
      ([label, value]) => `
        <tr>

          <td
            style="
              padding:11px 16px;
              border-bottom:1px solid ${BRAND.border};
              font-family:Arial, Helvetica, sans-serif;
              font-size:10px;
              font-weight:700;
              color:${BRAND.slateLight};
              text-transform:uppercase;
              letter-spacing:1px;
              width:38%;
              vertical-align:top;
            "
          >
            ${label}
          </td>

          <td
            style="
              padding:11px 16px;
              border-bottom:1px solid ${BRAND.border};
              font-family:Arial, Helvetica, sans-serif;
              font-size:14px;
              color:${BRAND.darkNavy};
              vertical-align:top;
            "
          >
            ${value}
          </td>

        </tr>
      `
    )
    .join("");

  const messageBlock = lead.message
    ? `
      <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="margin-top:20px;"
      >

        <tr>

          <td
            style="
              font-family:Arial, Helvetica, sans-serif;
              font-size:11px;
              font-weight:700;
              color:${BRAND.orange};
              letter-spacing:2px;
              text-transform:uppercase;
              padding-bottom:8px;
            "
          >
            Customer Message
          </td>

        </tr>

        <tr>

          <td
            style="
              background:${BRAND.cream};
              border-left:4px solid ${BRAND.orange};
              border-radius:8px;
              padding:14px 16px;
              font-family:Arial, Helvetica, sans-serif;
              font-size:13px;
              line-height:1.6;
              color:${BRAND.slate};
            "
          >
            ${escapeMultiline(lead.message)}
          </td>

        </tr>

      </table>
    `
    : "";

  const body = `

    ${brandHeaderHtml("New Website Inquiry")}

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      class="content-pad"
      style="padding:26px 28px;"
    >

      <tr>

        <td>

          <p
            style="
              margin:0 0 18px;
              font-family:Arial, Helvetica, sans-serif;
              font-size:14px;
              color:${BRAND.slate};
              line-height:1.6;
            "
          >
            A new enquiry has been submitted through
            the Rack &amp; Stack website.
          </p>

          <table
            role="presentation"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              border:1px solid ${BRAND.border};
              border-radius:10px;
              overflow:hidden;
            "
          >

            <tr>

              <td
                style="
                  background:${BRAND.deepNavy};
                  padding:12px 16px;
                  font-family:Arial, Helvetica, sans-serif;
                  font-size:13px;
                  font-weight:800;
                  color:${BRAND.white};
                  letter-spacing:1px;
                "
              >
                CUSTOMER DETAILS
              </td>

            </tr>

            ${detailsRows}

            <tr>

              <td
                colspan="2"
                style="
                  padding:12px 16px;
                  font-family:Arial, Helvetica, sans-serif;
                  font-size:12px;
                  color:${BRAND.slate};
                "
              >

                Reply directly:

                <a
                  href="mailto:${escape(lead.email)}"
                  style="
                    color:${BRAND.orange};
                    font-weight:700;
                    text-decoration:none;
                  "
                >
                  ${escape(lead.email)}
                </a>

              </td>

            </tr>

          </table>

          ${messageBlock}

        </td>

      </tr>

    </table>

    ${brandFooterHtml()}

  `;

  return layoutHtml(body);
}

// ------------------------------------------------------------
// CUSTOMER EMAIL
// ------------------------------------------------------------
// Clean customer-facing confirmation.
// Does NOT include:
// - Reference number
// - Inquiry fields
// - Requirement details
// - "What Happens Next"
// - Internal labels
// - Internal owner information
// - CTA button
//
// ------------------------------------------------------------

function buildClientHtml(lead: LeadRecord) {

  /**
   * Hidden preheader, prepended so it wins the inbox preview race.
   *
   * Clients pick the first line of body text as the preview beside the
   * subject. Left alone that is the logo wordmark, so the inbox would show
   * "RACK & STACK" instead of anything useful. The trailing `&#8199;&#65279;`
   * runs are the standard fix: hidden so no client renders them, and enough
   * of them to push any following body text past the ~110-character
   * preview window so it cannot bleed in behind the intended line.
   *
   * Nothing internal reaches this string.
   */
  const preheader = `
    <div
      style="
        display:none;
        max-height:0;
        max-width:0;
        overflow:hidden;
        mso-hide:all;
        font-size:1px;
        line-height:1px;
        color:transparent;
      "
    >${escape(CUSTOMER_PREHEADER)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
  `;

  const body = `${preheader}

    ${brandHeaderHtml("We received your enquiry")}

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      class="content-pad"
      style="padding:30px 28px 34px;"
    >

      <tr>

        <td>

          <h1
            style="
              margin:0 0 10px;
              font-family:Arial, Helvetica, sans-serif;
              font-size:23px;
              font-weight:800;
              color:${BRAND.deepNavy};
              line-height:1.3;
            "
          >
            Thank you, ${escape(lead.name)}!
          </h1>

          <p
            style="
              margin:0 0 18px;
              font-family:Arial, Helvetica, sans-serif;
              font-size:14px;
              color:${BRAND.slate};
              line-height:1.7;
            "
          >
            Thank you for contacting
            <strong style="color:${BRAND.deepNavy};">
              Rack &amp; Stack Storage Systems
            </strong>.
          </p>

          <p
            style="
              margin:0;
              font-family:Arial, Helvetica, sans-serif;
              font-size:14px;
              color:${BRAND.slate};
              line-height:1.7;
            "
          >
            We have received your enquiry successfully.
            Our team will review your requirements and
            get back to you shortly.
          </p>

          <table
            role="presentation"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              margin-top:26px;
              background:${BRAND.cream};
              border:1px solid ${BRAND.border};
              border-radius:12px;
            "
          >

            <tr>

              <td
                style="
                  padding:20px 20px 18px;
                "
              >

                <div
                  style="
                    font-family:Arial, Helvetica, sans-serif;
                    font-size:11px;
                    font-weight:700;
                    color:${BRAND.orange};
                    letter-spacing:2px;
                    text-transform:uppercase;
                    margin-bottom:9px;
                  "
                >
                  THANK YOU FOR CONTACTING US
                </div>

                <div
                  style="
                    font-family:Arial, Helvetica, sans-serif;
                    font-size:14px;
                    color:${BRAND.slate};
                    line-height:1.65;
                  "
                >
                  We appreciate your interest in our
                  industrial storage and warehouse solutions.
                  A member of our team will be in touch with
                  you regarding your enquiry.
                </div>

              </td>

            </tr>

          </table>

          <p
            style="
              margin:24px 0 0;
              font-family:Arial, Helvetica, sans-serif;
              font-size:13px;
              color:${BRAND.slate};
              line-height:1.7;
            "
          >
            If you need to contact us directly, you can
            reach our team at
            <a
              href="tel:+919769267792"
              style="
                color:${BRAND.orange};
                font-weight:700;
                text-decoration:none;
              "
            >
              ${OFFICE_PHONE}
            </a>
            or
            <a
              href="mailto:${OFFICE_EMAIL}"
              style="
                color:${BRAND.orange};
                font-weight:700;
                text-decoration:none;
              "
            >
              ${OFFICE_EMAIL}
            </a>.
          </p>

          <div
            style="
              margin-top:26px;
              padding-top:20px;
              border-top:1px solid ${BRAND.border};
            "
          >

            <div
              style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:13px;
                font-weight:700;
                color:${BRAND.deepNavy};
              "
            >
              Rack &amp; Stack Storage Systems Pvt. Ltd.
            </div>

            <div
              style="
                margin-top:5px;
                font-family:Arial, Helvetica, sans-serif;
                font-size:12px;
                color:${BRAND.slateLight};
              "
            >
              ${TAGLINE}
            </div>

          </div>

        </td>

      </tr>

    </table>

  `;

  return layoutHtml(body);
}

// ------------------------------------------------------------
// PLAIN TEXT — INTERNAL
// ------------------------------------------------------------

function buildInternalText(lead: LeadRecord) {

  const submittedAt =
    new Date(
      lead.created_at || Date.now()
    ).toLocaleString("en-IN", {
      timeZone:"Asia/Kolkata",
      dateStyle:"medium",
      timeStyle:"short",
    });

  return [

    "New Website Inquiry — Rack & Stack",

    `Company: ${lead.company || ""}`,

    `Contact: ${lead.name || ""}`,

    `Email: ${lead.email || ""}`,

    `Phone: ${lead.phone || ""}`,

    `Product / Service: ${
      lead.service ||
      lead.product ||
      ""
    }`,

    `Submitted: ${submittedAt}`,

    lead.message
      ? `\nMessage:\n${lead.message}`
      : "",

    "",

    "Reply to " + lead.email,

  ]
    .filter(Boolean)
    .join("\n");
}

// ------------------------------------------------------------
// PLAIN TEXT — CUSTOMER
// ------------------------------------------------------------
// Kept intentionally simple.
// No reference number, inquiry fields, requirement,
// internal workflow, or internal information.
// ------------------------------------------------------------

function buildClientText(lead: LeadRecord) {

  return [

    `Thank you, ${lead.name || ""}!`,

    "",

    "Thank you for contacting Rack & Stack Storage Systems.",

    "We have received your enquiry successfully.",

    "Our team will review your requirements and get back to you shortly.",

    "",

    "If you need to contact us directly:",

    `Phone: ${OFFICE_PHONE}`,

    `Email: ${OFFICE_EMAIL}`,

    "",

    COMPANY_NAME,

    TAGLINE,

  ].join("\n");
}

// ------------------------------------------------------------
// SEND BOTH EMAILS
// ------------------------------------------------------------

export async function sendLeadNotifications(lead: LeadRecord) {

  const from = resolveFromEmail();

  if (!from) {
    throw new Error(
      "RESEND_FROM_EMAIL (or legacy FROM_EMAIL) is not set in .env"
    );
  }

  const notifyList =
    resolveNotificationRecipients();

  if (notifyList.length === 0) {
    throw new Error(
      "LEAD_NOTIFICATION_EMAIL (or legacy NOTIFY_EMAILS) is empty — no business recipient configured."
    );
  }

  const businessReplyTo =
    emailAddressOf(from);

  const displayName = [
    lead.name,
    lead.company,
  ]
    .filter(Boolean)
    .join(" — ");

  const failures = [];

  let ownerEmail;
  let customerEmail;

  // ----------------------------------------------------------
  // BUSINESS / OWNER EMAIL
  // ----------------------------------------------------------

  try {

    ownerEmail = await sendEmail({

      from,

      to: notifyList,

      replyTo: String(lead.email ?? ""),

      subject:
        `New Website Enquiry — ${displayName}`,

      html:
        buildInternalHtml(lead),

      text:
        buildInternalText(lead),

    });

  } catch (error) {

    const reason =
      error instanceof Error ? error.message : String(error);

    console.error(
      `Email send failed (business notification to ${notifyList.join(", ")}):`,
      reason
    );

    failures.push(
      `business notification: ${reason}`
    );
  }

  // ----------------------------------------------------------
  // CUSTOMER CONFIRMATION EMAIL
  // ----------------------------------------------------------

  try {

    customerEmail = await sendEmail({

      from,

      to: String(lead.email ?? ""),

      replyTo: businessReplyTo,

      subject:
        "We Received Your Enquiry — Rack & Stack Storage Systems",

      html:
        buildClientHtml(lead),

      text:
        buildClientText(lead),

    });

  } catch (error) {

    const reason =
      error instanceof Error ? error.message : String(error);

    console.error(
      `Email send failed (customer confirmation to ${lead.email}):`,
      reason
    );

    failures.push(
      `customer confirmation: ${reason}`
    );
  }

  if (failures.length) {

    throw new Error(
      failures.join("; ")
    );

  }

  return {
    ownerEmail,
    customerEmail,
  };
}

/* ================================================================== *
 * WEBSITE INQUIRY ADAPTERS
 *
 * Everything above is the legacy lead path. Everything below is the
 * typed surface `src/lib/email.ts` and `/preview/emails` consume.
 *
 * These are adapters, not a second set of templates: each one maps the
 * inquiry data shape onto the lead record the shared builders above
 * already understand, and returns their output unchanged. That is what
 * keeps one design per recipient — the customer email here is the same
 * `buildClientHtml` the lead path sends, and the owner email is the same
 * `buildInternalHtml` — rather than the two drifting apart.
 * ================================================================== */

/** Everything the website inquiry templates may render. */
export type InquiryEmailData = {
  /** Display reference, e.g. `RST-2026-00124`. Owner email only. */
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
  /** Database id. Carried for callers; not rendered. */
  inquiryId?: number;
};

/** Subject line for the customer acknowledgement. */
export const CUSTOMER_SUBJECT = "We Received Your Enquiry — Rack & Stack Storage Systems";

/**
 * Preheader: the grey line an inbox shows next to the subject.
 *
 * Not decoration. The subject alone reads as a notification with nothing
 * underneath it, and this is the only text a recipient sees before deciding
 * the message is theirs. Kept in the same voice as the customer body, and
 * deliberately free of any reference number or internal detail.
 */
export const CUSTOMER_PREHEADER =
  "Thank you for contacting Rack & Stack Storage Systems.";

/**
 * Maps the inquiry record onto the lead shape the shared builders read.
 *
 * `created_at` is what `buildInternalHtml` formats as the submitted time,
 * so the owner's "Submitted" row shows the inquiry's real timestamp rather
 * than whenever the send happened to run.
 *
 * The visitor's own `message` wins over the summarised `requirement`: the
 * summary is what the API route stores, and it already has the product and
 * quantity rows folded into it. Falling back to it only when no message was
 * written keeps the owner's "Customer Message" box populated either way.
 */
function toLeadRecord(data: InquiryEmailData): LeadRecord {
  return {
    name: data.name,
    email: data.email,
    phone: data.phone ?? "",
    company: data.company ?? "",
    whatsapp: data.whatsapp ?? "",
    location: data.location ?? "",
    product: data.productName ?? "",
    service: data.serviceName ?? "",
    quantity: data.quantity ?? "",
    warehouse_size: data.warehouseSize ?? "",
    load_requirement: data.loadRequirement ?? "",
    requirement: data.requirement ?? "",
    source_page: data.sourcePage ?? "",
    reference: data.reference ?? "",
    created_at: data.receivedAt,
    message: data.message?.trim() || data.requirement?.trim() || "",
  };
}

/**
 * The customer acknowledgement.
 *
 * Renders the shared customer template, which by design carries no reference
 * number, no submitted-field list, no workflow band and no CTA — the customer
 * is confirming receipt, not being shown their own form back.
 */
export function customerConfirmationHtml(data: InquiryEmailData): string {
  return buildClientHtml(toLeadRecord(data));
}

/**
 * The owner / internal notification.
 *
 * Returns the subject alongside the HTML because `src/lib/email.ts` sends the
 * owner's mail as a separate `resend.emails.send` and needs both parts; the
 * customer branch only needs the body.
 */
export function ownerNotificationHtml(data: InquiryEmailData): { subject: string; html: string } {
  const name = (data.name ?? "").trim();
  const reference = (data.reference ?? "").trim();

  const subject = [
    "New Inquiry Received",
    name || "Website enquiry",
    reference ? `• ${reference}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return { subject, html: buildInternalHtml(toLeadRecord(data)) };
}