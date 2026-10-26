# XUMI production deployment

The repository deploys as one Vercel project from the monorepo root. Vite builds
`apps/web` and `api/index.ts` exposes the Express API as a Vercel Function. The
root `vercel.json` keeps `/api/*` on the function and sends other routes to the SPA.

## 1. Database migration

Run `apps/backend/migrations/001_create_preorders.sql` against
`DATABASE_URL_UNPOOLED` (the direct Neon connection), then use the pooled
`DATABASE_URL` for application traffic.

## 2. Vercel environment variables

Set these for Production and the preview environments you intend to test:

- `DATABASE_URL` — pooled Neon connection string
- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_JWKS_URL`
- `VITE_NEON_AUTH_URL` — same public Auth base URL, available at build time
- `WEB_ORIGIN` — production site origin; comma-separate additional allowed origins
- `RESEND_API_KEY`
- `EMAIL_FROM` — sender on a verified Resend domain
- `ADMIN_EMAIL` — inbox notified for every new pre-order
- `ADMIN_API_KEY` — long random secret used only by the manual admin commands
- `PAYMENT_URL` — optional default hosted payment link

Keep `VITE_BACKEND_URL` unset on Vercel because the API is same-origin.

## 3. Neon Auth production configuration

In the production Neon branch:

1. Add the exact Vercel/custom production origin as a trusted domain (no trailing slash).
2. Configure your own Google OAuth client. Its redirect URI is
   `{NEON_AUTH_BASE_URL}/callback/google`.
3. Configure custom SMTP, enable email verification, set the application name,
   and disable localhost access when local production testing is finished.

## 4. Deploy

Import the repository in Vercel and keep **Root Directory** at the repository
root. Vercel uses the committed `vercel.json`; no separate backend project is
required. Deploy a Preview first and verify `/api/health`, sign-up, both sign-in
methods, pre-order creation, all three emails, and the manual payment flow.

## Manual review and payment confirmation

Use the production origin and never put `ADMIN_API_KEY` in frontend code:

```bash
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  https://your-domain.example/api/admin/preorders

curl -X POST -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"paymentUrl":"https://payments.example/checkout"}' \
  https://your-domain.example/api/admin/preorders/XM-ORDER/request-payment

curl -X POST -H "Authorization: Bearer $ADMIN_API_KEY" \
  https://your-domain.example/api/admin/preorders/XM-ORDER/confirm-payment
```

The payment request starts the 15-day booking window and emails the order
details, amount, and payment URL. After payment is manually verified, the last
command records the payment and sends the confirmation email.
