# api/ — Vercel serverless functions

Node-based handlers (`export default function handler(req, res)`). Run on the Vercel edge/serverless runtime.

- `tenant-config.js` — `GET /api/tenant-config?subdomain=...` → branding + catalog JSON. Returns 403 if subscription inactive. Caches at the edge for 60s.
- `stripe-webhook.js` — `POST /api/stripe-webhook`. Verifies signature, updates `tenants.subscription_status` + `active`.
- `create-checkout.js` — `POST /api/create-checkout`. Creates a Stripe Checkout session with 14-day trial.
- `admin/create-tenant.js` — provisions a new tenant row + initial Stripe customer.
- `admin/upload-catalog.js` — validates + saves a tenant's catalog JSON.

Use `SUPABASE_SERVICE_ROLE_KEY` here ONLY (server-side). Never import this folder into `/src/`.
