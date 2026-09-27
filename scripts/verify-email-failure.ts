/**
 * Proves a Resend outage degrades instead of crashing.
 *
 * The enquiry form returns 201 as soon as the row is stored, so
 * `sendInquiryEmails` is the only place a mail fault can surface. These cases
 * cover the ones that matter: no configuration, and a rejected API key. Neither
 * may throw, and neither may leak the key.
 */
import "dotenv/config";
import { sendInquiryEmails } from "../src/lib/email";

const inquiry = {
  name: "Rohit Malhotra",
  company: "Malhotra Cold Storage",
  email: "rohit.malhotra@malhotracoldstorage.in",
  phone: "+91 98200 41122",
  message: "Need racking for a new cold store facility.",
};

let failures = 0;
const assert = (label: string, condition: boolean, detail = "") => {
  if (!condition) failures += 1;
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

async function main() {
  const realKey = process.env.RESEND_API_KEY;
  const realFrom = process.env.RESEND_FROM_EMAIL;
  const realTo = process.env.INQUIRY_NOTIFICATION_EMAIL;

  console.log("\n-- Resend not configured --");
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  let outcome = await sendInquiryEmails({ ...inquiry }, { inquiryId: 1 });
  assert("does not throw", true);
  assert("is classified as a configuration fault", outcome.configurationFault, outcome.errors[0]);
  assert("neither send is claimed as delivered", !outcome.notificationDelivered && !outcome.acknowledgementDelivered);
  assert("a reference is still produced", typeof outcome.reference === "string" && outcome.reference.length > 0, outcome.reference);

  console.log("\n-- API key rejected by Resend --");
  process.env.RESEND_API_KEY = "re_invalid_key_for_failure_testing_0000";
  process.env.RESEND_FROM_EMAIL = "Rack & Stack <onboarding@resend.dev>";
  process.env.INQUIRY_NOTIFICATION_EMAIL = "cavnish07@gmail.com";
  outcome = await sendInquiryEmails({ ...inquiry }, { inquiryId: 2 });
  assert("does not throw", true);
  assert("reports a failure", outcome.errors.length > 0, outcome.errors[0]?.slice(0, 120));
  assert("nothing is claimed as delivered", !outcome.notificationDelivered && !outcome.acknowledgementDelivered);
  assert("the api key is never echoed into the error text", !outcome.errors.some((e) => e.includes("re_invalid_key")));
  assert("the api key is nowhere in the serialised outcome", !JSON.stringify(outcome).includes("re_invalid_key"));
  assert("a reference is still produced", outcome.reference.length > 0, outcome.reference);

  if (realKey) process.env.RESEND_API_KEY = realKey;
  if (realFrom) process.env.RESEND_FROM_EMAIL = realFrom;
  if (realTo) process.env.INQUIRY_NOTIFICATION_EMAIL = realTo;

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error("verify-email-failure threw:", error);
  process.exitCode = 1;
});
