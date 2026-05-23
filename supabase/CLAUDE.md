# supabase/ — schema + migrations

- `migrations/001_initial_schema.sql` — Phase 1: `projects` table.
- `migrations/002_tenants.sql` — Phase 2: `tenants`, `tenant_users`, makes `projects.tenant_id` NOT NULL.
- `migrations/003_rls_policies.sql` — Phase 2: row-level security gating.
- `migrations/004_stripe_columns.sql` — Phase 3: subscription columns on tenants.
- `migrations/005_admins.sql` — Phase 4: super-admin gating.
- `seed.sql` — local test data.

Apply via `supabase db push` from the Supabase CLI, or paste into the SQL editor in the Supabase dashboard. Order matters — don't reorder; create new files with the next numeric prefix.
