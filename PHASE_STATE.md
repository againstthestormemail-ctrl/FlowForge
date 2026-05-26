# FlowForge Phase State

## Current Phase: 1
## Status: In Progress
## Last Updated: 2026-05-26

---

## Phase 0 — Foundation

### Manual prerequisites (Andrew executes — Claude cannot verify)
- [ ] Review Omni Metalcraft employment contract for IP-assignment language
- [ ] Document FlowForge timeline as `LEGAL/FLOWFORGE_TIMELINE.md`
- [ ] File Michigan LLC at corp.michigan.gov (~$50, 1–3 days)
- [ ] Buy `flowforge.app` (or alternative) via Cloudflare Registrar
- [ ] Create GitHub org `flowforge-app`
- [ ] Create Supabase project `flowforge-prod`
- [ ] Create Vercel team `flowforge`
- [ ] Create Stripe account (activate in Phase 3)
- [ ] Point Cloudflare DNS at Vercel

### Code tasks (Claude executes)
- [x] GIFT-aligned folder structure (`src/`, `api/`, `admin/`, `marketing/`, `supabase/migrations/`, `scripts/`, `public/`)
- [x] Move `FlowForge.html` → `public/flowforge.html`
- [x] `package.json` with Vite + `@supabase/supabase-js`
- [x] `vite.config.js` with multi-page entries (app, admin, marketing)
- [x] `.gitignore` excluding `.env.local`, `node_modules`, `.vercel`, `dist`
- [x] `.env.example` documenting all variables from §12
- [x] Root `CLAUDE.md` per §3 (preserves legacy guide at `public/CLAUDE.md`)
- [x] Per-folder `CLAUDE.md` routers
- [x] `PHASE_STATE.md` initialized
- [x] Commit `FLOWFORGE_SAAS_IMPLEMENTATION.md` so the plan is durable in the repo

### Validation
- [x] Folder structure created
- [ ] `public/flowforge.html` opens in browser and runs as before — **verify after pulling on Windows or by `python3 -m http.server` in the cloud container**
- [x] Git repo initialized with first commit (existing repo `againstthestormemail-ctrl/flowforge` reused)
- [x] All `.env.example` variables documented

---

## Phase 1 — Auth + Cloud Save
- [x] Install Vite + Supabase deps (`npm install` → vite 5.4.21, @supabase/supabase-js 2.106.2)
- [x] Write `src/index.html` shell (auth gate + project bar + app host iframe)
- [x] Supabase client + login + session modules (`src/auth/`)
- [x] `src/main.js` boot flow (session check → login or app → iframe load → patch globals)
- [x] `cloud-save.js` overrides for `window.saveProject` / `window.loadProject`
- [x] `migration.js` for legacy `.flowforge` / `.omninapkin` localStorage
- [x] `001_initial_schema.sql` with RLS policies (ready for Supabase SQL editor)
- [x] Vite build passes (51 modules, <1s)
- [ ] `001_initial_schema.sql` applied to Supabase — **requires Supabase project credentials**
- [ ] End-to-end test: signup → save → reload → load — **requires `.env.local` with real keys**
- [ ] Deployed to Vercel preview — **requires Vercel project linked**

## Phase 2 — Multi-Tenant Catalogs (not started)
## Phase 3 — Billing / Stripe (not started)
## Phase 4 — Admin Dashboard (not started)
## Phase 5 — Go to Market (not started)

---

## Blockers / Open Questions

- **Repo location**: Plan describes a new `flowforge-saas` directory; we are scaffolding inside the existing `againstthestormemail-ctrl/flowforge` repo on branch `claude/wonderful-edison-4rMsd`. Confirmed by Andrew 2026-05-23.
- **Environment**: Claude Code on the web runs in a Linux container at `/home/user/FlowForge`, not on the Windows desktop. All work is pushed via GitHub; Andrew pulls locally to run dev server.
- **Phase 0 manual prerequisites are unverified** — Claude proceeded with scaffolding code tasks per Andrew's instruction. Manual tasks must complete before Phase 1 can be considered shippable.

## Recent Decisions
- 2026-05-23: Scaffold the SaaS structure inside the existing FlowForge repo (not a parallel directory). Translate Windows paths to relative repo paths.
- 2026-05-23: Preserve the legacy single-file-tool codebase guide at `public/CLAUDE.md`; root `CLAUDE.md` becomes the SaaS router per §3.
- 2026-05-23: `FlowForge.html` moved to `public/flowforge.html` (lowercased). Original capitalized file no longer exists at root.
- 2026-05-26: Phase 1 code written. Boot flow uses an iframe for flowforge.html (avoids global collisions). vite.config trimmed to app-only entry; admin/marketing entries re-added in their phases.
- 2026-05-26: RLS policies included inline in 001_initial_schema.sql (not a separate migration) since Phase 1's own projects table needs them immediately.
