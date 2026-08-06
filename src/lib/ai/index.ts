// Single swappable seam between mock and live generation (see spec
// "Mock-to-live: live from day one, isolated behind a swappable
// function"). Every caller goes through generatePrep() — nothing else in
// the app calls researchCompany/generatePrepContent or the mock data
// directly, so the live/mock choice stays in exactly one place.

import { researchCompany } from "@/lib/ai/research";
import { generatePrepContent } from "@/lib/ai/generate";
import { MOCK_CONTENT, MOCK_RESEARCH } from "@/lib/ai/mock-example";
import type { CompanyResearch, PrepContent } from "@/types";

export interface GeneratePrepResult {
  content: PrepContent;
  research: CompanyResearch;
  source: "live" | "mock";
}

function isMockMode(): boolean {
  return process.env.MOCK_MODE === "true" || !process.env.ANTHROPIC_API_KEY;
}

export async function generatePrep(
  resumeText: string,
  jdText: string,
  company: string,
  role: string
): Promise<GeneratePrepResult> {
  if (isMockMode()) {
    return { content: MOCK_CONTENT, research: MOCK_RESEARCH, source: "mock" };
  }

  const research = await researchCompany(company, role);
  const content = await generatePrepContent(resumeText, jdText, company, role, research);
  return { content, research, source: "live" };
}
