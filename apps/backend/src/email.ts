export const DEFAULT_EMAIL_FROM = "RoboCraft <onboarding@resend.dev>";

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; status?: number };

export async function sendEmail(
  to: string | string[], subject: string, html: string, text?: string,
): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    const error = "RESEND_API_KEY is not configured";
    console.error(error);
    return { ok: false, error };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM,
        reply_to: process.env.EMAIL_REPLY_TO?.trim() || undefined,
        to: Array.isArray(to) ? to : [to], subject, html, text,
      }),
    });
    const body = await response.json() as { id?: string; message?: string };
    if (!response.ok || !body.id) {
      const error = body.message || "Resend did not return an email ID";
      console.error(`Email submission failed (${response.status}): ${error}`);
      return { ok: false, error, status: response.status };
    }
    console.info(`Email accepted by Resend: ${body.id}`);
    return { ok: true, id: body.id };
  } catch {
    const error = "Resend request failed or timed out";
    console.error(error);
    return { ok: false, error };
  }
}
