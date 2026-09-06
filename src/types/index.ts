// Shared types for the Job Application Assistant.
// Resume text is deliberately NOT part of most persisted types — for a
// plain opportunity it lives only in the request body of a single
// generation call and is never written to a database, file, or log. The
// one exception is `Profile.resumeText` below: resumes persist only when a
// user explicitly opts into a profile (see the save-as-profile flow).

export type StageType =
  | "recruiter_screen"
  | "technical_case"
  | "behavioral"
  | "hiring_manager"
  | "panel_onsite"
  | "reference_check"
  | "other";

// Full canonical list, including recruiter_screen — used for label lookups
// (stageLabelFor, stage display in the archive/feed) since a stage-1 prep
// is always recruiter_screen. NOT the list to offer as choices when
// generating a stage 2+: recruiter_screen is v1's implicit first stage,
// created at opportunity creation and never re-selected — it should never
// appear as a "Generate Next Step" option (see build brief). Use
// NEXT_STEP_STAGE_TYPES for that.
export const STAGE_TYPES: { id: StageType; label: string }[] = [
  { id: "recruiter_screen", label: "Recruiter Screen" },
  { id: "technical_case", label: "Technical / Case" },
  { id: "behavioral", label: "Behavioral" },
  { id: "hiring_manager", label: "Hiring Manager" },
  { id: "panel_onsite", label: "Panel / Onsite" },
  { id: "reference_check", label: "Reference Check" },
  { id: "other", label: "Other" },
];

