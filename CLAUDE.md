# FlowForge SaaS — Project Root

This is the FlowForge SaaS conversion project. The canonical implementation plan lives in `FLOWFORGE_SAAS_IMPLEMENTATION.md`. Read that document first.

Current phase tracking: `PHASE_STATE.md`

## Subfolder Routing
- `src/` — Frontend application code (Vite + vanilla JS, wraps existing FlowForge.html)
- `api/` — Vercel serverless functions (Stripe webhooks, tenant config API)
- `admin/` — Internal admin dashboard (Andrew only)
- `marketing/` — Public landing page at flowforge.app
- `supabase/` — Database migrations and policies
- `public/` — Static assets including the preserved `flowforge.html` (see `public/CLAUDE.md` for that file's internals)

## Key Constraints
- Do NOT rewrite `flowforge.html` in React. It is preserved as-is.
- All new code is vanilla JS unless explicitly noted.
- Owner runs Windows + PowerShell locally; Claude Code on the web runs in a Linux container. Translate paths accordingly — work happens inside this repo and is pushed to GitHub, not to `C:\Users\agaba\Desktop\`.
- Free tiers everywhere until scale demands otherwise.

## Legacy Plan
`FLOWFORGE_BUILD_PLAN.md` documents Phases 0–19 of the single-file tool itself (compare mode, presentation mode, etc.). It is historical reference; new work follows `FLOWFORGE_SAAS_IMPLEMENTATION.md`.
