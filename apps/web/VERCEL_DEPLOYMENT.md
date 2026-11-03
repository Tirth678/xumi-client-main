# XUMI production deployment

The repository deploys as one Vercel project from the monorepo root. Vite builds
`apps/web` and `api/index.ts` exposes the Express API as a Vercel Function. The
root `vercel.json` keeps `/api/*` on the function and sends other routes to the SPA.

## 1. Database migration

Run `apps/backend/migrations/001_create_preorders.sql`, followed by
`apps/backend/migrations/002_preorder_customization.sql`, against
`DATABASE_URL_UNPOOLED` (the direct Neon connection), then use the pooled
`DATABASE_URL` for application traffic.

## 2. Vercel environment variables

Set these for Production and the preview environments you intend to test:

- `DATABASE_URL` — pooled Neon connection string
- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_JWKS_URL`
- `VITE_NEON_AUTH_URL` — same public Auth base URL, available at build time
- `WEB_ORIGIN` — production site origin; comma-separate additional allowed origins.
  Cross-origin browser calls are rejected unless the origin is listed here, matches this
  deployment's own Vercel URLs (automatic), or is localhost in non-production.
- `SITE_URL` — optional; public origin used to make `og:image`/`twitter:image` absolute at
  build time. Defaults to `https://$VERCEL_PROJECT_PRODUCTION_URL` on Vercel.
- `GMAIL_USER` — full Gmail or Google Workspace email address
- `GMAIL_APP_PASSWORD` — Google App Password for that account
- `EMAIL_FROM` — optional; defaults to `RoboCraft <GMAIL_USER>`; use the authenticated account or a configured Gmail send-as alias
- `EMAIL_REPLY_TO` — optional inbox for replies
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

The committed `vercel.json` also configures production basics:

- `api/index.ts` runs with `maxDuration: 60` so SMTP email sends (15s timeouts each)
  cannot hit the default function timeout on the Hobby plan.
- Hashed files under `/assets/` are cached `immutable` for one year.
- All responses carry `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS headers.
- The API itself adds per-IP rate limits (120 req/min overall, 30/min admin,
  10/min pre-order writes), rejects malformed JSON with 400, oversized bodies
  with 413, and marks every API response `Cache-Control: no-store`.

CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests, and the same build
command Vercel uses on every push to `main` and every pull request.

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

## Check Gmail SMTP email

Enable 2-Step Verification on the sending Google account and create an
[App Password](https://support.google.com/mail/answer/185833). Set `GMAIL_USER`
and `GMAIL_APP_PASSWORD` in `apps/backend/.env` locally and in Vercel for each
applicable environment. Use the App Password, not your Google account password.
Remove the previous email provider's API key and replace any old `EMAIL_FROM`.
Never commit credentials. Changes to Vercel variables need a new deployment.

The sender connects to `smtp.gmail.com:465` over TLS. `EMAIL_FROM` defaults to
`RoboCraft <GMAIL_USER>`; Gmail may rewrite other sender addresses unless they
are configured aliases. `EMAIL_REPLY_TO` can specify a separate reply inbox.
See [Nodemailer's Gmail guide](https://nodemailer.com/guides/using-gmail).

Run an explicit inbox test:

```bash
npm run email:check --workspace backend -- recipient@example.com
```

The command fails for missing credentials, SMTP rejection, connection failures,
or timeouts. A successful result confirms SMTP acceptance; check the recipient's
inbox and spam folder to confirm delivery. No email is sent without a recipient.

This configures application order/payment emails. Neon Auth's verification and
password-reset email SMTP settings are configured separately in Neon Auth.
