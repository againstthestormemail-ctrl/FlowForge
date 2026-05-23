# FlowForge SaaS — Claude Code Implementation Guide

> **Purpose:** This document is the authoritative router and execution plan for converting `FlowForge.html` (single-file conveyor layout tool) into a multi-tenant SaaS. It is designed to be consumed by Claude Code as persistent project context.
>
> **Read order for Claude Code agents:**
> 1. This file (top → bottom) on session start
> 2. The current `PHASE_STATE.md` in the project root to know what's done
> 3. The phase-specific section below for the current phase
>
> **Owner:** Andrew Gaba
> **Environment:** Windows 11, PowerShell, Claude Code CLI
> **Base codebase:** `FlowForge.html` (~8,890 lines, production-quality)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Repository Structure (GIFT-Aligned)](#3-repository-structure-gift-aligned)
4. [Trigger Phrases & Phase Gates](#4-trigger-phrases--phase-gates)
5. [Phase 0 — Foundation](#5-phase-0--foundation)
6. [Phase 1 — Auth + Cloud Save](#6-phase-1--auth--cloud-save)
7. [Phase 2 — Multi-Tenant Catalogs](#7-phase-2--multi-tenant-catalogs)
8. [Phase 3 — Billing (Stripe)](#8-phase-3--billing-stripe)
9. [Phase 4 — Admin Dashboard](#9-phase-4--admin-dashboard)
10. [Phase 5 — Go to Market](#10-phase-5--go-to-market)
11. [Database Schema (Reference)](#11-database-schema-reference)
12. [Environment Variables](#12-environment-variables)
13. [Validation Checklist Per Phase](#13-validation-checklist-per-phase)
14. [Open Decisions Log](#14-open-decisions-log)
15. [Claude Code Operating Notes](#15-claude-code-operating-notes)

---

## 1. Project Overview

### Business Context
FlowForge is a browser-based conveyor system layout and quoting tool. The first deployed instance was reskinned as **OmniNapkin** for Omni Metalcraft. The SaaS conversion productizes the underlying engine and sells it as a multi-tenant platform to other industrial distributors.

### Revenue Model
- **White-label retainer:** $249–499/month per client (each tenant gets their own subdomain, catalog, branding)
- **Future self-serve tier:** $99–149/month per seat (Phase 6+, not in this guide)

### Success Criteria
| Milestone | Target Date | Definition of Done |
|---|---|---|
| Phase 0 complete | End of Week 1 | LLC filed, domain owned, IP cleared, repo initialized |
| Phase 1 complete | End of Week 4 | Logged-in user can save/load a layout to/from Supabase |
| Phase 2 complete | End of Week 6 | Two test tenants load distinct catalogs at distinct subdomains |
| Phase 3 complete | End of Week 7 | Stripe webhook gates tenant access on subscription status |
| Phase 4 complete | End of Week 8 | Admin can onboard a new tenant in under 30 minutes |
| Phase 5 complete | End of Week 10 | Landing page live + first paid client invoiced |

---

## 2. Architecture & Tech Stack

### Definitive Stack Choices

| Layer | Tool | Why |
|---|---|---|
| Build wrapper | Vite | Minimal config, fast HMR, keeps existing vanilla JS intact |
| Frontend | FlowForge HTML/JS (preserved) | Do NOT rewrite to React. The existing code is production-quality. |
| Auth | Supabase Auth | Email/password + magic link, generous free tier |
| Database | Supabase Postgres | Same project as auth, free tier handles 500MB |
| File storage | Supabase Storage | For exported PDFs, project thumbnails |
| Hosting | Vercel | Free tier + automatic subdomain routing via wildcard DNS |
| Domain & DNS | Cloudflare Registrar | Cheapest renewals, free wildcard SSL |
| Billing | Stripe | Subscriptions, trials, customer portal — all hosted |
| Edge functions | Vercel Serverless Functions (Node) | For Stripe webhooks, tenant provisioning |

### What This Stack Avoids

- **No React migration.** The existing FlowForge code is a single HTML file with vanilla JS. Wrapping it in Vite is enough. Do NOT propose React/Next.js conversions — they add weeks of risk for zero customer-visible benefit.
- **No TypeScript (yet).** Plain JS. Can migrate later.
- **No custom backend.** Supabase + Vercel functions cover everything until ~1000 users.
- **No Kubernetes, no Docker.** Vercel handles deployment.

### Multi-Tenancy Model

**Subdomain-per-tenant:** `acme.flowforge.app`, `bigboxconveyor.flowforge.app`, etc.
- Vercel wildcard DNS captures all `*.flowforge.app` requests
- A small router function reads the subdomain, looks up the tenant, returns the appropriate config
- The FlowForge app reads tenant config on startup and applies branding + catalog

**Row-level security in Supabase** enforces that user A from tenant X cannot access user B's projects from tenant Y.

---

## 3. Repository Structure (GIFT-Aligned)

This project uses your GIFT framework. The repo follows the two-layer model: durable file tree + semantic CLAUDE.md routers.

```
C:\Users\agaba\Desktop\flowforge-saas\
├── CLAUDE.md                          # Root router — points Claude Code to this guide
├── FLOWFORGE_SAAS_IMPLEMENTATION.md   # This document
├── PHASE_STATE.md                     # Living document — current phase, completed tasks
├── .env.local                         # NOT committed — secrets
├── .env.example                       # Committed — template for required env vars
├── .gitignore
├── package.json
├── vite.config.js
├── vercel.json                        # Vercel deployment config (subdomain rewrites)
│
├── public/
│   └── flowforge.html                 # The existing 8,890-line app (renamed for clarity)
│
├── src/
│   ├── CLAUDE.md                      # Router: "What lives in src/?"
│   ├── main.js                        # Entry point — auth check, tenant resolution, app boot
│   ├── auth/
│   │   ├── CLAUDE.md
│   │   ├── supabase-client.js         # Supabase init
│   │   ├── login.js                   # Login/signup UI logic
│   │   └── session.js                 # Session management
│   ├── tenant/
│   │   ├── CLAUDE.md
│   │   ├── resolver.js                # Subdomain → tenant_id lookup
│   │   ├── config-loader.js           # Loads branding + catalog for tenant
│   │   └── branding.js                # Applies CSS variables, logo
│   ├── projects/
│   │   ├── CLAUDE.md
│   │   ├── cloud-save.js              # Save/load to Supabase
│   │   ├── project-list.js            # User's project library UI
│   │   └── migration.js               # Maps old .flowforge file format → DB row
│   └── billing/
│       ├── CLAUDE.md
│       ├── stripe-checkout.js         # Initiates checkout
│       └── portal.js                  # Customer portal link
│
├── api/                               # Vercel serverless functions
│   ├── tenant-config.js               # GET /api/tenant-config?subdomain=acme
│   ├── stripe-webhook.js              # POST /api/stripe-webhook
│   ├── create-checkout.js             # POST /api/create-checkout
│   └── admin/
│       ├── create-tenant.js           # POST /api/admin/create-tenant
│       └── upload-catalog.js          # POST /api/admin/upload-catalog
│
├── admin/
│   ├── CLAUDE.md
│   ├── index.html                     # Admin dashboard (only Andrew accesses)
│   ├── tenants.js                     # Tenant management UI
│   ├── catalog-editor.js              # Paste catalog JSON, preview, save
│   └── revenue.js                     # Stripe MRR dashboard
│
├── marketing/
│   ├── CLAUDE.md
│   ├── index.html                     # Landing page at flowforge.app
│   ├── pricing.html
│   └── case-study-omninapkin.html
│
├── supabase/
│   ├── CLAUDE.md
│   ├── migrations/                    # SQL migration files
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_tenant_seed.sql
│   └── seed.sql                       # Test data
│
└── scripts/
    ├── CLAUDE.md
    └── onboard-tenant.ps1             # PowerShell helper to provision a new tenant
```

### Root `CLAUDE.md` Content

The root `CLAUDE.md` must contain exactly:

```markdown
# FlowForge SaaS — Project Root

This is the FlowForge SaaS conversion project. The canonical implementation plan lives in `FLOWFORGE_SAAS_IMPLEMENTATION.md`. Read that document first.

Current phase tracking: `PHASE_STATE.md`

## Subfolder Routing
- `src/` — Frontend application code (Vite + vanilla JS, wraps existing FlowForge.html)
- `api/` — Vercel serverless functions (Stripe webhooks, tenant config API)
- `admin/` — Internal admin dashboard (Andrew only)
- `marketing/` — Public landing page at flowforge.app
- `supabase/` — Database migrations and policies
- `public/` — Static assets including the preserved FlowForge.html

## Key Constraints
- Do NOT rewrite FlowForge.html in React. It is preserved as-is.
- All new code is vanilla JS unless explicitly noted.
- Windows + PowerShell environment. Use PowerShell-compatible commands.
- Free tiers everywhere until scale demands otherwise.
```

---

## 4. Trigger Phrases & Phase Gates

Use these exact phrases in Claude Code sessions to scope the work clearly.

| Trigger Phrase | What Claude Code Should Do |
|---|---|
| `proceed with FlowForge phase 0` | Execute Phase 0 foundation tasks, update PHASE_STATE.md |
| `proceed with FlowForge phase 1` | Execute Phase 1 auth + cloud save |
| `proceed with FlowForge phase 2` | Execute Phase 2 multi-tenant catalogs |
| `proceed with FlowForge phase 3` | Execute Phase 3 Stripe billing |
| `proceed with FlowForge phase 4` | Execute Phase 4 admin dashboard |
| `proceed with FlowForge phase 5` | Execute Phase 5 marketing + first client |
| `flowforge status check` | Read PHASE_STATE.md, summarize current state, recommend next action |
| `flowforge tenant onboard <name>` | Run the new-tenant provisioning workflow |

**Gate rule:** Claude Code must not start a new phase until the previous phase's validation checklist is complete (see [Section 13](#13-validation-checklist-per-phase)).

---

## 5. Phase 0 — Foundation

**Duration:** Week 1
**Outcome:** Legal + technical foundation in place. No code yet.

### 5.1 Tasks (Manual — Andrew Executes)

These are NOT Claude Code tasks. They are prerequisites Andrew completes himself.

- [ ] **Review Omni Metalcraft employment contract** for IP assignment language. Look for clauses like "work product," "inventions," "during the course of employment." If broad assignment exists, consult an attorney before proceeding.
- [ ] **Document FlowForge timeline:** Save evidence (file timestamps, git history, email mentions) showing FlowForge predates the OmniNapkin engagement. Store as `LEGAL/FLOWFORGE_TIMELINE.md`.
- [ ] **File Michigan LLC** at corp.michigan.gov. Name suggestion: "FlowForge Software LLC" or "Gaba Industrial Software LLC." Cost: ~$50, processing time 1–3 days.
- [ ] **Buy domain** `flowforge.app` (or alternative `.io`/`.dev`) via Cloudflare Registrar. Cost: ~$15–20/year.
- [ ] **Create accounts:**
  - GitHub org: `flowforge-app`
  - Supabase project: `flowforge-prod`
  - Vercel team: `flowforge`
  - Stripe account (defer activation until Phase 3)
  - Cloudflare account with domain pointed at it

### 5.2 Tasks (Claude Code Executes)

When Andrew confirms the manual tasks are done and types `proceed with FlowForge phase 0`:

```powershell
# Initialize the repo structure
cd C:\Users\agaba\Desktop\
mkdir flowforge-saas
cd flowforge-saas
git init
```

Then Claude Code should:

1. **Create the GIFT-aligned folder structure** exactly as specified in Section 3.
2. **Copy `FlowForge.html` → `public/flowforge.html`** (preserving the original).
3. **Initialize `package.json`** with the dependencies listed in Section 6.
4. **Create `vite.config.js`** with multi-page setup (app + admin + marketing).
5. **Create `.gitignore`** excluding `.env.local`, `node_modules`, `.vercel`, `dist`.
6. **Create `.env.example`** with all variable names from Section 12 (no values).
7. **Create root `CLAUDE.md`** with the content from Section 3.
8. **Create per-folder `CLAUDE.md` routers** in each subdirectory (brief, ~10 lines each).
9. **Create `PHASE_STATE.md`** initialized to `Phase: 0`, `Status: In Progress`.
10. **Initial commit:** `git commit -m "Phase 0: project scaffolding"`.

### 5.3 Phase 0 Validation
- `C:\Users\agaba\Desktop\flowforge-saas\` exists with full folder structure
- `public/flowforge.html` opens in browser and runs as before
- Git repo initialized with first commit
- All `.env.example` variables documented
- `PHASE_STATE.md` shows Phase 0 complete

---

## 6. Phase 1 — Auth + Cloud Save

**Duration:** Weeks 2–4
**Outcome:** Users can sign up, log in, and save layouts to Supabase instead of local files.

### 6.1 Dependencies to Install

```powershell
npm install vite @supabase/supabase-js
npm install -D @types/node
```

### 6.2 Vite Configuration

`vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'src/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        marketing: resolve(__dirname, 'marketing/index.html')
      }
    }
  },
  server: { port: 3000 }
});
```

### 6.3 Entry Point Pattern

`src/index.html` is a thin shell:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>FlowForge</title>
</head>
<body>
  <div id="auth-gate"></div>
  <div id="app-host" style="display:none;"></div>
  <script type="module" src="/main.js"></script>
</body>
</html>
```

`src/main.js` flow:

1. Resolve tenant from `window.location.hostname` (Phase 2 — for Phase 1, hardcode a single tenant).
2. Check Supabase session. If none, render login form into `#auth-gate`.
3. On successful login, fetch the existing `public/flowforge.html`, inject into `#app-host`, hide `#auth-gate`.
4. Patch the FlowForge global save/load functions to call Supabase instead of local files.

### 6.4 Supabase Save/Load Patch

The existing FlowForge save function (around line 8780 in `FlowForge.html`) writes a JSON blob to a local file. Replace with a Supabase upsert against the `projects` table (see Section 11). Do NOT modify `FlowForge.html` directly — patch the global `window.saveProject` and `window.loadProject` functions from `src/projects/cloud-save.js` after the app loads.

### 6.5 Required Database Tables (Phase 1 subset)

```sql
-- users table is managed by Supabase Auth
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id),  -- nullable in Phase 1, required Phase 2+
  name text not null,
  data jsonb not null,                     -- the full .flowforge JSON
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index projects_user_idx on projects(user_id);
```

### 6.6 Phase 1 Tasks for Claude Code

When triggered with `proceed with FlowForge phase 1`:

1. Install dependencies (Section 6.1).
2. Write `vite.config.js` (Section 6.2).
3. Write `src/index.html` shell (Section 6.3).
4. Write `src/auth/supabase-client.js` exporting initialized client from env vars.
5. Write `src/auth/login.js` with email/password + magic link flows.
6. Write `src/auth/session.js` with `getSession()`, `onAuthChange()`, `signOut()`.
7. Write `src/main.js` orchestrating the boot flow described in 6.3.
8. Write `src/projects/cloud-save.js` with `saveProject()`, `loadProject()`, `listProjects()` using the Supabase client.
9. Write `src/projects/migration.js` to detect old-format `.flowforge` local files and upload them on first login.
10. Write `supabase/migrations/001_initial_schema.sql` with the `projects` table.
11. Apply the migration to the Supabase project.
12. Test end-to-end: sign up new user → create layout → save → log out → log back in → load.
13. Deploy to Vercel and verify the live URL works.
14. Update `PHASE_STATE.md` to `Phase: 1`, `Status: Complete`.

### 6.7 Phase 1 Validation
- New user can sign up at `flowforge.vercel.app`
- After login, FlowForge app loads
- Creating and saving a layout persists to Supabase `projects` table
- Logging out and back in loads the saved layout
- No console errors during the round trip

---

## 7. Phase 2 — Multi-Tenant Catalogs

**Duration:** Weeks 4–6
**Outcome:** Each client tenant has its own subdomain, catalog, and branding.

### 7.1 Architectural Change

The existing FlowForge has a hardcoded library of conveyor parts in the JS (around lines 1500–2500 of `FlowForge.html`). In Phase 2, this becomes tenant-injected.

**Strategy:** Add a global `window.FLOWFORGE_TENANT_CONFIG` that the existing library-render functions read from. The config is loaded BEFORE the app HTML is injected.

### 7.2 Database Tables (New in Phase 2)

```sql
create table tenants (
  id uuid primary key default gen_random_uuid(),
  subdomain text unique not null,            -- e.g. 'acme'
  display_name text not null,                -- e.g. 'Acme Industrial'
  logo_url text,
  primary_color text default '#2a2f36',
  accent_color text default '#ff6a18',
  catalog_json jsonb not null default '[]',  -- the product library
  active boolean default true,               -- toggled by Stripe webhook in Phase 3
  created_at timestamptz default now()
);

create table tenant_users (
  tenant_id uuid references tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',                -- 'admin' or 'member'
  primary key (tenant_id, user_id)
);

-- Add tenant_id constraint to projects (now required)
alter table projects alter column tenant_id set not null;
```

### 7.3 Subdomain Resolution

`api/tenant-config.js` (Vercel serverless function):

```javascript
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const subdomain = req.query.subdomain;
  if (!subdomain) return res.status(400).json({ error: 'Missing subdomain' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('tenants')
    .select('id, display_name, logo_url, primary_color, accent_color, catalog_json, active')
    .eq('subdomain', subdomain)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Tenant not found' });
  if (!data.active) return res.status(403).json({ error: 'Subscription inactive' });

  // Cache for 60 seconds at the edge
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  return res.json(data);
}
```

### 7.4 Vercel Wildcard Subdomain Setup

`vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "has": [{ "type": "host", "value": "(?<subdomain>.*)\\.flowforge\\.app" }],
      "destination": "/?subdomain=:subdomain"
    }
  ]
}
```

DNS: In Cloudflare, add `*` A record pointing at Vercel's IP, and a CNAME for `@` and `www` to Vercel.

### 7.5 Branding Injection

`src/tenant/branding.js`:

```javascript
export function applyBranding(config) {
  const root = document.documentElement;
  root.style.setProperty('--blue', config.primary_color);
  root.style.setProperty('--yellow', config.accent_color);
  root.style.setProperty('--forge-charcoal', config.primary_color);
  root.style.setProperty('--forge-orange', config.accent_color);
  document.title = config.display_name;
  // Replace logo in topbar after app loads
  if (config.logo_url) {
    document.querySelector('.brand').innerHTML = `<img src="${config.logo_url}" style="height:32px"/>`;
  }
}
```

### 7.6 Phase 2 Tasks for Claude Code

1. Write migration `supabase/migrations/002_tenants.sql` with tables from 7.2.
2. Apply RLS policies so users only see their tenant's data: `supabase/migrations/003_rls_policies.sql`.
3. Write `api/tenant-config.js` per 7.3.
4. Write `src/tenant/resolver.js` to extract subdomain from `window.location.hostname`.
5. Write `src/tenant/config-loader.js` to fetch from `/api/tenant-config`.
6. Write `src/tenant/branding.js` per 7.5.
7. Modify `src/main.js` to: resolve subdomain → fetch tenant config → apply branding → set `window.FLOWFORGE_TENANT_CONFIG` → inject app HTML.
8. Patch FlowForge library-render functions to read from `window.FLOWFORGE_TENANT_CONFIG.catalog_json` instead of hardcoded data. Do this via runtime monkey-patching from `src/tenant/catalog-injection.js`, not by editing `FlowForge.html`.
9. Update `vercel.json` per 7.4.
10. Create two test tenants in Supabase: `acme` and `bigbox`, with distinct catalogs (use the existing Omni Metalcraft data as the seed for one, fabricate a different catalog for the other).
11. Deploy, test both subdomains, confirm distinct branding and catalogs.
12. Update `PHASE_STATE.md`.

### 7.7 Phase 2 Validation
- `acme.flowforge.app` loads with Acme branding and Acme catalog
- `bigbox.flowforge.app` loads with BigBox branding and BigBox catalog
- A user signed up under one tenant cannot access projects from another
- Saving a project on `acme.flowforge.app` writes `tenant_id = acme_uuid` to the row

---

## 8. Phase 3 — Billing (Stripe)

**Duration:** Weeks 6–7
**Outcome:** New tenants are gated by an active Stripe subscription; lapsed payment auto-deactivates.

### 8.1 Stripe Setup (Manual)

- Activate Stripe account
- Create Product: "FlowForge White-Label"
- Create two Prices:
  - `flowforge_standard`: $249/month (up to 5 seats)
  - `flowforge_professional`: $499/month (unlimited seats)
- Configure webhook endpoint: `https://flowforge.app/api/stripe-webhook`
- Subscribe to events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Enable Customer Portal in Stripe dashboard

### 8.2 Database Changes

```sql
alter table tenants add column stripe_customer_id text;
alter table tenants add column stripe_subscription_id text;
alter table tenants add column subscription_status text default 'trialing';
alter table tenants add column trial_ends_at timestamptz;
```

### 8.3 Webhook Handler

`api/stripe-webhook.js` must:

1. Verify signature using `STRIPE_WEBHOOK_SECRET`.
2. On `customer.subscription.updated` or `created`: look up tenant by `stripe_customer_id`, update `subscription_status` and `active` flag.
3. On `customer.subscription.deleted`: set `active = false`.
4. On `invoice.payment_failed`: set `active = false` after grace period (3 days).

### 8.4 Checkout Flow

`api/create-checkout.js` creates a Stripe Checkout session with:

- 14-day trial (`trial_period_days: 14`)
- Success URL: `https://{subdomain}.flowforge.app/?welcome=true`
- Cancel URL: `https://flowforge.app/pricing`
- Customer email pre-filled from current Supabase user

### 8.5 Phase 3 Tasks for Claude Code

1. Migration for tenants table additions (Section 8.2).
2. Install Stripe SDK: `npm install stripe`.
3. Write `api/stripe-webhook.js` per 8.3.
4. Write `api/create-checkout.js` per 8.4.
5. Write `src/billing/stripe-checkout.js` to call the checkout API from the UI.
6. Write `src/billing/portal.js` to redirect to Stripe Customer Portal.
7. Modify `api/tenant-config.js` to return 403 when `subscription_status` is `past_due` or `canceled`.
8. Add a "Manage Billing" button in the FlowForge app for tenant admins.
9. Test with Stripe test mode: create checkout, complete payment, verify webhook fires, verify tenant activates.
10. Test failure path: cancel subscription in Stripe dashboard → verify tenant deactivates.
11. Update `PHASE_STATE.md`.

### 8.6 Phase 3 Validation
- New tenant signup goes through Stripe Checkout
- Successful payment activates the tenant in Supabase
- Canceling subscription deactivates access within 60 seconds (cache TTL)
- Customer Portal allows clients to update cards and cancel
- Trial period works (14 days, no card required)

---

## 9. Phase 4 — Admin Dashboard

**Duration:** Weeks 7–8
**Outcome:** Andrew can onboard a new tenant in under 30 minutes via a simple internal UI.

### 9.1 Access Control

The admin dashboard is gated by a Supabase user with role `super_admin` in a separate `admins` table. Only Andrew's user ID is in this table.

```sql
create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
```

### 9.2 Admin Routes

- `/admin` — Landing page with tenant list
- `/admin/tenant/new` — Create new tenant form
- `/admin/tenant/:id` — Edit tenant (catalog upload, branding, billing info)
- `/admin/revenue` — Stripe MRR dashboard
- `/admin/impersonate/:tenant_id` — Log in as a tenant user for debugging

### 9.3 Catalog Editor UX

Catalog JSON is large (often 500+ items). The editor must:
- Accept paste from clipboard
- Validate JSON before saving
- Show a preview rendering of the library panel as it would appear in the app
- Diff against the current catalog before save

### 9.4 Phase 4 Tasks for Claude Code

1. Migration for `admins` table.
2. Insert Andrew's user_id into `admins`.
3. Add RLS policies: only super admins can read all tenants and projects.
4. Build `admin/index.html` with vanilla JS (no React).
5. Build tenant list view (`admin/tenants.js`).
6. Build new-tenant form (`admin/new-tenant.js`) — collects subdomain, display name, colors, contact email, initial Stripe checkout link.
7. Build catalog editor (`admin/catalog-editor.js`) per 9.3.
8. Build revenue dashboard (`admin/revenue.js`) — pulls from Stripe API, shows MRR, churn, trial conversions.
9. Build impersonation feature using Supabase admin API to generate a magic link.
10. Test full onboarding flow: create tenant → upload catalog → configure branding → send Stripe link.
11. Update `PHASE_STATE.md`.

### 9.5 Phase 4 Validation
- Admin dashboard accessible only to Andrew's user
- New tenant can be onboarded end-to-end in <30 minutes
- Catalog editor catches malformed JSON before save
- Revenue dashboard matches Stripe dashboard numbers
- Impersonation works without leaking admin session

---

## 10. Phase 5 — Go to Market

**Duration:** Weeks 8–10
**Outcome:** Landing page live, OmniNapkin case study published, first 3 cold outreach targets contacted, first paid invoice sent.

### 10.1 Landing Page Content

`marketing/index.html` — single-page site with:

- **Hero:** "Conveyor layout software built for distributors." + 60-second demo GIF.
- **Problem statement:** "Quoting conveyor layouts in Excel or AutoCAD wastes hours per quote."
- **Solution:** "Drag-and-drop layouts, BF/OW math built in, PDF exports with your branding."
- **Pricing:** Two tiers ($249, $499) with feature comparison.
- **Case study link:** OmniNapkin deployment.
- **Contact form:** Submits to a Supabase `leads` table.

### 10.2 Demo Instance

`demo.flowforge.app` — a public tenant with a generic catalog (no real distributor's IP). Anyone can play with it without signing up. Restricted by:
- Session expires after 30 minutes
- Cannot save projects (read/play only)
- Banner: "Try FlowForge — sign up to save your work"

### 10.3 Case Study Document

`marketing/case-study-omninapkin.html`:
- Problem Omni Metalcraft had (manual quoting in AutoCAD/Excel)
- What was built (the OmniNapkin reskin)
- Outcome (faster quotes, fewer errors, branded deliverables)
- Screenshots — get Omni's permission first, or use generic ones with a name redaction.

**Verify with Andrew whether Omni has approved using their name as a public case study before publishing.**

### 10.4 Cold Outreach Targets

First three target prospects (Andrew identifies; Claude Code does NOT auto-send emails):

| # | Target Type | Source |
|---|---|---|
| 1 | Hytrol regional distributor | Andrew's existing industry network |
| 2 | Ashland Conveyor distributor | LinkedIn search |
| 3 | Independent material handling integrator | Local Michigan trade group |

Email template lives in `marketing/outreach-template.md`. Claude Code drafts, Andrew sends.

### 10.5 Phase 5 Tasks for Claude Code

1. Build `marketing/index.html` landing page per 10.1.
2. Build `marketing/pricing.html`.
3. Build `marketing/case-study-omninapkin.html` (template only — Andrew fills in approved details).
4. Set up `demo.flowforge.app` tenant with generic catalog.
5. Write `marketing/outreach-template.md` with three variant emails (warm intro, cold ops manager, cold sales manager).
6. Wire contact form to Supabase `leads` table.
7. Set up basic analytics (Plausible or Vercel Analytics — both privacy-friendly).
8. Update `PHASE_STATE.md` to `Phase: 5`, `Status: Live`.

### 10.6 Phase 5 Validation
- `flowforge.app` loads with landing page
- Demo at `demo.flowforge.app` works without signup
- Contact form submissions appear in Supabase
- Three outreach emails drafted and ready to send
- First invoice sent to first client

---

## 11. Database Schema (Reference)

Complete consolidated schema after all phases:

```sql
-- TENANTS
create table tenants (
  id uuid primary key default gen_random_uuid(),
  subdomain text unique not null,
  display_name text not null,
  logo_url text,
  primary_color text default '#2a2f36',
  accent_color text default '#ff6a18',
  catalog_json jsonb not null default '[]',
  active boolean default true,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'trialing',
  trial_ends_at timestamptz,
  created_at timestamptz default now()
);

-- TENANT MEMBERSHIPS
create table tenant_users (
  tenant_id uuid references tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',
  created_at timestamptz default now(),
  primary key (tenant_id, user_id)
);

-- PROJECTS (layouts)
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id),
  name text not null,
  data jsonb not null,
  thumbnail_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index projects_user_idx on projects(user_id);
create index projects_tenant_idx on projects(tenant_id);

-- ADMINS
create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- LEADS (marketing contact form)
create table leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  company text,
  message text,
  source text,
  created_at timestamptz default now()
);

-- RLS POLICIES (essential — apply before going live)
alter table tenants enable row level security;
alter table tenant_users enable row level security;
alter table projects enable row level security;

-- Users can read their own tenant
create policy "tenant_read_own" on tenants
  for select using (
    id in (select tenant_id from tenant_users where user_id = auth.uid())
  );

-- Users can read/write their own projects within their tenant
create policy "projects_own" on projects
  for all using (user_id = auth.uid());

-- Admins bypass all RLS
create policy "admin_bypass_tenants" on tenants
  for all using (auth.uid() in (select user_id from admins));
create policy "admin_bypass_projects" on projects
  for all using (auth.uid() in (select user_id from admins));
```

---

## 12. Environment Variables

`.env.example`:

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STANDARD=
STRIPE_PRICE_PROFESSIONAL=

# App
APP_URL=https://flowforge.app
NODE_ENV=development
```

Vercel env vars must be set separately in Vercel project settings. Supabase service role key is server-side ONLY (never expose to frontend).

---

## 13. Validation Checklist Per Phase

Claude Code must update `PHASE_STATE.md` after each phase. Format:

```markdown
# FlowForge Phase State

## Current Phase: <N>
## Status: <In Progress | Blocked | Complete>
## Last Updated: <ISO date>

## Phase 0 — Foundation
- [x] LLC filed
- [x] Domain owned
- [x] IP timeline documented
- [x] Folder structure created
- [x] Git repo initialized

## Phase 1 — Auth + Cloud Save
- [ ] Vite configured
- [ ] Supabase client integrated
- [ ] Login flow works
- [ ] Cloud save replaces local file save
- [ ] Deployed to Vercel
- [ ] End-to-end test passed

(...etc for all phases)

## Blockers / Open Questions
- (none)

## Recent Decisions
- 2026-05-22: Confirmed no React migration; staying with vanilla JS wrapped in Vite.
```

---

## 14. Open Decisions Log

Decisions Andrew needs to make before or during execution. Claude Code should NOT decide these unilaterally.

| # | Decision | Status | Notes |
|---|---|---|---|
| 1 | Domain name (flowforge.app vs alternatives) | Open | Check availability |
| 2 | LLC name | Open | "FlowForge Software LLC" suggested |
| 3 | Use Omni Metalcraft name in case study? | Open | Requires their permission |
| 4 | Pricing tiers final ($249/$499 vs alternatives) | Tentative | Based on white-label market research |
| 5 | Trial length (14 days vs 7 vs 30) | Tentative — 14 days | Industry standard |
| 6 | Stripe metered billing for seats? | Deferred | Phase 6+ if self-serve tier launches |
| 7 | Native desktop app via Tauri later? | Deferred | Possible Phase 7 |

---

## 15. Claude Code Operating Notes

### General Behavior

- **Always read `PHASE_STATE.md` first** in a new session to know where work resumed.
- **Never skip phase gates.** If Phase 2 validation isn't complete, do not start Phase 3.
- **Never rewrite `FlowForge.html`.** Patch behavior via external JS modules.
- **Use PowerShell syntax** for shell commands, not bash. Example: `Remove-Item` not `rm`, `Copy-Item` not `cp`.
- **Absolute paths on Windows:** `C:\Users\agaba\Desktop\flowforge-saas\` (use backslashes in commands but forward slashes in code imports).
- **Don't auto-commit secrets.** Always verify `.env.local` is gitignored before any `git add`.
- **Don't send emails or invoke external APIs that cost money** without Andrew's explicit go-ahead. Stripe test mode is fine; live mode requires confirmation.

### When Things Break

- **Build errors:** Check Vite logs first, then `node_modules` integrity.
- **Auth errors:** Verify Supabase URL and anon key match the project dashboard.
- **Subdomain not routing:** Check Cloudflare DNS, then Vercel project domains, then `vercel.json` rewrites.
- **Stripe webhook not firing:** Use Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe-webhook`) for local debugging.

### Communication Style

- After completing a discrete task, summarize: what changed, what files were modified, what to test next.
- If blocked, write the blocker explicitly to `PHASE_STATE.md` under "Blockers / Open Questions" and STOP. Do not improvise around legal/contractual/payment ambiguity.
- If a phase validation step fails, do not mark the phase complete. Surface the failure and propose remediation.

### Anti-Patterns to Avoid

| Don't | Do |
|---|---|
| Rewrite FlowForge.html in React | Patch externally via JS modules |
| Use bash commands on Windows | Use PowerShell syntax |
| Add new frameworks without justifying | Stick to Vite + vanilla JS + Supabase + Stripe |
| Auto-decide pricing or domain choices | Surface decisions to Andrew |
| Skip RLS policies | Apply RLS in Phase 2 migration, test before Phase 3 |
| Commit `.env.local` | Verify `.gitignore` before every commit |
| Mark phases complete without validation | Run the validation checklist; document results |

---

## End of Document

When you (Claude Code) finish reading this guide on session start, confirm by writing the current phase and next concrete action to chat. Then wait for the relevant trigger phrase from Andrew before executing.
