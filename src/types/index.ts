// Shared types for the Job Application Assistant.
// Resume text is deliberately NOT part of any persisted type — it lives only
// in the request body of a single generation call and is never written
// to a database, file, or log (see spec "Resume is NOT persisted").

export type StageType =
  | "recruiter_screen"
  | "technical_case"
  | "behavioral"
  | "panel_onsite"
  | "reference_check"
  | "other";

export const STAGE_TYPES: { id: StageType; label: string }[] = [
  { id: "recruiter_screen", label: "Recruiter Screen" },
  { id: "technical_case", label: "Technical / Case" },
  { id: "behavioral", label: "Behavioral" },
  { id: "panel_onsite", label: "Panel / Onsite" },
  { id: "reference_check", label: "Reference Check" },
  { id: "other", label: "Other" },
];

export function stageLabelFor(stageType: StageType, customLabel?: string | null): string {
  if (stageType === "other" && customLabel?.trim()) return customLabel.trim();
  return STAGE_TYPES.find((s) => s.id === stageType)?.label ?? "Other";
}

export interface StageSectionDef {
  key: string;
  label: string;
  subtext: string;
  provenance: string;
}

// Per-stage section templates (spec "Output — prep doc sections"). Company
// Snapshot is deliberately absent from every one of these — it lives once
// per opportunity, not per stage. Each stage type keeps a consistent,
// testable section set rather than fully freeform generation.
export const STAGE_SECTIONS: Record<StageType, StageSectionDef[]> = {
  recruiter_screen: [
    {
      key: "fit",
      label: "Fit",
      subtext: "where your background matches what they're asking for",
      provenance: "Reasoned from your resume + this JD",
    },
    {
      key: "expect",
      label: "Expect",
      subtext: "likely questions and how to frame your answers",
      provenance: "Reasoned — typical for this stage",
    },
    {
      key: "ask",
      label: "Ask",
      subtext: "good questions to ask them",
      provenance: "Suggested, not from the JD",
    },
    {
      key: "logistics",
      label: "Logistics",
      subtext: "comp, availability, and practical details to confirm",
      provenance: "Mixed — research where available, reasoned otherwise",
    },
  ],
  technical_case: [
    {
      key: "fit",
      label: "Role Fit",
      subtext: "how your background matches the technical requirements",
      provenance: "Reasoned from your resume + this JD",
    },
    {
      key: "topics",
      label: "Likely Topics",
      subtext: "likely technical/case topics + frameworks (not solutions)",
      provenance: "Reasoned — typical for this stage",
    },
    {
      key: "ask",
      label: "Ask",
      subtext: "good questions to ask them",
      provenance: "Suggested, not from the JD",
    },
    {
      key: "logistics",
      label: "Logistics",
      subtext: "comp, availability, and practical details to confirm",
      provenance: "Mixed — research where available, reasoned otherwise",
    },
  ],
  behavioral: [
    {
      key: "stories",
      label: "Story Mapping",
      subtext: "resume-to-JD story mapping",
      provenance: "Reasoned from your resume + this JD",
    },
    {
      key: "questions",
      label: "Likely Questions",
      subtext: "likely behavioral questions + STAR framing prompts",
      provenance: "Reasoned — typical for this stage",
    },
    {
      key: "ask",
      label: "Ask",
      subtext: "good questions to ask them",
      provenance: "Suggested, not from the JD",
    },
    {
      key: "logistics",
      label: "Logistics",
      subtext: "comp, availability, and practical details to confirm",
      provenance: "Mixed — research where available, reasoned otherwise",
    },
  ],
  panel_onsite: [
    {
      key: "synthesis",
      label: "Cross-Panel Fit",
      subtext: "fit synthesis pulled from prior stage content",
      provenance: "Reasoned from prior stage content",
    },
    {
      key: "questions",
      label: "Likely Questions",
      subtext: "by interviewer type, where inferable",
      provenance: "Reasoned — typical for this stage",
    },
    {
      key: "ask",
      label: "Ask",
      subtext: "questions to ask, varied per panelist",
      provenance: "Suggested, not from the JD",
    },
    {
      key: "logistics",
      label: "Logistics",
      subtext: "comp, availability, and practical details to confirm",
      provenance: "Mixed — research where available, reasoned otherwise",
    },
  ],
  reference_check: [
    {
      key: "emphasize",
      label: "What References Should Emphasize",
      subtext: "the points your references should hit",
      provenance: "Reasoned from your resume + this JD",
    },
    {
      key: "questions",
      label: "Likely Reference Questions",
      subtext: "what the reference-checker will likely ask",
      provenance: "Reasoned — typical for this stage",
    },
    {
      key: "logistics",
      label: "Logistics",
      subtext: "practical details to confirm — no questions-to-ask, you're not in the room",
      provenance: "Mixed — research where available, reasoned otherwise",
    },
  ],
  other: [
    {
      key: "fit",
      label: "Fit",
      subtext: "where your background matches what they're asking for",
      provenance: "Reasoned from your resume + this JD",
    },
    {
      key: "expect",
      label: "Expect",
      subtext: "likely questions and how to frame your answers",
      provenance: "Reasoned — typical for this stage",
    },
    {
      key: "ask",
      label: "Ask",
      subtext: "good questions to ask them",
      provenance: "Suggested, not from the JD",
    },
    {
      key: "logistics",
      label: "Logistics",
      subtext: "comp, availability, and practical details to confirm",
      provenance: "Mixed — research where available, reasoned otherwise",
    },
  ],
};

export interface CompanyResearch {
  basicInfo: string; // size / industry / funding
  recentNews: string;
  culture: string;
  sources: string[];
}

// Dynamic: keys match the section keys for the stage type the content was
// generated under (see STAGE_SECTIONS). Never includes a "company" key —
// Company Snapshot lives on the opportunity, not on a stage prep.
export type StageContent = Record<string, string>;

export interface Opportunity {
  id: string;
  applicantName: string;
  company: string;
  role: string;
  jdText: string;
  companyResearch: CompanyResearch | null;
  createdAt: string;
}

export interface StagePrep {
  id: string;
  opportunityId: string;
  stageType: StageType;
  stageLabel: string; // resolved display label (custom text for "other", else the stock label)
  content: StageContent;
  additionalContext: string | null;
  source: "live" | "mock";
  createdAt: string;
}

export interface OpportunityWithPreps extends Opportunity {
  preps: StagePrep[];
}

export interface OpportunitySummary extends Opportunity {
  latestPrepAt: string | null;
  stageCount: number;
  latestStageLabel: string | null;
}

export interface GenerateRequest {
  applicantName: string;
  company: string;
  role: string;
  jdText: string;
  resumeText: string;
}

export interface GenerateResponse {
  opportunity: Opportunity;
  prep: StagePrep;
}

export interface NextStepRequest {
  stageType: StageType;
  stageLabel?: string; // required (non-empty) when stageType === "other"
  resumeText?: string;
  additionalContext?: string;
}

export interface NextStepResponse {
  opportunity: Opportunity;
  prep: StagePrep;
}
