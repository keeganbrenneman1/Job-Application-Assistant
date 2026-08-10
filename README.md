# Job Application Assistant
## Why
Faster, tailored interview prep grounded in the real job description, the candidate’s resume,
and current company information, across the whole interview pipeline. Built for
personal use (Keegan + spouse) during an active job search, and as a portfolio piece
demonstrating a hybrid grounded-generation architecture (deterministic extraction + live
search-grounded research + separate reasoning call). Note: Focused on the steps following securing an initial interview right now.
## What it does (v3)
Adds one persistent, opportunity-level free-text context field on top of v2 —
separate from each stage's one-shot additional-context field and separate
from the resume/JD. It behaves like a running note: opens pre-filled with
whatever's already saved on the Opportunity Detail page (collapsible,
alongside the Company Snapshot block and stage-prep feed), the user
edits/appends in place, and it's never blank if content already exists.
Included as-is (no summarization, no extra Claude call) in every future
stage generation for that opportunity when non-empty — e.g. an
interviewer's email contents, notes on how a prior session actually went,
org-structure detail learned outside the app.

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
Supabase project is wired up — plus v3's persistent opportunity-level context field
(`additional_context` on `opportunities`), folded into Call 2's prompt whenever present,
no new Claude call. Not yet deployed or run against a live Claude API key.

## What's not built yet
- **v4:** remove the 2-stage cap — reuse the "next step" option as many times as necessary. Uses context of all prior stages (plural), not just the last one, when creating prep content for the current stage. (Mechanism: rolling summary, rewritten after each stage generation, stored on the opportunity — not full raw text per prior stage.)
- **v-next:**
  - Stage-specific context (later refinement — likely unifying v2's per-stage field and v3's opportunity-level field, e.g. tagging opportunity-level context as stage-specific when needed; not fully resolved)
  - Resume optimization
  - Feedback collection AND use, kept together as one item (not split into phases — attribution question between Keegan and spouse is unresolved: v1 has no per-user separation)
  - Interactive mock Q&A
  - Stage-by-stage tracker/dashboard
  - Persisted/reusable named interview-stage-sequence templates
  - Broader PDF-extraction goal: ideal state is uploading a JD PDF and a resume PDF and having everything auto-extracted (e.g. applicant name currently isn't pulled from the resume) — not just the current lightweight Call 0 field-extraction path
  - Changing the data model to no-auth/shareable-via-link for anyone — flagged as a major re-architecture, not a checkbox: reopens cost guardrails, the ephemeral-resume/interviewer-PDF privacy stance, and company-research caching, all currently designed around "two known people," not the general public

## Someday, not scoped (fuzzy, no committed version)
- **Big-picture vision:** extend beyond interview-cycle prep into resume optimization — per-JD tailoring (repurposing Call 1 research + Call 2 fit reasoning, positioned before submission rather than after a screen is scheduled) AND informed by accumulated feedback across opportunities over time. Also wants something useful to come out of failed/closed opportunities specifically — implies an outcome/status field (rejected, no response, withdrawn) the current data model doesn't capture. Depends on the same feedback-attribution question above being resolved first.
- **Conversational refinement of a prep doc:** after initial generation, a chat-style back-and-forth to react/correct/add context and have the doc evolve — different from v3's one-shot field or the static Regenerate button. Needs multi-turn conversation storage per stage-prep and a decision on full-doc vs. section-level regeneration per turn.


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
