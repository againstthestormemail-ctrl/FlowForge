# admin/ — internal dashboard (Phase 4)

Vanilla-JS dashboard, Andrew-only. Gated by a row in the `admins` table (see `/FLOWFORGE_SAAS_IMPLEMENTATION.md` §9.1).

- `index.html` — entry shell, mounted at `/admin`.
- `tenants.js` — list / create / edit tenants.
- `catalog-editor.js` — paste-validate-preview JSON catalog flow.
- `revenue.js` — Stripe MRR / churn / trial-conversion dashboard.
- `new-tenant.js` — onboarding form (subdomain, branding, contact, Stripe link).

Must NOT be in the production bundle for tenant subdomains. Vite build emits this as a separate entry point.
