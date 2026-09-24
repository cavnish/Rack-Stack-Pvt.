import "dotenv/config";
import { Resend } from "resend";

const args = process.argv.slice(2);
const toIndex = args.indexOf("--to");
const recipient = toIndex !== -1 && args[toIndex + 1] ? args[toIndex + 1] : "delivered@resend.dev";

async function main() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set in .env");
  if (!process.env.RESEND_FROM_EMAIL) throw new Error("RESEND_FROM_EMAIL is not set in .env");

  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: recipient,
    subject: "Test mail | Rack & Stack",
    html: "<h2>Test mail from Rack & Stack</h2><p>If you can read this, Resend integration is working.</p><p>Rack & Stack Storage Systems Pvt. Ltd.</p>",
    replyTo: process.env.INQUIRY_NOTIFICATION_EMAIL,
  });

  if (result.error) {
    console.error("Test mail FAILED:");
    console.error(`  status:  ${result.error.statusCode ?? "n/a"}`);
    console.error(`  name:    ${result.error.name}`);
    console.error(`  message: ${result.error.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Test mail sent to ${recipient}`);
  console.log(`Email ID: ${result.data?.id}`);
  console.log("Check https://resend.com/emails to see it.");
}

main().catch((error) => {
  console.error("Test mail FAILED:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});