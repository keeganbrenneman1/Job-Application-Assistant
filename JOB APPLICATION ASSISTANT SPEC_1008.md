# Job Application Assistant — Spec

## Problem
Faster, tailored interview prep grounded in the real job description, the candidate's resume, and current company information — starting with the recruiter screen stage.

## v1 / v2 / v3 / v-next
- **v1:** recruiter screen only. Static prep doc output. JD + resume + lightweight live company research. No login, no picker — applicant name entered as a per-opportunity field.
- **v2:** add a single "next step" option after the Recruiter Screen prep — one additional stage, hard capped at 2 stages total per opportunity. Uses the context of the immediately preceding stage only (no accumulation across more than one hop). Asks for the interviewer’s title to use as context
- **v3:** remove the v2 cap — reuse the "next step" option as many times as necessary. Uses context of all prior stages (plural), not just the last one, when creating prep content for the current stage
- **v4:** ability to freely add manual text for use as context and for reasoning and generating prep content (i.e. adding an interviewer’s email contents ahead of an interview or questions answered going into previous session)
- **v-next:** 
— stage-specific context 
— resume optimization 
— feedback collection
-— use of collected feedback — interactive mock Q&A  — stage-by-stage tracker/dashboard (lower priority than full-process coverage)
— change data model to no-auth for anybody that wants to use the tool when shared via link

