import express from "express";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

const router = express.Router();

// Schema for creating/updating client email settings
const clientEmailSettingsSchema = z.object({
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  smtpUser: z.string().email(),
  smtpPassword: z.string().min(16), // Gmail app password is 16 characters
  emailFromName: z.string().min(1).default("RoboCraft"),
  emailFromAddress: z.string().email(),
  emailReplyTo: z.string().email().optional(),
  dailyLimit: z.number().int().positive().default(500),
});

type ClientEmailSettingsInput = z.infer<typeof clientEmailSettingsSchema>;

// Middleware to get SQL connection
const getSql = () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
};

/**
 * POST /api/admin/client-email-settings
 * Create or update email settings for a client
 */
router.post("/client-email-settings", async (request, response) => {
  try {
    const parsed = clientEmailSettingsSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        error: "Invalid input",
        issues: parsed.error.flatten(),
      });
    }

    const input = parsed.data;
    const sql = getSql();

    // Check if client settings already exist
    const existing = await sql`
      SELECT id FROM client_email_settings WHERE client_id = ${input.clientId} LIMIT 1
    `;

    let result;
    if (existing.length > 0) {
      // Update existing settings
      result = await sql`
        UPDATE client_email_settings SET
          client_name = ${input.clientName},
          smtp_user = ${input.smtpUser},
          smtp_password = ${input.smtpPassword},
          email_from_name = ${input.emailFromName},
          email_from_address = ${input.emailFromAddress},
          email_reply_to = ${input.emailReplyTo || null},
          daily_limit = ${input.dailyLimit},
          updated_at = NOW()
        WHERE client_id = ${input.clientId}
        RETURNING *
      `;
    } else {
      // Insert new settings
      result = await sql`
        INSERT INTO client_email_settings (
          client_id, client_name, smtp_user, smtp_password,
          email_from_name, email_from_address, email_reply_to, daily_limit
        ) VALUES (
          ${input.clientId}, ${input.clientName}, ${input.smtpUser}, ${input.smtpPassword},
          ${input.emailFromName}, ${input.emailFromAddress}, ${input.emailReplyTo || null}, ${input.dailyLimit}
        )
        RETURNING *
      `;
    }

    // Don't return the password in the response
    const settings = result[0];
    const { smtp_password, ...safeSettings } = settings;

    return response.status(existing.length > 0 ? 200 : 201).json({
      message: existing.length > 0 ? "Email settings updated" : "Email settings created",
      settings: safeSettings,
    });
  } catch (error) {
    console.error("Error managing client email settings:", error);
    return response.status(500).json({
      error: "Failed to save email settings",
    });
  }
});

/**
 * GET /api/admin/client-email-settings/:clientId
 * Get email settings for a specific client
 */
router.get("/client-email-settings/:clientId", async (request, response) => {
  try {
    const { clientId } = request.params;
    const sql = getSql();

    const rows = await sql`
      SELECT 
        id, client_id, client_name, smtp_user, email_from_name,
        email_from_address, email_reply_to, is_active, daily_limit,
        emails_sent_today, last_reset_date, created_at, updated_at,
        last_email_sent_at
      FROM client_email_settings
      WHERE client_id = ${clientId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return response.status(404).json({
        error: "Email settings not found for this client",
      });
    }

    return response.json({ settings: rows[0] });
  } catch (error) {
    console.error("Error fetching client email settings:", error);
    return response.status(500).json({
      error: "Failed to fetch email settings",
    });
  }
});

/**
 * GET /api/admin/client-email-settings
 * List all client email settings
 */
router.get("/client-email-settings", async (request, response) => {
  try {
    const sql = getSql();

    const rows = await sql`
      SELECT 
        id, client_id, client_name, smtp_user, email_from_name,
        email_from_address, email_reply_to, is_active, daily_limit,
        emails_sent_today, last_reset_date, created_at, updated_at,
        last_email_sent_at
      FROM client_email_settings
      ORDER BY created_at DESC
    `;

    return response.json({ settings: rows });
  } catch (error) {
    console.error("Error listing client email settings:", error);
    return response.status(500).json({
      error: "Failed to list email settings",
    });
  }
});

/**
 * PATCH /api/admin/client-email-settings/:clientId/toggle
 * Enable or disable email settings for a client
 */
router.patch("/client-email-settings/:clientId/toggle", async (request, response) => {
  try {
    const { clientId } = request.params;
    const { isActive } = request.body;

    if (typeof isActive !== "boolean") {
      return response.status(400).json({
        error: "isActive must be a boolean",
      });
    }

    const sql = getSql();

    const rows = await sql`
      UPDATE client_email_settings
      SET is_active = ${isActive}, updated_at = NOW()
      WHERE client_id = ${clientId}
      RETURNING id, client_id, is_active
    `;

    if (rows.length === 0) {
      return response.status(404).json({
        error: "Email settings not found for this client",
      });
    }

    return response.json({
      message: isActive ? "Email settings enabled" : "Email settings disabled",
      settings: rows[0],
    });
  } catch (error) {
    console.error("Error toggling client email settings:", error);
    return response.status(500).json({
      error: "Failed to toggle email settings",
    });
  }
});

/**
 * DELETE /api/admin/client-email-settings/:clientId
 * Delete email settings for a client
 */
router.delete("/client-email-settings/:clientId", async (request, response) => {
  try {
    const { clientId } = request.params;
    const sql = getSql();

    const rows = await sql`
      DELETE FROM client_email_settings
      WHERE client_id = ${clientId}
      RETURNING id, client_id
    `;

    if (rows.length === 0) {
      return response.status(404).json({
        error: "Email settings not found for this client",
      });
    }

    return response.json({
      message: "Email settings deleted",
      clientId: rows[0].client_id,
    });
  } catch (error) {
    console.error("Error deleting client email settings:", error);
    return response.status(500).json({
      error: "Failed to delete email settings",
    });
  }
});

export default router;
