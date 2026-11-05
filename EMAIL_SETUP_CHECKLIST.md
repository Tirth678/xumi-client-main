# ✅ Gmail SMTP Setup Checklist for parmarjaimin150@gmail.com

## Quick Setup Steps

### [ ] 1. Enable 2-Factor Authentication
- Go to: https://myaccount.google.com/security
- Enable "2-Step Verification"
- Use phone number or authenticator app

### [ ] 2. Generate App Password
- Go to: https://myaccount.google.com/apppasswords
- Select: Mail → Other (Custom name) → "RoboCraft Pre-orders"
- Click Generate
- **Copy the 16-character password** (shown once!)
- Remove all spaces: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

### [ ] 3. Update .env.local
Open `.env.local` and set:
```bash
GMAIL_APP_PASSWORD=your-16-char-password-here
```

Current configuration:
- ✅ `GMAIL_USER=parmarjaimin150@gmail.com`
- ⏳ `GMAIL_APP_PASSWORD=get-from-client-or-setup-below` ← Update this!
- ✅ `EMAIL_FROM="RoboCraft <parmarjaimin150@gmail.com>"`
- ✅ `EMAIL_REPLY_TO=parmarjaimin150@gmail.com`
- ✅ `ADMIN_EMAIL=parmarjaimin150@gmail.com`

### [ ] 4. Apply Database Migration
```bash
psql $DATABASE_URL -f apps/backend/migrations/003_add_client_email_settings.sql
```

### [ ] 5. Setup Default Client
```bash
cd apps/backend
tsx scripts/setup-client-email.ts
```

### [ ] 6. Test Email Sending
```bash
cd apps/backend
tsx scripts/test-client-email.ts default your-email@example.com
```

### [ ] 7. Restart Backend Server
```bash
cd apps/backend
npm run dev
```

### [ ] 8. Create Test Pre-order
- Use your application to create a test pre-order
- Check customer email inbox (and spam folder)
- Verify email is from: parmarjaimin150@gmail.com

---

## Quick Reference

**Gmail Account:** parmarjaimin150@gmail.com  
**Daily Limit:** 500 emails per day  
**Emails From:** RoboCraft <parmarjaimin150@gmail.com>  
**Reply To:** parmarjaimin150@gmail.com

---

## Email Content (What Customers Receive)

✅ Customer name  
✅ Product name (XUMI)  
✅ Number of units  
✅ Unit price (₹3,999)  
✅ Total amount (including transportation)  
✅ **15-day payment deadline**  
✅ Order ID  
✅ Delivery address  
✅ What happens next (production → testing → shipping)

---

## Troubleshooting

**App Passwords option not visible?**
- Enable 2FA and wait 5-10 minutes
- Sign out and back in
- Try incognito mode

**"Invalid credentials" error?**
- Check: 16 characters, no spaces
- Use App Password, NOT regular Gmail password
- Generate a new one if needed

**Emails going to spam?**
- Normal for first few emails
- Mark as "Not Spam"
- Add to contacts
- Improves after a few successful deliveries

**"Daily limit exceeded"?**
- Counter resets at midnight
- Check usage: `tsx scripts/test-client-email.ts default --status`
- Consider Google Workspace (2,000/day) for scale

---

## Files Created

```
apps/backend/
├── migrations/
│   └── 003_add_client_email_settings.sql
├── src/
│   ├── clientEmail.ts
│   └── clientEmailRoutes.ts
└── scripts/
    ├── setup-client-email.ts
    └── test-client-email.ts

.env.local (updated)
GMAIL_SMTP_SETUP.md
EMAIL_SETUP_CHECKLIST.md (this file)
```

---

## Status: ⏳ Waiting for App Password

Once you add the App Password to `.env.local`, you're ready to go! 🚀
