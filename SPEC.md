Recruiting Assistant — v1 Spec
Problem
Faster, tailored interview prep grounded in the real job description, the candidate’s resume, and current company information — starting with the recruiter screen stage.
v1 / v-next
	•	v1: recruiter screen only. Static prep doc output. JD + resume + lightweight live company research. Name/profile picker for two known users (no login).
	•	v-next: additional interview stages (behavioral, technical, panel), interactive mock Q&A, stage-by-stage tracker.
User & data model
	•	Named 2-user tool (Keegan + spouse), not a public demo.
	•	No authentication — simple name/profile picker to keep each person’s preps separate.
	•	Documented trade-off: not multi-tenant-safe, sufficient for personal use. Would require real auth to open beyond these two users.
	•	Resume content is personal data; stored only for these two profiles, no public exposure.
User story & verification snapshot
Story: As a job seeker, I want a recruiter-screen prep doc generated from my resume, a JD, and current company info, so I walk in prepared.
Verification snapshot:
	•	Doc includes all five sections (company snapshot, fit talking points, likely questions, questions to ask, logistics) — none silently missing.
	•	Talking points reference specific resume content mapped to specific JD language — not generic boilerplate that could apply to any candidate.
	•	Company info is checkable against a quick manual search — not invented.
Inputs
	•	Resume: paste text or upload PDF/DOCX (parsed via library, not LLM).
	•	Job description: paste text or URL (scraped where possible; falls back to manual paste if scraping is blocked, e.g. LinkedIn/ATS pages).
Grounding & architecture
	•	Extraction (deterministic, no LLM): resume file parsing, JD URL scraping.
	•	Call 1 — Research (grounded): Claude API + web search tool. Returns structured company facts: basic info (size/industry/funding), recent news, culture/values signals. Lightweight — one search pass, not deep crawling.
	•	Call 2 — Generation (reasoning only, no search tool): takes resume + JD + Call 1’s structured output, produces the prep doc content. Kept separate from Call 1 so each can be verified independently.
	•	Mock-to-live: live from day one, isolated behind a swappable function. A hard-coded example response is kept for cost-free manual iteration, not a full mock system — this app doesn’t have TAE’s structural complexity to justify mock-first.
	•	Optional, not required for v1: cache company research per company for a few days, since both users may prep for overlapping companies.
Output — prep doc sections
	1.	Company snapshot (size, funding, recent news, culture signal)
	2.	Role/JD-to-resume fit talking points
	3.	Likely screening questions + short frameworks for answering (not scripted answers)
	4.	Questions to ask the recruiter
	5.	Logistics prep (comp range if findable, availability, work authorization if relevant)
Portfolio-ready checklist (Phase 4, tracked from kickoff)
	•	Verification snapshot checked against running app
	•	Live company research call working (not mocked)
	•	Sample JD/resume seeded for cold-start demo
	•	README: why built, what it does, what remains incomplete
	•	2-3 real prep docs generated and reviewed (Keegan + spouse, real JDs)
	•	Deployed + linked from keegan-builds index
