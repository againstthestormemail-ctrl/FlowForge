# src/tenant/ — multi-tenant resolution & theming

- `resolver.js` — pulls subdomain from `window.location.hostname` (or `?subdomain=` in dev).
- `config-loader.js` — fetches `/api/tenant-config?subdomain=...` and caches in memory.
- `branding.js` — applies CSS variable overrides (`--forge-charcoal`, `--forge-orange`, etc.) + logo swap. Runs BEFORE FlowForge HTML is injected.
- `catalog-injection.js` — sets `window.FLOWFORGE_TENANT_CONFIG.catalog_json` and monkey-patches the library-render functions inside flowforge.html to read from it instead of the hardcoded `CAT`.
