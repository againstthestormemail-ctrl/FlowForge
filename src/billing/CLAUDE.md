# src/billing/ — Stripe entry points (Phase 3)

- `stripe-checkout.js` — POSTs to `/api/create-checkout` with the chosen price ID and the current Supabase user; redirects to the returned Stripe Checkout URL.
- `portal.js` — POSTs to `/api/create-portal-session` and redirects the tenant admin to the Stripe Customer Portal.

No Stripe secret keys here — those live only in `/api/`. This module just kicks the user to hosted Stripe pages.