## User & data model
- Named 2-user tool (Keegan + spouse), not a public demo.
- No authentication, no profile picker/toggle in the UI. Applicant name is entered as a field when creating an opportunity, not selected globally.
- Opportunities display as a single shared list, formatted "[Role] – [Company]," sortable by any column.
- Opportunity record fields: company, role, applicant name, `jd_text` (persisted — see below), `company_research` (Call 1 output, cached for the life of the opportunity).
- Documented trade-off: not multi-tenant-safe, sufficient for personal use. Would require real auth to open beyond these two users.
- **Resume is NOT persisted, by design.** Pasted/uploaded fresh, held in memory only for the generation in progress, discarded after. No structured resume profile is stored either — the deliberate minimal-personal-data stance from v1 carries forward unchanged into v2. What *does* carry forward across stages is whatever resume-derived content already made it into a saved prep doc (e.g., the Recruiter Screen prep's Fit Talking Points) — that's reused as context for the next stage's generation, same as any other prior-stage content. Re-uploading the resume for a later stage is optional, not required.
- **JD text is persisted** on the opportunity record. Lower sensitivity than a resume (public posting), and reusing it removes a real friction point across stages.
- Generated preps are grouped under an opportunity so a user can return and view past preps for it.

## User story & verification snapshot

**Story:** As a job seeker, I want a recruiter-screen prep doc generated from my resume, a JD, and current company info, so I walk in prepared.

*Verification:*
- Doc includes all five v1 sections (company snapshot, fit talking points, likely questions, questions to ask, logistics) — none silently missing.
- Talking points reference specific resume content mapped to specific JD language — not generic boilerplate.
- Company info is checkable against a quick manual search — not invented.

**Story:** As a job seeker, I want to return to an opportunity I've already prepped for, so I can review it again without regenerating from scratch.

*Verification:*
- Opportunities list shows company + role, findable without needing to remember exact names.
- Selecting one shows its previously generated prep doc(s) as-is — not regenerated on open.

**Story (v2): Generate the next step.** As a job seeker with a Recruiter Screen prep already done, I want to generate a prep doc for my next stage that builds on it, so I'm not starting cold and it reflects how far I've actually gotten.

*Verification:*
- "Generate Next Step" only appears when exactly 1 stage-prep exists on the opportunity; disappears once 2 exist (hard cap for v2).
- User picks stage type from a dropdown; generated sections match that stage type's template, and Company Snapshot is not repeated in the stage output.
- Output is visibly continuous with the Recruiter Screen prep — no contradictions when placed side by side.
- Resume field is optional on this form; omitting it still produces a valid generation using prior-stage content + JD + company research.

**Story (v2): Add stage-specific context.** As a job seeker, I want to optionally add context for this specific stage (e.g. an interview-invite email), so prep reflects reality, not generic assumptions.

*Verification:*
- Free-text field present, optional.
- Filled-in content demonstrably shapes output; blank doesn't break generation.

**Story (v2): Review without regeneration.** As a returning user, I want to see both preps for an opportunity without them regenerating, so I can review my whole history for it.

*Verification:*
- Company Snapshot is collapsible, collapsed by default, sits above the stage feed.
- Feed shows both stages in reverse-chronological order — newest expanded, prior collapsed to a header (stage name + date), click to re-expand with no new API call.

**Story (v2): JD carries forward, resume doesn't.** As a job seeker, I don't want to re-paste the JD for stage 2, but I want my resume to stay ephemeral.

*Verification:*
- JD reused automatically on stage 2 generation, no re-entry required.
- Resume field starts empty on the stage 2 form, not pre-filled.
- No raw resume text or structured resume profile present in Supabase after generation — spot-checkable directly in the DB.

## Inputs
- **Resume:** paste text or upload PDF/DOCX (parsed via library, not LLM). Never persisted.
- **Job description:** paste text, URL (scraped where possible, clear fallback message when blocked), or PDF upload (same deterministic extraction path as resume). Persisted as `jd_text` on the opportunity once submitted.
- **Interviewer title:** paste text or manually input it

## Grounding & architecture
- **Extraction (deterministic, no LLM):** resume file parsing, JD URL scraping.
- **Call 0 — Field extraction (lightweight, optional path):** when a JD is uploaded as PDF, a small reasoning call identifies company name and role title to pre-fill the form. Always user-editable, never auto-locked.
- **Call 1 — Research (grounded):** Claude API + web search tool. Returns structured company facts (size/industry/funding, recent news, culture/values signals). One search pass, not deep crawling. **Firm requirement: persists for the life of the opportunity, reused across all its stages — not re-run per stage.**
- **Call 2 — Generation (reasoning only, no search tool):** takes resume (if provided) + JD + Call 1's cached output + stage-specific template + (v2 only) prior stage-prep content + optional additional context. Produces that stage's content only — never regenerates Company Snapshot.
- **Mock-to-live:** live from day one, isolated behind a swappable function. Hard-coded example response kept for cost-free manual iteration.
- **Cost guardrail:** no hard cap — used occasionally by two people. Note: v2 stage-2 generation is still a 3-call shape (Call 0 skipped if already parsed, Call 1 skipped since cached, Call 2 runs) — no additional call type introduced versus v1.
- **Deferred to v3:** a rolling-summary mechanism (a stored, LLM-rewritten condensed summary of *all* prior stages) only becomes necessary once chaining goes beyond one hop. Not needed for v2's single-hop case, where the immediately-prior stage-prep's full content is sufficient context.

## Dev & hosting environment
- Build: primarily claude.ai/code (agentic builds, no terminal needed) — consistent with iPad-only constraint. GitHub Codespaces browser IDE available for GUI file editing only.
- Deploy: Vercel (frontend) + Supabase (generated-prep and opportunity storage — never resumes).

## Output — prep doc sections

**Layout:** Company Snapshot is a persistent, collapsible block at the top of the Opportunity Detail page (collapsed by default) — generated once via Call 1, not duplicated per stage. Below it, a reverse-chronological feed of stage-preps, each internally collapsible by section.

**Tone:** candid over supportive throughout. Where a real weakness, stretch, or gap exists, state it plainly.

**Provenance:** each section carries a short label indicating its source, plus a persistent top-of-doc note ("A starting point, not a replacement for the original posting."). Section-level, not per-sentence.
- Company → "From live research — verify independently"
- Fit → "Reasoned from your resume + this JD"
- Expect → "Reasoned — typical for this stage"
- Ask → "Suggested, not from the JD"
- Logistics → "Mixed — research where available, reasoned otherwise"

**Company Snapshot** (once per opportunity, not per stage): size, funding, recent news, culture signal.

**Stage-specific section templates** (no Company Snapshot repeated in any of these):

| Stage | Sections |
|---|---|
| Recruiter Screen | Fit talking points · Likely questions + frameworks · Questions to ask · Logistics |
| Technical/Case | Role fit re: technical requirements · Likely technical/case topics + frameworks (not solutions) · Questions to ask · Logistics |
| Behavioral | Resume-to-JD story mapping · Likely behavioral questions + STAR framing prompts · Questions to ask · Logistics |
| Panel/Onsite | Cross-panel fit synthesis (from prior stage content) · Likely questions by interviewer type if inferable · Questions to ask (varied per panelist) · Logistics |
| Reference Check | What references should emphasize · Likely reference questions · Logistics (no "questions to ask" — candidate isn't in the room) |
| Other | Same 4-section skeleton as Recruiter Screen, generic labels |

## v2 flow

1. **Opportunities List** (unchanged from v1)
2. **New Opportunity form** (unchanged from v1 — schema now includes `jd_text`)
3. **Opportunity Detail page** — Company Snapshot (collapsible, collapsed by default) → stage-prep feed → "Generate Next Step" CTA shown only if exactly 1 stage-prep exists
4. **Generate Next Step form** (new) — stage type dropdown (6 options above), optional additional-context free-text field, optional resume upload, JD shown read-only (reused automatically) → submit runs Call 0 (skipped, JD already parsed) → Call 1 (skipped, cached) → Call 2 (JD + company research + prior stage-prep content + optional resume + additional context) → saves new stage-prep → returns to Opportunity Detail, now showing 2 stages, CTA gone

## v3 design notes (deferred, not in scope yet)
- Remove the 2-stage cap; allow repeated "next step" generation.
- Rolling summary mechanism: a stored, LLM-rewritten condensed summary of all prior stages, updated after each new stage-prep generation — needed once chaining exceeds one hop, since passing full raw content of every prior stage would balloon context/cost.
- Persist interview type sequences (e.g., "Standard onsite loop: Recruiter → Technical → Panel") as reusable patterns, surfaced for new and existing opportunities — new feature, not yet scoped in detail.

## Portfolio-ready checklist (tracked from kickoff, per PORTFOLIO_PROCESS.md)
- [ ] Verification snapshot checked against running app
- [ ] Live company research call working (not mocked)
- [ ] Sample JD/resume seeded for cold-start demo
- [ ] README: why built, what it does, what remains incomplete
- [ ] 2-3 real prep docs generated and reviewed (Keegan + spouse, real JDs)
- [ ] Deployed + linked from `keegan-builds` index
