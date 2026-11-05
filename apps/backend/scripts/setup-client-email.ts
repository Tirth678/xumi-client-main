#!/usr/bin/env tsx
/**
 * Setup script for testing multi-client email system
 * 
 * Usage:
 *   tsx scripts/setup-client-email.ts
 */

import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";

// Load .env.local from workspace root
config({ path: resolve(process.cwd(), "../../.env.local") });

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not configured");
  return url;
};

async function setupDefaultClient() {
  const sql = neon(getDatabaseUrl());

  console.log("🔧 Setting up default client email settings...\n");

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  const emailFromName = "RoboCraft";
  const emailReplyTo = process.env.EMAIL_REPLY_TO?.trim() || "parmarjaimin150@gmail.com";

  if (!gmailUser || !gmailPassword) {
    console.error("❌ Error: GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env.local");
    process.exit(1);
  }

  try {
    // Check if default client already exists
    const existing = await sql`
      SELECT client_id FROM client_email_settings WHERE client_id = 'default' LIMIT 1
    `;

    if (existing.length > 0) {
      console.log("ℹ️  Default client already exists. Updating...\n");
      
      await sql`
        UPDATE client_email_settings SET
          smtp_user = ${gmailUser},
          smtp_password = ${gmailPassword},
          email_from_name = ${emailFromName},
          email_from_address = ${gmailUser},
          email_reply_to = ${emailReplyTo},
          is_active = true,
          updated_at = NOW()
        WHERE client_id = 'default'
      `;

      console.log("✅ Default client email settings updated!");
    } else {
      console.log("📝 Creating default client email settings...\n");
      
      await sql`
        INSERT INTO client_email_settings (
          client_id, client_name, smtp_user, smtp_password,
          email_from_name, email_from_address, email_reply_to, daily_limit
        ) VALUES (
          'default', 'RoboCraft Default', ${gmailUser}, ${gmailPassword},
          ${emailFromName}, ${gmailUser}, ${emailReplyTo}, 500
        )
      `;

      console.log("✅ Default client email settings created!");
    }

    // Assign any orphaned pre-orders to default client
    const updated = await sql`
      UPDATE preorders SET client_id = 'default' WHERE client_id IS NULL
    `;

    if (updated.length > 0) {
      console.log(`\n✅ Assigned ${updated.length} existing pre-orders to default client`);
    }

    console.log("\n📊 Current settings:");
    const settings = await sql`
      SELECT 
        client_id, client_name, smtp_user, email_from_address,
        daily_limit, emails_sent_today, is_active
      FROM client_email_settings WHERE client_id = 'default'
    `;

    console.table(settings);

    console.log("\n✨ Setup complete! Your system is ready to send emails.");
    console.log("\n💡 To add more clients, use the Admin API:");
    console.log("   POST /api/admin/client-email-settings");
    
  } catch (error) {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  }
}

setupDefaultClient();
