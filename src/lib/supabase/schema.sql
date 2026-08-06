-- Job Application Assistant — Supabase schema (v1)
--
-- Storage scope per job-assistant-spec.md: generated preps only.
-- Resumes are never written here — the app never has a resume-storage
-- table, column, or bucket by design.
--
-- No auth / no RLS: this is a named 2-person tool (Keegan + spouse), not a
-- multi-tenant app. All access happens server-side through the Supabase
-- service role key (see src/lib/supabase/client.ts), which bypasses RLS
-- anyway, so RLS policies would be theater here. Documented trade-off from
-- the spec: "not multi-tenant-safe, sufficient for personal use."

create extension if not exists "pgcrypto";

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  owner text not null check (owner in ('keegan', 'spouse')),
  company text not null,
  role text not null,
  created_at timestamptz not null default now()
);

create index if not exists opportunities_owner_idx on opportunities (owner, created_at desc);

-- Deliberately no `status` / `stage` column — that's the v-next tracker,
-- explicitly out of scope for v1 (see spec "User & data model").
create table if not exists preps (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  content jsonb not null, -- PrepContent: company / fit / expect / ask / logistics
  research jsonb, -- CompanyResearch from the Call 1 grounded research step
  source text not null default 'live' check (source in ('live', 'mock')),
  created_at timestamptz not null default now()
);

create index if not exists preps_opportunity_idx on preps (opportunity_id, created_at desc);

-- Optional (per spec, "not required for v1"): short-lived company research
-- cache shared across both users, keyed by a normalized company name.
create table if not exists company_research_cache (
  company_key text primary key,
  research jsonb not null,
  fetched_at timestamptz not null default now()
);