// The 6 selectable options for "Generate Next Step" — STAGE_TYPES minus
// recruiter_screen, in the order the build brief specifies.
export const NEXT_STEP_STAGE_TYPES = STAGE_TYPES.filter((s) => s.id !== "recruiter_screen");

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
  hiring_manager: [
    {
      key: "fit",
      label: "Manager & Team Fit",
      subtext: "fit with this manager's stated priorities for the role and team, not generic JD fit",
      provenance: "Reasoned from your resume + this JD",
    },
    {
      key: "questions",
      label: "Likely Questions",
      subtext: "day-to-day scenarios, working style, and what they're solving for — frameworks, not scripts",
      provenance: "Reasoned — typical for this stage",
    },
    {
      key: "ask",
      label: "Ask",
      subtext: "about team dynamics, success metrics, and management style",
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

// Close Opportunity (see README): status doubles as the open/closed state —
// there's no separate "closed" boolean. "open" is the only non-terminal
// value; picking any of the other four both records the outcome and closes
// the opportunity in the same action. No transition back to "open" is ever
// written by any code path — see the close route for where that's enforced.
export type OpportunityStatus = "open" | "offered" | "rejected" | "withdrawn" | "ghosted";

// The 4 selectable closing outcomes — OpportunityStatus minus "open".
export const CLOSE_STATUSES: { id: Exclude<OpportunityStatus, "open">; label: string }[] = [
  { id: "offered", label: "Offered" },
  { id: "rejected", label: "Rejected" },
  { id: "withdrawn", label: "Withdrawn" },
  { id: "ghosted", label: "Ghosted" },
];

export function statusLabelFor(status: OpportunityStatus): string {
  if (status === "open") return "Open";
  return CLOSE_STATUSES.find((s) => s.id === status)?.label ?? status;
}

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
  appliedDate: string | null; // "YYYY-MM-DD"; null until set — quick-added opportunities and pre-this-field ones start null
  // v3: persistent, opportunity-wide running note — separate from each
  // stage prep's one-shot `additionalContext`. Editable in place from the
  // Opportunity Detail page; included as-is in every future Call 2 for
  // this opportunity when non-empty. Not a log/entries table by design.
  additionalContext: string | null;
  // Close Opportunity: "open" until a user explicitly closes it by picking
  // one of the 4 outcomes below. See CLOSE_STATUSES/statusLabelFor above.
  status: OpportunityStatus;
  // Optional context supplied at close time — why it closed the way it
  // did (e.g. "comp came in low", "ghosted after onsite"). Null for open
  // opportunities and for closed ones where the user skipped it. Written
  // once, at close time, and never edited afterward — same one-way
  // guarantee as `status` itself, so it stays a trustworthy record for
  // future across-cycle analysis (why offers happened vs. didn't, common
  // drop-off reasons) even though no such reporting is built yet.
  closeNote: string | null;
  // Optional link to a saved profile this opportunity was created from or
  // later linked to (see Profile below and the save-as-profile flow). Null
  // for every opportunity created by manual entry that was never saved as
  // (or matched to) a profile — the large majority, by design.
  profileId: string | null;
  createdAt: string;
}

// A saved, reusable "who is this opportunity for" — name + resume text —
// created only via the post-submit save-as-profile prompt (see
// SaveAsProfileRequest below). Never created, edited, or deleted through
// any other path this session: no profile management UI. resumeText is
// nullable only for type symmetry with how a row is read back; in practice
// the save-as-profile route always supplies one (see its validation).
export interface Profile {
  id: string;
  name: string;
  resumeText: string | null;
  createdAt: string;
}

// v4: one entry in a stage's append-only context log (see StagePrep.contextEntries
// and PriorStageContext in src/lib/ai/generate.ts). No edit/delete surfaced
// by the app — additive only.
export interface ContextEntry {
  id: string;
  stageId: string; // the StagePrep this entry belongs to
  body: string;
  createdAt: string;
}

export interface StagePrep {
  id: string;
  opportunityId: string;
  stageType: StageType;
  stageLabel: string; // resolved display label (custom text for "other", else the stock label)
  content: StageContent;
  // Pre-v4 one-shot field, set at generation time (v2/v3). No longer
  // written by any code path as of v4 — ContextEntry/contextEntries below
  // replaces it going forward — but left populated on older rows so they
  // keep displaying (see StagePrepCard).
  additionalContext: string | null;
  // v4: this stage's append-only context log, oldest first. Open (new
  // entries addable) while this is the opportunity's most-recently-created
  // stage; once a following stage exists, it's read-only history — its
  // full contents already fed that next stage's generation.
  contextEntries: ContextEntry[];
  interviewerTitle: string | null; // e.g. "CTO", "Senior Engineering Manager" — short, user-entered, not researched
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
  latestInterviewerTitle: string | null;
}

// The New Opportunity form's full input — resumeText is collected here but
// not sent to POST /api/generate (see that route and GenerateResponse
// below); it stays client-side until step 3 (POST .../first-prep) needs it.
export interface GenerateRequest {
  applicantName: string;
  company: string;
  role: string;
  jdText: string;
  resumeText: string;
  appliedDate?: string; // "YYYY-MM-DD"; the New Opportunity form defaults this to today, editable
  // Optional v3 opportunity-level context, supplied up front. Unlike the
  // "Log Applied" path (where this field is added later via the
  // Opportunity Detail page, after the record already exists), New
  // Opportunity has no existing record to attach it to until this request
  // finishes creating one — so it has to travel in on the request itself
  // rather than being read back off an existing record.
  additionalContext?: string;
  // Optional profile selected on the New Opportunity form (see Profile
  // above). Selecting one only prefills applicantName/resumeText
  // client-side — both stay fully editable — but this is what actually
  // links the created opportunity to it. Absent when the user left the
  // selector blank and typed everything manually.
  profileId?: string;
}

// New Opportunity step 1 of 3 (creation only — see POST /api/generate).
// No `prep` here: unlike the old one-shot shape, generation happens in two
// later steps (POST .../regenerate-research, then POST .../first-prep).
export interface GenerateResponse {
  opportunity: Opportunity;
}

export interface NextStepRequest {
  stageType: StageType;
  stageLabel?: string; // required (non-empty) when stageType === "other"
  resumeText?: string;
  // No stage-specific additionalContext field here as of v4 — the prior
  // stage's context log (see ContextEntry) fills that role now, read
  // server-side from the prior stage's own record rather than supplied on
  // this request.
  interviewerTitle?: string; // e.g. "CTO" — referenced explicitly in the Call 2 prompt, not folded into additional context
}

export interface NextStepResponse {
  opportunity: Opportunity;
  prep: StagePrep;
}

// "Log Applied" quick-add (second opportunity-creation entry point,
// alongside GenerateRequest/POST /api/generate): creates the opportunity
// record only — no JD, no resume, no Call 0/1/2, no prep doc. The user
// opens it later to add a JD/resume and generate the Recruiter Screen
// prep once a screen is actually scheduled (see FirstPrepRequest).
export interface LogAppliedRequest {
  applicantName: string;
  company: string;
  role: string;
  appliedDate?: string; // "YYYY-MM-DD"; defaults to today client-side, editable
}

export interface LogAppliedResponse {
  opportunity: Opportunity;
}

// Completes a quick-added opportunity (0 stage-preps so far): supplies the
// JD + resume that Path A collects upfront, and generates the Recruiter
// Screen prep for it. Not for opportunities that already have a prep —
// that's NextStepRequest's job.
export interface FirstPrepRequest {
  jdText: string;
  resumeText: string;
}

// No longer an alias of GenerateResponse — that type dropped `prep` when
// /api/generate stopped generating inline (see GenerateResponse above).
// first-prep still runs Call 2 itself and still returns a real prep.
export interface FirstPrepResponse {
  opportunity: Opportunity;
  prep: StagePrep;
}

// Manual "Regenerate" action on the Company Snapshot block: re-runs Call 1
// only and overwrites the opportunity's cached research. Opportunity-level
// and Call-1-only by design — distinct from a possible future "re-request
// prep doc" action (Call 2 only, per-stage, not built — see README v-next).
export interface RegenerateResearchResponse {
  opportunity: OpportunityWithPreps;
}

// v4: appends one entry to a stage's context log (POST
// .../preps/[prepId]/context-entries). Only valid while that stage is the
// opportunity's most-recently-created one — see that route for the
// "closed" rejection once a following stage exists.
export interface AddContextEntryRequest {
  body: string;
}

export interface AddContextEntryResponse {
  opportunity: OpportunityWithPreps;
}

// v6 "Regenerate" trigger (POST .../preps/[prepId]/regenerate): reruns
// Call 2 for one existing stage prep in place, using that stage's own
// current context log — including entries logged after the prep's
// original generation (corrections, clarifications, additional notes).
// No request body: nothing to configure, same shape as the Company
// Snapshot Regenerate action. Full-doc regeneration only, never
// section-level — see README v-next for why that's a separate, backlogged
// feature. Valid on any existing stage prep, open or closed log alike —
// this only reads the log, it never writes to it.
export interface RegeneratePrepResponse {
  opportunity: OpportunityWithPreps;
}

// Close Opportunity (POST .../close): picks one of the 4 closing outcomes
// and closes the opportunity in the same action — see OpportunityStatus.
// Only valid while status is still "open"; the route rejects this once an
// opportunity is already closed (no reopen path — see README). `note` is
// optional free text captured at close time — see Opportunity.closeNote.
export interface CloseOpportunityRequest {
  status: Exclude<OpportunityStatus, "open">;
  note?: string;
}

export interface CloseOpportunityResponse {
  opportunity: OpportunityWithPreps;
}

// GET /api/profiles: every saved profile, for the New Opportunity form's
// optional selector. No filtering/pagination — this is a 2-person tool
// with a handful of profiles at most, same trade-off as listOpportunities.
export interface ListProfilesResponse {
  profiles: Profile[];
}

// POST /api/opportunities/[id]/save-as-profile: the post-submit prompt's
// only action (see story 3). Trigger condition — profileId was null on
// submit AND both fields were manually typed (non-empty) — is checked
// client-side before this prompt is even shown; the route itself only
// re-validates that both fields are non-empty and that the opportunity
// isn't already linked to a profile.
export interface SaveAsProfileRequest {
  name: string;
  resumeText: string;
}

export interface SaveAsProfileResponse {
  profile: Profile;
  opportunity: OpportunityWithPreps;
}

// v10: the Profiles tab's "New Profile" form — creates a profile directly,
// unlike the save-as-profile flow above which is always tied to the
// opportunity it was triggered from. resumeText is optional here (unlike
// SaveAsProfileRequest's, which requires both fields non-empty) since
// there's no edit path — only delete + recreate — so a name-only profile
// should still be creatable.
export interface CreateProfileRequest {
  name: string;
  resumeText?: string;
}

export interface CreateProfileResponse {
  profile: Profile;
}
