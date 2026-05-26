-- Phase 1: Initial schema — projects table for cloud save/load
-- Apply via Supabase SQL editor or `supabase db push`

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  tenant_id uuid,  -- nullable in Phase 1; becomes NOT NULL + FK in Phase 2
  name text not null,
  data jsonb not null,
  thumbnail_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists projects_user_idx on projects(user_id);
create index if not exists projects_tenant_idx on projects(tenant_id);

-- Basic RLS: users can only access their own projects
alter table projects enable row level security;

create policy "users_own_projects_select" on projects
  for select using (user_id = auth.uid());

create policy "users_own_projects_insert" on projects
  for insert with check (user_id = auth.uid());

create policy "users_own_projects_update" on projects
  for update using (user_id = auth.uid());

create policy "users_own_projects_delete" on projects
  for delete using (user_id = auth.uid());
