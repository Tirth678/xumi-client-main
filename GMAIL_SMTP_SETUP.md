# Gmail SMTP Setup Guide

## Overview
The pre-order system uses Gmail SMTP via `nodemailer` to send confirmation emails to customers after they place an order.

## What Gets Sent
When a customer confirms a pre-order, they receive an email containing:
- ✅ Customer name
- ✅ Product name (XUMI)
- ✅ Number of units (quantity)
- ✅ Unit price
- ✅ Total amount (including any transportation charges)
- ✅ 15-day payment deadline
- ✅ Order ID
- ✅ Address details
- ✅ Payment instructions

**Note:** The QR code for payment will be sent in a subsequent email when the admin requests payment using the `/api/admin/preorders/:id/request-payment` endpoint.

## Gmail SMTP Configuration

### Step 1: Enable 2-Factor Authentication on Gmail
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** (required for App Passwords)

### Step 2: Generate an App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "RoboCraft Pre-orders" or any descriptive name
5. Click **Generate**
6. Copy the 16-character password (shown in yellow)

### Step 3: Update Environment Variables
Open `.env.local` and update these values:

```bash
# Gmail SMTP Configuration
GMAIL_USER=your-actual-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop  # 16-character app password (no spaces)
EMAIL_FROM="RoboCraft <your-actual-email@gmail.com>"
EMAIL_REPLY_TO=parmarjaimin150@gmail.com
ADMIN_EMAIL=admin@robocraft.com
```

**Important:**
- `GMAIL_USER`: Your Gmail address
- `GMAIL_APP_PASSWORD`: The 16-character app password (remove all spaces)
- `EMAIL_FROM`: Display name and email address for outgoing emails
- `EMAIL_REPLY_TO`: Email address for customer replies
- `ADMIN_EMAIL`: Admin will receive a copy of each pre-order

### Step 4: Test the Email Configuration
Run the email check script:

```bash
cd apps/backend
npm run email:check
```

Or test manually by creating a pre-order through the API.

## Email Flow

### 1. Pre-order Confirmation Email (Automatic)
**Trigger:** When customer submits pre-order via `/api/preorders`
**Recipients:** 
- Customer (at their registered email)
- Admin (copy)

**Content:**
- Order confirmation
- Customer details
- Product details (name, quantity, price)
- Total amount
- 15-day payment deadline
- What happens next (production, testing, shipping)

### 2. Payment Request Email (Manual - Admin Action)
**Trigger:** Admin calls `/api/admin/preorders/:id/request-payment`
**Recipient:** Customer only

**Content:**
- Payment URL/QR code
- Order details
- Payment deadline reminder

### 3. Payment Confirmation Email (Manual - Admin Action)
**Trigger:** Admin calls `/api/admin/preorders/:id/confirm-payment`
**Recipient:** Customer only

**Content:**
- Payment confirmed
- Order confirmed
- Shipping timeline

## Troubleshooting

### Error: "GMAIL_USER and GMAIL_APP_PASSWORD must be configured"
- Ensure both environment variables are set in `.env.local`
- Restart the backend server after updating env vars

### Error: "Gmail SMTP submission failed"
**Possible causes:**
1. **Wrong credentials**: Double-check Gmail user and app password
2. **2FA not enabled**: App passwords require 2-Step Verification
3. **Network issues**: Check firewall/proxy settings
4. **Gmail daily limits**: Free Gmail accounts have sending limits (500/day)

### Error: "Gmail SMTP did not accept all recipients"
- Verify the recipient email address is valid
- Check if Gmail is blocking the email (spam filters)

## Security Best Practices

1. **Never commit credentials**: `.env.local` is in `.gitignore`
2. **Use App Passwords**: Never use your actual Gmail password
3. **Rotate credentials**: Generate new app passwords periodically
4. **Monitor usage**: Check Gmail's "Sent" folder for anomalies
5. **Rate limiting**: Consider implementing rate limits for email sending

## Gmail Sending Limits

| Account Type | Limit |
|--------------|-------|
| Free Gmail   | 500 emails/day |
| Google Workspace | 2,000 emails/day |

If you exceed these limits, consider:
- Upgrading to Google Workspace
- Using a dedicated email service (SendGrid, AWS SES, Mailgun)
- Implementing email queuing

## Alternative: Production Email Services

For production, consider more robust solutions:
- **SendGrid**: 100 free emails/day, then paid
- **AWS SES**: $0.10 per 1,000 emails
- **Mailgun**: 5,000 free emails/month
- **Resend**: Modern, developer-friendly API

## Implementation Details

### Current Files
- `apps/backend/src/email.ts` - Gmail SMTP transport configuration
- `apps/backend/src/orderEmail.ts` - Email template generator
- `apps/backend/src/app.ts` - API routes that trigger emails

### Email Template
The system uses responsive HTML email templates with:
- Mobile-friendly design
- Plain text fallback
- Proper character escaping
- Indian timezone (Asia/Kolkata)
- INR currency formatting

### Error Handling
- Emails are sent asynchronously
- Pre-order is saved even if email fails
- Failure is logged to console
- `confirmationEmailStatus` returned in API response

## Next Steps

After setting up Gmail SMTP:
1. Test with a real pre-order
2. Check spam folder (first emails might land there)
3. Ask Gmail users to whitelist your email
4. Monitor Gmail's "Sent" folder
5. Consider production email service for scale
