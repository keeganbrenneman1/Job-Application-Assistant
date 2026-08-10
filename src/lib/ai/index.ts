// Single swappable seam between mock and live generation (see spec
// "Mock-to-live: live from day one, isolated behind a swappable
// function"). Every caller goes through generatePrep() — nothing else in
// the app calls researchCompany/generateStagePrepContent or the mock data
// directly, so the live/mock choice stays in exactly one place.
//
// Also the one place that decides whether Call 1 (research) actually runs:
// pass in the opportunity's already-cached research and it's reused as-is;
// pass null (only true for an opportunity's first stage) and a fresh
// research call is made and returned for the caller to persist.

import { researchCompany } from "@/lib/ai/research";
import { generateStagePrepContent, type PriorStageContext } from "@/lib/ai/generate";
import { MOCK_RESEARCH, mockStageContent } from "@/lib/ai/mock-example";
import { STAGE_SECTIONS } from "@/types";
import type { CompanyResearch, StageContent, StageType } from "@/types";

export interface GeneratePrepParams {
  stageType: StageType;
  stageLabel: string;
  company: string;
  role: string;
  jdText: string;
  existingResearch: CompanyResearch | null;
  resumeText: string | null;
  priorStage: PriorStageContext | null;
  additionalContext: string | null;
  opportunityAdditionalContext: string | null;
  interviewerTitle: string | null;
}

export interface GeneratePrepResult {
  content: StageContent;
  research: CompanyResearch;
  // True when Call 1 actually ran this time (i.e. existingResearch was
  // null) — tells the caller whether it needs to persist a new research
  // value on the opportunity.
  researchIsFresh: boolean;
  source: "live" | "mock";
}

export function isMockMode(): boolean {
  return process.env.MOCK_MODE === "true" || !process.env.ANTHROPIC_API_KEY;
}

export async function generatePrep(params: GeneratePrepParams): Promise<GeneratePrepResult> {
  const {
    stageType,
    stageLabel,
    company,
    role,
    jdText,
    existingResearch,
    resumeText,
    priorStage,
    additionalContext,
    opportunityAdditionalContext,
    interviewerTitle,
  } = params;

  if (isMockMode()) {
    return {
      content: mockStageContent(stageType),
      research: existingResearch ?? MOCK_RESEARCH,
      researchIsFresh: !existingResearch,
      source: "mock",
    };
  }

  const research = existingResearch ?? (await researchCompany(company, role));
  const content = await generateStagePrepContent({
    stageLabel,
    sections: STAGE_SECTIONS[stageType],
    company,
    role,
    jdText,
    research,
    resumeText,
    priorStage,
    additionalContext,
    opportunityAdditionalContext,
    interviewerTitle,
  });

  return { content, research, researchIsFresh: !existingResearch, source: "live" };
}
