# Job Application Assistant
## Why
Faster, tailored interview prep grounded in the real job description, the candidate’s resume,
and current company information — starting with the recruiter screen stage. Built for
personal use (Keegan + spouse) during an active job search, and as a portfolio piece
demonstrating a hybrid grounded-generation architecture (deterministic extraction + live
search-grounded research + separate reasoning call).
## What it does (v1)
Paste or upload a resume and a job description (text or URL).
Generates a recruiter-screen prep doc: company snapshot, fit talking points, likely
questions, questions to ask, logistics.
Collapsible dossier-style layout, built for quick scanning right before a call.
Lightweight opportunity archive — revisit past preps by company/role, no login (2-
person profile picker).
Resume is never persisted; only the generated prep doc is saved.
## Status
Scaffolded. Next.js (App Router, TypeScript, Tailwind) app implementing the full v1
architecture from `JOB APPLICATION ASSISTANT SPEC.md`: deterministic resume/JD extraction, a
two-call Claude pipeline (grounded research, then reasoning-only generation) behind a
single swappable mock/live function, and Supabase-backed opportunity/prep storage with
an in-memory fallback for local dev before a Supabase project is wired up. Not yet
deployed or run against a live Claude API key.

## What's not built yet
- Additional interview stages beyond recruiter screen (v2)
- Interactive mock Q&A, stage tracker (v-next)

## Stack
Next.js 16 (App Router, TypeScript, Tailwind) on GitHub Codespaces (build) → Vercel +
Supabase (deploy). `@anthropic-ai/sdk` with the web search tool for the grounded
research call. `unpdf` / `mammoth` for deterministic resume parsing, `cheerio` for
JD URL scraping.

## Running locally
```
npm install
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY, or set MOCK_MODE=true
npm run dev
```
Without `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` set, opportunities/preps are kept
in an in-memory store that resets on restart — enough to exercise the full flow before
a Supabase project exists. Run `src/lib/supabase/schema.sql` against a Supabase project
to enable real persistence. Use the "Load sample JD + resume" link on the New Prep tab
for a cold-start demo without a real resume on hand.

## Process
Built using a spec-first, prototype-before-code process — see `JOB APPLICATION ASSISTANT SPEC.md`
for the locked architecture decisions and `.claude /agents/` for the review checklists
(spec-critic, eng-architecture-reviewer, qa-smoke-test) used during build.
