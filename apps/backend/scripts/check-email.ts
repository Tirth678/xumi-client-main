import "dotenv/config";
import { sendEmail } from "../src/email.js";

const recipient = process.argv[2]?.trim();
if (!recipient) {
  console.error("Usage: npm run email:check --workspace backend -- recipient@example.com");
  process.exitCode = 1;
} else {
  const result = await sendEmail(
    recipient,
    "XUMI email configuration check",
    "<p>This is a test of XUMI's Gmail SMTP integration.</p>",
    "This is a test of XUMI's Gmail SMTP integration.",
  );
  if (!result.ok) {
    console.error(`Email check failed: ${result.error}`);
    process.exitCode = 1;
  } else {
    console.log(`Gmail SMTP accepted the test (${result.id}). Check the recipient's inbox and spam folder to confirm delivery.`);
  }
}
