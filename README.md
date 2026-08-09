# Job Application Assistant
## Why
Faster, tailored interview prep grounded in the real job description, the candidate’s resume,
and current company information, across the whole interview pipeline. Built for
personal use (Keegan + spouse) during an active job search, and as a portfolio piece
demonstrating a hybrid grounded-generation architecture (deterministic extraction + live
search-grounded research + separate reasoning call). Note: Focused on the steps following securing an initial interview right now.
## What it does (v2)
Paste or upload a resume and a job description (text or URL) to generate a Recruiter
Screen prep doc: company snapshot, fit talking points, likely questions, questions to
ask, logistics. From there, generate one additional stage-specific prep (Technical/Case,
Behavioral, Panel/Onsite, Reference Check, or Other) that builds on the Recruiter Screen
prep's content — hard capped at 2 stages per opportunity for v2. The Company Snapshot is
generated once per opportunity (cached, not re-researched per stage) and shown as a
collapsible block above a reverse-chronological feed of stage preps. Each stage's form
lets you optionally add stage-specific context (e.g. an interview-invite email) and
optionally re-supply your resume — omitting it still generates a valid prep from the JD,
cached company research, and the prior stage's content.
Lightweight opportunity archive — revisit past preps by company/role, sortable by any
column, no login. Applicant name is a per-opportunity free-text field, not a global
profile picker.
Resume is never persisted, at any stage; only the generated prep docs (and the JD, once)
are saved.
## Status
Next.js (App Router, TypeScript, Tailwind) app implementing the v2 architecture from
`JOB APPLICATION ASSISTANT SPEC_0808.md`: deterministic resume/JD extraction, a
Claude pipeline (grounded research once per opportunity, then stage-aware reasoning-only
generation per stage) behind a single swappable mock/live function, and Supabase-backed
opportunity/stage-prep storage with an in-memory fallback for local dev before a
Supabase project is wired up. Not yet deployed or run against a live Claude API key.

## What's not built yet
- Removing the 2-stage cap and adding a rolling cross-stage summary (v3)
- Persisted, reusable interview-stage sequences (v3)
- A request for additional context going into the recruiter screen (v4)
- Interactive mock Q&A, stage tracker, general reorganizing to promote PDF usage and extraction (v-next)

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
Built using a spec-first, prototype-before-code process — see `JOB APPLICATION ASSISTANT SPEC_0808.md`
(v2) and `JOB APPLICATION ASSISTANT SPEC.md` (v1) for the locked architecture decisions,
and `.claude /agents/` for the review checklists (spec-critic, eng-architecture-reviewer,
qa-smoke-test) used during build.
