import nodemailer from "nodemailer";

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; status?: number };

export async function sendEmail(
  to: string | string[], subject: string, html: string, text?: string,
): Promise<EmailResult> {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !pass) {
    const error = "GMAIL_USER and GMAIL_APP_PASSWORD must be configured";
    console.error(error);
    return { ok: false, error };
  }
  try {
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 15_000,
    });
    const result = await transport.sendMail({
      from: process.env.EMAIL_FROM?.trim() || { name: "RoboCraft", address: user },
      replyTo: process.env.EMAIL_REPLY_TO?.trim() || undefined,
      to, subject, html, text,
    });
    if (!result.messageId || !result.accepted?.length || result.rejected?.length) {
      const error = "Gmail SMTP did not accept all recipients";
      console.error(error);
      return { ok: false, error };
    }
    console.info(`Email accepted by Gmail SMTP: ${result.messageId}`);
    return { ok: true, id: result.messageId };
  } catch {
    const error = "Gmail SMTP submission failed; check credentials, recipients, and connectivity";
    console.error(error);
    return { ok: false, error };
  }
}
