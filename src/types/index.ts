// Shared types for the Job Application Assistant.
// Resume text is deliberately NOT part of any persisted type — it lives only
// in the request body of a single /api/generate call and is never written
// to a database, file, or log (see job-assistant-spec.md "User & data model").

export type Profile = "keegan" | "spouse";

export const PROFILES: { id: Profile; label: string }[] = [
  { id: "keegan", label: "Keegan" },
  { id: "spouse", label: "Spouse" },
];

export interface CompanyResearch {
  basicInfo: string; // size / industry / funding
  recentNews: string;
  culture: string;
  sources: string[];
}

export interface PrepContent {
  company: string; // company snapshot (size, funding, recent news, culture signal)
  fit: string; // role/JD-to-resume fit talking points
  expect: string; // likely screening questions + short frameworks
  ask: string; // questions to ask the recruiter
  logistics: string; // comp range if findable, availability, work authorization
}

export interface Opportunity {
  id: string;
  owner: Profile;
  company: string;
  role: string;
  createdAt: string;
}

export interface Prep {
  id: string;
  opportunityId: string;
  content: PrepContent;
  research: CompanyResearch | null;
  source: "live" | "mock";
  createdAt: string;
}

export interface OpportunityWithPreps extends Opportunity {
  preps: Prep[];
}

export interface OpportunitySummary extends Opportunity {
  latestPrepAt: string | null;
}

export interface GenerateRequest {
  owner: Profile;
  company: string;
  role: string;
  jdText: string;
  resumeText: string;
}

export interface GenerateResponse {
  opportunity: Opportunity;
  prep: Prep;
}
