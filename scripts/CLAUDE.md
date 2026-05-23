# scripts/ — operator helpers

- `onboard-tenant.ps1` — PowerShell script (runs on Andrew's Windows box) that takes a tenant name + subdomain + initial catalog file and provisions: Supabase row, Stripe customer, Vercel domain alias, confirmation email.
- `onboard-tenant.sh` — bash equivalent for the cloud container, kept in parity.

Both scripts call the same `/api/admin/create-tenant` endpoint so the provisioning logic lives in one place.
