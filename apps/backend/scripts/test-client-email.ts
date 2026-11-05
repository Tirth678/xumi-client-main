#!/usr/bin/env tsx
/**
 * Test script for client email system
 * 
 * Usage:
 *   tsx scripts/test-client-email.ts <client-id> <recipient-email>
 */

import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";
import { sendEmailForClient } from "../src/clientEmail.js";

// Load .env.local from workspace root
config({ path: resolve(process.cwd(), "../../.env.local") });

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not configured");
  return url;
};

async function testEmail() {
  const clientId = process.argv[2] || "default";
  const recipientEmail = process.argv[3];

  if (!recipientEmail) {
    console.error("Usage: tsx scripts/test-client-email.ts <client-id> <recipient-email>");
    console.error("Example: tsx scripts/test-client-email.ts default john@example.com");
    process.exit(1);
  }

  const sql = neon(getDatabaseUrl());

  console.log(`\n🧪 Testing email for client: ${clientId}`);
  console.log(`📧 Sending to: ${recipientEmail}\n`);

  try {
    // Check if client settings exist
    const settings = await sql`
      SELECT client_id, client_name, smtp_user, is_active, 
             emails_sent_today, daily_limit
      FROM client_email_settings 
      WHERE client_id = ${clientId}
      LIMIT 1
    `;

    if (settings.length === 0) {
      console.error(`❌ No email settings found for client: ${clientId}`);
      console.log("\n💡 Run: tsx scripts/setup-client-email.ts");
      process.exit(1);
    }

    const client = settings[0];
    console.log("📊 Client settings:");
    console.table(client);

    if (!client.is_active) {
      console.error("\n❌ Client email settings are disabled");
      process.exit(1);
    }

    if (client.emails_sent_today >= client.daily_limit) {
      console.error(`\n⚠️  Daily limit reached: ${client.emails_sent_today}/${client.daily_limit}`);
      process.exit(1);
    }

    // Send test email
    console.log("\n📤 Sending test email...");

    const result = await sendEmailForClient(
      sql,
      clientId,
      recipientEmail,
      "Test Email from RoboCraft Pre-order System",
      `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>✅ Test Email Successful</h1>
          <p>This is a test email from the RoboCraft pre-order system.</p>
          <hr>
          <p><strong>Client ID:</strong> ${clientId}</p>
          <p><strong>Client Name:</strong> ${client.client_name}</p>
          <p><strong>Sent from:</strong> ${client.smtp_user}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            If you received this email, the multi-client email system is working correctly!
          </p>
        </body>
        </html>
      `,
      `Test Email from RoboCraft\n\nClient: ${client.client_name}\nSent from: ${client.smtp_user}`
    );

    if (result.ok) {
      console.log("\n✅ Email sent successfully!");
      console.log(`📩 Message ID: ${result.id}`);

      // Check updated counter
      const updated = await sql`
        SELECT emails_sent_today FROM client_email_settings WHERE client_id = ${clientId}
      `;
      console.log(`📊 Emails sent today: ${updated[0].emails_sent_today}`);
    } else {
      console.error("\n❌ Email failed:", result.error);
      if (result.status) {
        console.error(`   Status code: ${result.status}`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testEmail();
