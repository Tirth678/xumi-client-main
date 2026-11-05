import nodemailer from "nodemailer";
import { neon } from "@neondatabase/serverless";

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; status?: number };

interface ClientEmailSettings {
  id: string;
  client_id: string;
  client_name: string;
  smtp_user: string;
  smtp_password: string;
  email_from_name: string;
  email_from_address: string;
  email_reply_to: string | null;
  is_active: boolean;
  daily_limit: number;
  emails_sent_today: number;
  last_reset_date: string;
}

/**
 * Get email settings for a specific client
 */
async function getClientEmailSettings(
  sql: any,
  clientId: string
): Promise<ClientEmailSettings | null> {
  const rows = (await sql`
    SELECT * FROM client_email_settings 
    WHERE client_id = ${clientId} AND is_active = true
    LIMIT 1
  `) as ClientEmailSettings[];
  return rows[0] || null;
}

/**
 * Check if client has exceeded their daily email limit
 */
function hasExceededDailyLimit(settings: ClientEmailSettings): boolean {
  return settings.emails_sent_today >= settings.daily_limit;
}

/**
 * Increment the email counter for a client
 */
async function incrementEmailCounter(
  sql: any,
  clientId: string
): Promise<void> {
  await sql`
    UPDATE client_email_settings 
    SET 
      emails_sent_today = emails_sent_today + 1,
      last_email_sent_at = NOW(),
      updated_at = NOW()
    WHERE client_id = ${clientId}
  ` as any;
}

/**
 * Send email using a specific client's Gmail SMTP settings
 */
export async function sendEmailForClient(
  sql: any, // Accept any Neon SQL function type
  clientId: string,
  to: string | string[],
  subject: string,
  html: string,
  text?: string
): Promise<EmailResult> {
  // Get client's email settings from database
  const settings = await getClientEmailSettings(sql, clientId);

  if (!settings) {
    const error = `No active email settings found for client: ${clientId}`;
    console.error(error);
    return { ok: false, error, status: 404 };
  }

  // Check daily limit
  if (hasExceededDailyLimit(settings)) {
    const error = `Daily email limit (${settings.daily_limit}) exceeded for client: ${clientId}`;
    console.error(error);
    return { ok: false, error, status: 429 };
  }

  // Validate credentials
  const user = settings.smtp_user?.trim();
  const pass = settings.smtp_password?.replace(/\s/g, "");

  if (!user || !pass) {
    const error = `Invalid SMTP credentials for client: ${clientId}`;
    console.error(error);
    return { ok: false, error, status: 500 };
  }

  try {
    // Create transporter with client's Gmail credentials
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 15_000,
    });

    // Send email
    const result = await transport.sendMail({
      from: {
        name: settings.email_from_name,
        address: settings.email_from_address,
      },
      replyTo: settings.email_reply_to || undefined,
      to,
      subject,
      html,
      text,
    });

    // Check if email was accepted
    if (!result.messageId || !result.accepted?.length || result.rejected?.length) {
      const error = `Gmail SMTP did not accept all recipients for client: ${clientId}`;
      console.error(error);
      return { ok: false, error };
    }

    // Increment counter for successful send
    await incrementEmailCounter(sql, clientId);

    console.info(
      `Email sent successfully for client ${clientId}: ${result.messageId}`
    );
    return { ok: true, id: result.messageId };
  } catch (err) {
    const error = `Gmail SMTP submission failed for client ${clientId}: ${
      err instanceof Error ? err.message : "Unknown error"
    }`;
    console.error(error, err);
    return { ok: false, error };
  }
}

/**
 * Send email using global/fallback Gmail SMTP settings from environment
 * This is the original implementation for backward compatibility
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  text?: string
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
      to,
      subject,
      html,
      text,
    });

    if (!result.messageId || !result.accepted?.length || result.rejected?.length) {
      const error = "Gmail SMTP did not accept all recipients";
      console.error(error);
      return { ok: false, error };
    }

    console.info(`Email accepted by Gmail SMTP: ${result.messageId}`);
    return { ok: true, id: result.messageId };
  } catch {
    const error =
      "Gmail SMTP submission failed; check credentials, recipients, and connectivity";
    console.error(error);
    return { ok: false, error };
  }
}
