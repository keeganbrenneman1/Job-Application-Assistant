# Job Application Assistant — v1 Spec

## Problem
Faster, tailored interview prep grounded in the real job description, the candidate's resume, and current company information — starting with the recruiter screen stage.

## v1 / v2 / v-next
- **v1:** recruiter screen only. Static prep doc output. JD + resume + lightweight live company research. Name/profile picker for two known users (no login).
- **v2:** build a ‘next step’ option in the flow that is the next option and follows the same static prep-doc pattern across the full interview pipeline — behavioral, technical/case, final/panel stages — so it covers the whole process end-to-end, not just one step - as presented to Keegan via  his job search. Use the context of the previous process step when providing support for the current step in the process.
- **v3:** enable the reuse of the ‘next step’ option as many times as is necessary. Persist the interview types and sequences and show them for new and existing opportunities. Use the context of the previous process steps (plural) when providing support for the current step in the process
- **v-next:** interactive mock Q&A, stage-by-stage tracker/dashboard. Lower priority than full-process coverage.

## User & data model
- Named 2-user tool (Keegan + spouse), not a public demo.
- No authentication, no profile picker/toggle in the UI — a global switcher implied personalization that didn't actually exist (it never filtered anything), which was worse than having no concept of "users" at all. Applicant name, if needed, is entered as a field when creating an opportunity, not selected globally.
- Opportunities display as a single shared list, formatted "[Role] – [Company]," sortable by any column.
- Opportunity records should include company, role, and applicant name — applicant name lets the two users tell their own entries apart in a shared list without needing enforced separation.
- Documented trade-off: not multi-tenant-safe, sufficient for personal use. Would require real auth to open beyond these two users.
- Resume is NOT persisted. Pasted/uploaded fresh each session, held only in memory for that generation, discarded after. Only the generated prep doc is saved — minimizes personal data actually sitting in the database.
- Generated preps are grouped under an **opportunity** (company + role), so a user can return and view past preps for that opportunity. Lightweight for v1: no status/stage field, no "advance to next round" action — that's the v-next tracker, kept explicitly separate.

## User story & verification snapshot
**Story:** As a job seeker, I want a recruiter-screen prep doc generated from my resume, a JD, and current company info, so I walk in prepared.

**Verification snapshot:**
- Doc includes all five sections (company snapshot, fit talking points, likely questions, questions to ask, logistics) — none silently missing.
- Talking points reference specific resume content mapped to specific JD language — not generic boilerplate that could apply to any candidate.
- Company info is checkable against a quick manual search — not invented.

**Story:** As a job seeker, I want to return to an opportunity I've already prepped for, so I can review it again without regenerating from scratch.

**Verification snapshot:**
- Opportunities list shows company + role, findable without needing to remember exact names.
- Selecting one shows its previously generated prep doc(s) as-is — not regenerated on open.
- No stage/status field or "advance" action present — confirms this stays lightweight, not the v-next tracker.

## Inputs
- **Resume:** paste text or upload PDF/DOCX (parsed via library, not LLM).
- **Job description:** paste text, URL (scraped where possible, clear fallback message when blocked), or PDF upload (same deterministic extraction path as resume).

## Grounding & architecture
- **Extraction (deterministic, no LLM):** resume file parsing, JD URL scraping.
- **Call 1 — Research (grounded):** Claude API + web search tool. Returns structured company facts: basic info (size/industry/funding), recent news, culture/values signals. Lightweight — one search pass, not deep crawling.
- **Call 2 — Generation (reasoning only, no search tool):** takes resume + JD + Call 1's structured output, produces the prep doc content. Kept separate from Call 1 so each can be verified independently.
- **Call 0 — Field extraction (lightweight, optional path):** when a JD is uploaded as PDF, a small reasoning call identifies company name and role title from the extracted text to pre-fill the form. Not deterministic (unlike the text extraction itself) — results are always user-editable, never auto-locked, since JD formats vary too much to trust blindly.
- **Mock-to-live:** live from day one, isolated behind a swappable function. A hard-coded example response is kept for cost-free manual iteration, not a full mock system — this app doesn't have TAE's structural complexity to justify mock-first.
- **Optional, not required for v1:** cache company research per company for a few days, since both users may prep for overlapping companies.
- **Cost guardrail:** no hard cap for v1 — one search-grounded call per generation, used occasionally by two people, doesn't warrant rate-limiting logic. Documented assumption, revisit if usage pattern changes.

## Dev & hosting environment
- Build: GitHub Codespaces (free tier), consistent with iPad-only constraint.
- Deploy: Vercel (frontend) + Supabase (generated-prep storage only, not resumes) — same stack as Text Analytics Explorer.

## Output — prep doc sections
**Layout:** collapsible sections, not one long scroll — optimized for scanning/jumping to a specific section (e.g. logistics right before a call) rather than re-reading top to bottom.

**Tone:** candid over supportive throughout — the generation prompt should not default to encouraging or uniformly-positive language. Where a real weakness, stretch, or gap exists (fit, likely tough questions, anything else), state it plainly. The goal is an accurate read the user can act on, not motivational copy.

**Provenance:** each section carries a short label indicating its source, plus a persistent top-of-doc note ("A starting point, not a replacement for the original posting."). Section-level, not per-sentence — asking the model to self-tag individual claims is unreliable and risks mislabeling reasoning as sourced fact, which is worse than no label. Labels:
- Company → "From live research — verify independently"
- Fit → "Reasoned from your resume + this JD"
- Expect → "Reasoned — typical for this stage"
- Ask → "Suggested, not from the JD"
- Logistics → "Mixed — research where available, reasoned otherwise"

1. Company snapshot (size, funding, recent news, culture signal)
2. Role/JD-to-resume fit talking points
3. Likely screening questions + short frameworks for answering (not scripted answers)
4. Questions to ask the recruiter
5. Logistics prep (comp range if findable, availability, work authorization if relevant)

## v2 design notes (stage-aware, multi-round prep)
- **Cross-stage context:** each new stage's generation call receives a condensed summary of prior stages for that opportunity — not full raw text — to avoid context/cost ballooning as stages accumulate.
- **Additional context input:** free-text field per stage generation (e.g., pasting an interview-invite email), folded into that stage's prompt alongside JD/resume/prior-stage summary.
- **Company research caching, firm requirement:** Call 1 (research) results persist for the life of the opportunity and are reused across all its stages — not re-run per stage. Supersedes the v1 "optional, time-limited cache" note; a new company search per round of the same opportunity is redundant.
- **Feed layout:** opportunity page shows all generated stage-preps in reverse-chronological order — newest stage expanded at top, prior stages collapsed to a header (stage name + date), click to re-expand.
- **Stage-specific templates:** each stage type (Recruiter Screen, Technical/Case, Behavioral, Panel/Onsite, Reference Check, Other) has its own defined section set. Consistent sections within a stage type, different section sets across stage types — not fully freeform generation, to preserve testable structure/verification snapshots per stage type.
- **Stage selection:** dropdown of common stage types plus free-text "Other," picked by the user when generating a new prep under an existing opportunity — no automatic status/progression tracking (still deferred to v-next).

## Portfolio-ready checklist (tracked from kickoff, per PORTFOLIO_PROCESS.md)
- [ ] Verification snapshot checked against running app
- [ ] Live company research call working (not mocked)
- [ ] Sample JD/resume seeded for cold-start demo
- [ ] README: why built, what it does, what remains incomplete
- [ ] 2-3 real prep docs generated and reviewed (Keegan + spouse, real JDs)
- [ ] Deployed + linked from `keegan-builds` index
