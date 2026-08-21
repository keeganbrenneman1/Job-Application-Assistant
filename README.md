# Job Application Assistant
## Why
Faster, tailored interview prep grounded in the real job description, the candidate’s resume,
and current company information, across the whole interview pipeline. Built for
personal use (Keegan + spouse) during an active job search, and as a portfolio piece
demonstrating a hybrid grounded-generation architecture (deterministic extraction + live
search-grounded research + separate reasoning call). Note: Focused on the steps following securing an initial interview right now.
## What it does (v7)
Adds an **Export to PDF** trigger on each stage's prep doc — a scoped-down
slice of the "Share report" item under "What's not built yet" below,
covering just the single-stage case (whole-opportunity export stays
unbuilt). Renders that one stage's generated content as a standalone,
presentable PDF, plus the Company Snapshot when — and only when — the stage
is a Recruiter Screen (every other stage type never shows it in the app
either, since it's generated once per opportunity, not per stage). No new
Claude call: this only lays out content that's already been generated and
persisted, via `@react-pdf/renderer` on the server, using the 14 standard
PDF fonts so it never depends on fetching a font from the network at render
time. Deliberately excludes the stage's context log and the opportunity-
level context field from the export — both are working material that
already fed Call 2's output, so they're already reflected in what gets
rendered; repeating them in the PDF would just duplicate content, not add
information. Downloadable straight from the stage's card as an attachment
(no page reload, no app state needed to view it) — meant to stand alone
once out of the app, e.g. handed to a spouse or printed for an interview.

## What it does (v6)
Adds a **Regenerate** trigger on each stage's prep doc — mostly-absorbed
"re-request prep doc," per the item this replaces under "What's not built
yet." Reruns Call 2 in place for that one stage, using the stage's own
current context log (v4) in full, including any entries logged after the
doc's original generation — corrections, clarifications, an invite email
pasted in later. Full-doc regeneration only: the whole prep doc is rewritten
from scratch with the corrected context, not a targeted rewrite of just one
section (that's a distinct, backlogged feature — see "What's not built
yet"). Works on any existing stage prep, whether its own log is still open
(it's the opportunity's newest stage) or closed (a later stage already
exists) — regenerating only reads the log, it never writes to it, so it
doesn't reopen a closed log or add an entry of its own. No new data model:
corrections live in the same `context_entries` log v4 already built: this
session only adds the trigger + rerun logic that reads it. Call 2 only,
same as the rest of the app's per-stage generation — company research stays
cached and is never re-run by this action (see v3's separate, Call-1-only
Company Snapshot Regenerate for that).

## What it does (v5)
Removes v2's hard cap of 2 total stage-preps per opportunity. "Generate Next
Step" is now available after any stage, not just the first — sequential
stages can be added indefinitely (Recruiter Screen → Technical → Panel →
Reference Check → ..., as many hops as the interview process actually has).

Deliberately **not** what the original spec's v3/v5 numbering describes for
this: there's no rolling-summary mechanism, and no accumulation of context
across more than one hop. Each stage's generation still uses exactly what
v2/v4 already used for the 1-to-2 case — the immediately preceding stage's
generated content plus its context log (v4) — simply repeated for stage 3,
4, 5, and so on, rather than the full history of every prior stage. This
was an explicit scoping decision for this session, not an oversight: it
avoids the context/cost ballooning a naive "pass every prior stage" version
would cause, without yet building the rolling-summary mechanism the
original spec called for. A future phase revisiting multi-hop context
accumulation should treat that as new scope, not assume this session built
toward it.

## What it does (v4)
Replaces v2's one-shot per-stage additional-context field with an append-only
context log, per stage. A stage's log opens the moment that stage is created
and stays open — new entries addable any time, RSS-style — until Generate
Next Step creates the following stage. You can log pre-interview notes and
questions, live notes, a post-call debrief, and eventually the invite email
confirming the next round, all in the same log; once the next stage is
generated, the full log from the stage that just closed is what feeds that
next stage's prep (in place of v2's field). Shown inline on each stage's
card in the Opportunity Detail feed — the open (most recently created)
stage shows an add-entry box beneath its existing entries; every earlier
stage's log is read-only, since its contents already fed the next
generation. No edit/delete — additive only. v3's opportunity-level
Additional Context field is unaffected: still separate, always-editable,
with no automatic relationship to stage logs.

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

Also added in the same session, prompted by a live-data issue rather than
the original v3 brief: a manual **Regenerate** action on the Company
Snapshot block, for when Call 1's research response comes back malformed
(a missing section renders as a literal "Not found." and, since research is
otherwise cached for the life of the opportunity, would sit there
permanently with no other fix). Re-runs Call 1 only and overwrites the
cached research for that opportunity — deliberately scoped to research
only, not a stage prep. Distinct from **re-request prep doc**
(Call 2 only, per-stage, picks up newly backfilled context) — see
"What's not built yet."

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
`JOB APPLICATION ASSISTANT SPEC_1008.md`: deterministic resume/JD extraction, a
Claude pipeline (grounded research once per opportunity, then stage-aware reasoning-only
generation per stage) behind a single swappable mock/live function, and Supabase-backed
opportunity/stage-prep storage with an in-memory fallback for local dev before a
Supabase project is wired up — plus v3's persistent opportunity-level context field
(`additional_context` on `opportunities`), folded into Call 2's prompt whenever present,
no new Claude call — plus a manual Company Snapshot regenerate action (re-runs Call 1,
overwrites the opportunity's cached research) — plus v4's per-stage append-only context
log (`context_entries`, keyed to a stage prep), whose full contents replace v2's one-shot
per-stage field as input to the next stage's generation — plus v5's removal of the
2-stage cap (unlimited sequential stages; context per generation still single-hop only,
see "What it does (v5)") — plus v6's per-stage Regenerate trigger (Call 2 only, in
place, using that stage's own current context log — see "What it does (v6)") — plus
v7's per-stage Export to PDF trigger (no Claude call, renders already-generated
content via `@react-pdf/renderer` — see "What it does (v7)"). Not yet deployed or run
against a live Claude API key.

## What's not built yet
Read `V3_HANDOFF.md` for session notes on v3/v4 — decisions behind them that aren't
visible from the code alone, and constraints future work should respect. Multi-hop
context accumulation (a rolling summary across all prior stages, not just the
immediately preceding one) remains unbuilt — see "What it does (v5)" above for why
that was deliberately deferred rather than built this session.
- **v-next:**
    -  ”Share report” option to create a PDF of a whole opportunity, all stages combined, with each question in each stage expanded. v7 built the single-stage slice of this (see "What it does (v7)") — the user can already export one stage's prep doc to PDF and share it or bring it to the live interview; what remains here is specifically the whole-opportunity, all-stages-combined version, deliberately not built in that session.
    - “Close Opportunity” marks the end of an interview cycle for a given company/role. Closed opportunities remain fully viewable (all stages, context, and prep history intact) but can no longer advance — no new stages, no Generate Next Step. Status is not a simple open/closed boolean; supports distinct outcome states (e.g., offer, rejected, withdrawn, ghosted/stale) so future dashboard/tracker work can report on outcomes, not just activity. Closing is purely manual — nothing in the app infers or auto-closes based on staleness or time since last stage. No reopen path: closing is treated as effectively permanent, since there’s no legitimate reason to reopen (only mistakes), and a mistaken close requires resubmitting the opportunity from scratch. Given that cost, the close action requires an explicit confirmation step (“This cannot be undone”) baked in from the start, not added later. Not yet scoped: exact status values, where status displays in the opportunities table/list view, whether status is settable independent of closing (e.g., could you mark “offer” without closing) or whether status and closed-state are the same decision made at the same time.
  - Section-level requests for adjusting the prep doc: Targeted correction for narrow errors that don’t warrant regenerating the whole doc — e.g., a wrong-audience question in the logistics section, when the rest of the doc is fine. Requires Call 2 (or a variant of it) to isolate a specific section of its own prior output and rewrite just that part using new feedback, without touching or re-rolling the sections that were already correct. Real added complexity versus full regen: not just “more context, rerun everything,” but “identify a bounded piece of prior output and revise it in place.” Backlogged separately; full regen (above) should be evaluated first via real usage before deciding whether section-level regen is worth building.
  - Resume optimization to extend into the pre-interview part of the job application lifecycle
  - Feedback collection AND use, kept together as one item (not split into phases — attribution question between Keegan and spouse is unresolved: v1 has no per-user separation) to extend into the post-interview part of the job search lifecycle
  - UX
    - General legibility clean up
    - Broader PDF-extraction goal: ideal state is uploading a JD PDF and a resume PDF and having everything auto-extracted (e.g. applicant name currently isn't pulled from the resume) — not just the current lightweight Call 0 field-extraction path
  - Interactive mock Q&A
  - Stage-by-stage tracker/dashboard
  - Persisted/reusable named interview-stage-sequence templates
  - Changing the data model to no-auth/shareable-via-link for anyone — flagged as a major re-architecture, not a checkbox: reopens cost guardrails, the ephemeral-resume/interviewer-PDF privacy stance, and company-research caching, all currently designed around "two known people," not the general public

## Someday, not scoped (fuzzy, no committed version)
- **Big-picture vision:** extend beyond interview-cycle prep into resume optimization — per-JD tailoring (repurposing Call 1 research + Call 2 fit reasoning, positioned before submission rather than after a screen is scheduled) AND informed by accumulated feedback across opportunities over time. Also wants something useful to come out of failed/closed opportunities specifically — implies an outcome/status field (rejected, no response, withdrawn) the current data model doesn't capture. Depends on the same feedback-attribution question above being resolved first.
- **Conversational refinement of a prep doc:** after initial generation, a chat-style back-and-forth to react/correct/add context and have the doc evolve — different from v3's one-shot field or v6's static, full-doc-only Regenerate trigger (above). Needs multi-turn conversation storage per stage-prep and a decision on full-doc vs. section-level regeneration per turn.


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
Built using a spec-first, prototype-before-code process — see `JOB APPLICATION ASSISTANT SPEC_1008.md`
(v2, supersedes the earlier `SPEC_0808.md` draft) and `JOB APPLICATION ASSISTANT SPEC.md` (v1) for the
locked architecture decisions, and `.claude /agents/` for the review checklists (spec-critic,
eng-architecture-reviewer, qa-smoke-test) used during build.
