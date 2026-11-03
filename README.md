# XUMI by RoboCraft

Storefront and pre-order API for **XUMI — your personal tiny desk partner**.
One Vercel project deploys the whole monorepo: a Vite React SPA plus an Express
API exposed as a Vercel Function.

## Layout

| Path | What it is |
| --- | --- |
| `apps/web` | Customer storefront (React 18, Vite, Tailwind, shadcn/ui) |
| `apps/backend` | Express API: Neon Postgres, Neon Auth (JWT), Gmail SMTP email |
| `api/index.ts` | Vercel Function adapter that mounts the Express app at `/api/*` |
| `apps/customer-frontend` | Placeholder Next.js app (not deployed) |
| `vercel.json` | Production build, routing, headers, function config |

## Develop

```bash
npm install
npm run dev            # storefront on :8080 (proxies /api to :3001)
npm run dev:backend    # API on :3001 — run in a second terminal
```

Copy `apps/backend/.env.example` to `apps/backend/.env` and fill in the values.
The storefront reads `VITE_NEON_AUTH_URL` (a public default is compiled in).

## Check

```bash
npm run typecheck      # all workspaces
npm run lint
npm run test           # vitest (web) + node:test (backend)
npm run build --workspace=web   # the exact build Vercel runs
```

CI runs all of the above on every push to `main` and every pull request.

## Deploy

See [`apps/web/VERCEL_DEPLOYMENT.md`](apps/web/VERCEL_DEPLOYMENT.md) for the
full production checklist: database migrations, environment variables, Neon
Auth setup, and the manual payment-review commands.
