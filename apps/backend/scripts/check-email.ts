import "dotenv/config";
import { DEFAULT_EMAIL_FROM, sendEmail } from "../src/email.js";

const recipient = process.argv[2] || "delivered@resend.dev";
console.log(`Sender: ${process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM}`);
const result = await sendEmail(
  recipient,
  "XUMI email configuration check",
  "<p>This is a test of XUMI's Resend email integration.</p>",
  "This is a test of XUMI's Resend email integration.",
);
if (!result.ok) {
  console.error(`Email check failed: ${result.error}`);
  process.exitCode = 1;
} else {
  console.log(`Resend accepted the test (${result.id}). Check its delivery event in the Resend dashboard.`);
  if (recipient.endsWith("@resend.dev")) {
    console.log("This is a simulated delivery; it does not verify delivery to a real inbox.");
  }
}
