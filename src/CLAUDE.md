# src/ — SaaS frontend wrapper

Vite-built frontend that boots into `/public/flowforge.html`. Plain JS, no React.

- `main.js` — entry. Tenant resolution → auth gate → inject FlowForge into `#app-host`.
- `auth/` — Supabase client, login UI, session helpers.
- `tenant/` — subdomain resolver, config fetcher, branding injector, catalog injection.
- `projects/` — cloud save/load, project list UI, legacy `.flowforge` migration.
- `billing/` — Stripe checkout + customer portal entry points.

The FlowForge tool is loaded as-is; behavior changes happen by monkey-patching its globals (`window.saveProject`, `window.loadProject`, library-render hooks) from these modules after the HTML is injected.
