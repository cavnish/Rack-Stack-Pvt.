/**
 * `npm run mail:check` — diagnoses the Resend configuration without sending
 * anything to a customer.
 *
 * The enquiry form itself cannot report mail problems: it returns 201 as soon
 * as the inquiry is stored, because a mail outage must not discard a lead. That
 * makes "is enquiry email actually working?" unanswerable from the browser,
 * which is exactly how an unverified sender can sit unnoticed while the website
 * looks perfectly healthy.
 *
 * This script answers that question directly, and separates the two states that
 * are easy to confuse:
 *   - a Resend test sender (onboarding@resend.dev), which reaches only the
 *     account owner's inbox, versus
 *   - a verified domain sender, which reaches everyone.
 *
 * It reads the same environment variables the server does, and never prints the
 * API key — only its presence and length.
 */
import "dotenv/config";
import { Resend } from "resend";

type Check = { label: string; ok: boolean; detail: string; fatal: boolean };

const checks: Check[] = [];
const add = (label: string, ok: boolean, detail: string, fatal = true) => {
  checks.push({ label, ok, detail, fatal });
};

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.RESEND_FROM_EMAIL?.trim();
const recipient = process.env.INQUIRY_NOTIFICATION_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim();
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

add("RESEND_API_KEY is set", Boolean(apiKey), apiKey ? `present (${apiKey.length} chars)` : "missing — set it in .env");
add("RESEND_FROM_EMAIL is set", Boolean(from), from ?? "missing — set it in .env");
add(
  "INQUIRY_NOTIFICATION_EMAIL is set",
  Boolean(recipient),
  recipient ?? "missing — enquiries would fall back to info@rackandstack.in",
);
add(
  "NEXT_PUBLIC_SITE_URL is set",
  Boolean(siteUrl),
  siteUrl ?? "missing — the notification email will omit its admin links",
);

const fromAddress = from?.match(/<([^>]+)>/)?.[1] ?? from;
const isTestSender = Boolean(fromAddress && /@resend\.dev$/i.test(fromAddress));
add(
  "RESEND_FROM_EMAIL is not a Resend test sender",
  !isTestSender,
  isTestSender
    ? `${fromAddress} only delivers to the Resend account owner's own inbox. Customer acknowledgements will fail with a 403.`
    : `${fromAddress ?? "n/a"} looks like a domain sender.`,
  // Not fatal for the team notification, but it does mean the customer copy
  // cannot be delivered, so it is reported as a non-fatal failure.
  isTestSender,
);

async function probeSend() {
  if (!apiKey || !from) {
    report();
    return;
  }

  const resend = new Resend(apiKey);
  const target = recipient ?? "delivered@resend.dev";
  const probe = isTestSender ? target : "delivered@resend.dev";

  console.log(`\nSending a probe message to ${probe}…\n`);
  const result = await resend.emails.send({
    from,
    to: probe,
    subject: "Configuration check | Rack & Stack",
    html: "<p>Automated Resend configuration check for the Rack & Stack enquiry form. No action is needed.</p>",
    replyTo: recipient,
  });

  if (result.error) {
    add(
      "Resend accepted a test send",
      false,
      `status ${result.error.statusCode ?? "n/a"} / ${result.error.name}: ${result.error.message}`,
    );
  } else {
    add("Resend accepted a test send", true, `accepted, message id ${result.data?.id ?? "unknown"}`);
    if (!isTestSender) {
      add(
        "Probe was delivered to the Resend catch-all",
        true,
        "delivered@resend.dev received it, so mail from this sender is not blocked.",
      );
    }
  }
  report();
}

probeSend().catch((error) => {
  add("Reached the Resend API", false, error instanceof Error ? error.message : String(error));
  report();
});

function report() {
  console.log("\nRack & Stack — Resend configuration check\n");
  for (const check of checks) {
    const mark = check.ok ? "PASS" : check.fatal ? "FAIL" : "WARN";
    console.log(`  [${mark}] ${check.label}`);
    console.log(`         ${check.detail}`);
  }

  const failed = checks.filter((check) => !check.ok);
  console.log("");
  if (failed.length === 0) {
    console.log("Resend is configured correctly. Enquiry notifications and customer");
    console.log("acknowledgements should both be delivered.\n");
    return;
  }

  console.log("Action required:\n");
  for (const check of failed) {
    if (/test sender/i.test(check.label)) {
      console.log("  1. Verify a sending domain at https://resend.com/domains");
      console.log("     (add the DNS records it gives you to your domain provider), then set");
      console.log("     RESEND_FROM_EMAIL to an address on that domain, e.g.");
      console.log('     RESEND_FROM_EMAIL="Rack & Stack <enquiries@yourdomain.com>"');
      console.log("     Until then only the Resend account owner can receive enquiry email.");
    } else if (/RESEND_API_KEY/.test(check.label)) {
      console.log("  - Create a sending API key at https://resend.com/api-keys and set RESEND_API_KEY.");
    } else if (/RESEND_FROM_EMAIL/.test(check.label)) {
      console.log('  - Set RESEND_FROM_EMAIL, e.g. "Rack & Stack <enquiries@yourdomain.com>".');
    } else if (/INQUIRY_NOTIFICATION_EMAIL/.test(check.label)) {
      console.log("  - Set INQUIRY_NOTIFICATION_EMAIL to the inbox that should receive enquiries.");
    } else if (/NEXT_PUBLIC_SITE_URL/.test(check.label)) {
      console.log("  - Set NEXT_PUBLIC_SITE_URL so the notification email can link back to the admin.");
    } else {
      console.log(`  - ${check.label}: ${check.detail}`);
    }
  }
  console.log("");

  process.exitCode = 1;
}
