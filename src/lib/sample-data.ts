// Seeded sample JD + resume for a cold-start demo (portfolio checklist
// item in JOB APPLICATION ASSISTANT SPEC.md). Lets a fresh install show the full
// generate → dossier flow without needing a real resume on hand.

export const SAMPLE_APPLICANT_NAME = "Keegan";
export const SAMPLE_COMPANY = "Northline";
export const SAMPLE_ROLE = "Senior Product Manager, Platform";

export const SAMPLE_JD = `Northline — Senior Product Manager, Platform

Northline builds warehouse-routing and logistics software for mid-market 3PLs. We're hiring a Senior PM to own our platform layer: the internal APIs and data pipelines that every customer-facing product team builds on.

What you'll do:
- Turn messy operational data (routing events, warehouse telemetry, partner API feeds) into clear product decisions
- Work directly with 3-4 engineers in a low-meeting, ship-first culture
- Own the roadmap for platform reliability and internal developer experience
- Comfortable with ambiguous, unstructured inputs — most of what you'll work with doesn't come in a clean schema

What we're looking for:
- 5+ years PM experience, ideally with a platform or data-heavy product
- Track record shipping under real constraints (small team, limited infra budget)
- Comfortable writing SQL and reading API docs directly rather than routing everything through engineering

This role reports to the Head of Product. Recruiter screen is 30 minutes.`;

export const SAMPLE_RESUME = `Jordan Rivera
Product Manager

Experience

Text Analytics Explorer — Founder / Solo Builder (2025-2026)
Built a mock-to-live extraction pipeline for a CX analytics tool: deterministic parsing for structured inputs, a separate grounded-research call, and a swappable mock/live seam to keep iteration cost-free. Shipped solo on a free-tier stack (Codespaces, Vercel, Supabase) under real infra constraints.

Meridian Health — Product Manager, Data Platform (2022-2025)
Owned the internal event pipeline consumed by 6 downstream product teams. Turned raw, unstructured clinical intake data into a queryable dataset that cut manual triage time by 40%. Worked in a 4-person pod with a strict no-extra-meetings norm.

Fenwick Logistics — Associate PM (2020-2022)
Shipped a partner-API ingestion layer handling inconsistent, undocumented third-party schemas. Wrote most of the initial SQL and API-mapping logic directly rather than spec'ing it out to engineering.

Skills: SQL, API design, ambiguous data wrangling, roadmap ownership, scoping under infra constraints.`;
