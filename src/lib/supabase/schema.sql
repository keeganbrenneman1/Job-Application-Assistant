-- Job Application Assistant — Supabase schema (v2)
--
-- Storage scope per spec: generated preps + opportunity metadata only.
-- Resumes are never written here — the app never has a resume-storage
-- table, column, or bucket by design.
--
-- No auth / no RLS: this is a named 2-person tool (Keegan + spouse), not a
-- multi-tenant app. All access happens server-side through the Supabase
-- service role key (see src/lib/supabase/client.ts), which bypasses RLS
-- anyway, so RLS policies would be theater here. Documented trade-off from
-- the spec: "not multi-tenant-safe, sufficient for personal use."
--
-- v2 changes from v1:
-- - `owner` (fixed keegan/spouse enum) replaced with free-text
--   `applicant_name` — v1's picker/toggle contradicted the spec's own "no
--   profile picker/toggle in the UI" requirement.
-- - `jd_text` persisted on the opportunity (reused across stages).
-- - `company_research` moved from per-prep to per-opportunity — Call 1
--   runs once per opportunity and is cached for the life of it, not
--   re-run per stage.
-- - `preps` (now "stage preps") gain `stage_type` / `stage_label` /
--   `additional_context`; their own `research` column is gone since
--   research now lives on the opportunity.

create extension if not exists "pgcrypto";

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  applicant_name text not null,
  company text not null,
  role text not null,
  jd_text text not null default '',
  company_research jsonb,
  created_at timestamptz not null default now()
);

create index if not exists opportunities_created_idx on opportunities (created_at desc);

-- Deliberately no `status` / cross-opportunity "current stage" column —
-- that's the v-next tracker, explicitly out of scope here.
create table if not exists preps (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  stage_type text not null check (
    stage_type in ('recruiter_screen', 'technical_case', 'behavioral', 'panel_onsite', 'reference_check', 'other')
  ),
  stage_label text not null, -- resolved display label; carries the free-text "Other" label verbatim
  content jsonb not null, -- StageContent: dynamic section keys per stage type, see src/types/index.ts
  additional_context text, -- optional free-text context supplied for this stage's generation (e.g. an interview-invite email)
  source text not null default 'live' check (source in ('live', 'mock')),
  created_at timestamptz not null default now()
);

create index if not exists preps_opportunity_idx on preps (opportunity_id, created_at desc);

-- Optional (per spec, "not required"): short-lived company research cache
-- shared across both users, keyed by a normalized company name. Distinct
-- from `opportunities.company_research`, which is the firm per-opportunity
-- cache the spec requires; this table is for cross-opportunity reuse and
-- isn't wired up by the app yet.
create table if not exists company_research_cache (
  company_key text primary key,
  research jsonb not null,
  fetched_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Migration from the v1 shape (owner enum, no jd_text/company_research on
-- opportunities, no stage_type/stage_label/additional_context on preps,
-- research lived per-prep) to v2. Every branch is guarded so this is a
-- no-op against a database that was already created with the v2 shape
-- above, and safe to re-run.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'opportunities' and column_name = 'owner'
  ) then
    alter table opportunities add column if not exists applicant_name text;
    update opportunities set applicant_name = owner where applicant_name is null;
    alter table opportunities alter column applicant_name set not null;
    alter table opportunities drop column owner;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'opportunities' and column_name = 'jd_text'
  ) then
    alter table opportunities add column jd_text text not null default '';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'opportunities' and column_name = 'company_research'
  ) then
    alter table opportunities add column company_research jsonb;

    -- Best-effort backfill from each opportunity's earliest prep, which is
    -- where Call 1's research lived under the v1 per-prep column. v1 only
    -- ever had one prep per opportunity, so "earliest" is unambiguous.
    if exists (
      select 1 from information_schema.columns
      where table_name = 'preps' and column_name = 'research'
    ) then
      update opportunities o
      set company_research = earliest.research
      from (
        select distinct on (opportunity_id) opportunity_id, research
        from preps
        order by opportunity_id, created_at asc
      ) earliest
      where earliest.opportunity_id = o.id
        and o.company_research is null
        and earliest.research is not null;
    end if;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'preps' and column_name = 'stage_type'
  ) then
    alter table preps add column stage_type text;
    update preps set stage_type = 'recruiter_screen' where stage_type is null;
    alter table preps alter column stage_type set not null;
    alter table preps add constraint preps_stage_type_check check (
      stage_type in ('recruiter_screen', 'technical_case', 'behavioral', 'panel_onsite', 'reference_check', 'other')
    );
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'preps' and column_name = 'stage_label'
  ) then
    alter table preps add column stage_label text;
    update preps set stage_label = 'Recruiter Screen' where stage_label is null;
    alter table preps alter column stage_label set not null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'preps' and column_name = 'additional_context'
  ) then
    alter table preps add column additional_context text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_name = 'preps' and column_name = 'research'
  ) then
    alter table preps drop column research;
  end if;
end $$;
