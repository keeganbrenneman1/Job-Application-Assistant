# Recruiting Assistant
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
In build. Spec and interactive prototype complete — see SPEC.md . Live implementation
## What’s not built yet
Additional interview stages beyond recruiter screen (v2)
Interactive mock Q&A, stage tracker (v-next)
Actual PDF/DOCX resume parsing and JD URL scraping (prototype uses paste-only)
## Stack
GitHub Codespaces (build) → Vercel + Supabase (deploy). Claude API with web search tool
for the grounded research call.
## Process
Built using a spec-first, prototype-before-code process — see SPEC.md decisions and .claude/agents/ for the review checklists used during build.
for full architecture
