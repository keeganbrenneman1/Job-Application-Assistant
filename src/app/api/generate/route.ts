import { NextResponse } from "next/server";
import { generatePrep } from "@/lib/ai";
import { addStagePrep, createOpportunity, setOpportunityResearch } from "@/lib/store";
import { stageLabelFor } from "@/types";
import type { GenerateRequest, GenerateResponse } from "@/types";

export const runtime = "nodejs";
// Call 1 (research) loops through several web-search rounds before
// producing its final answer and can routinely exceed Vercel's default
// function duration (10s on Hobby) — without this, the platform kills the
// invocation outright before our own try/catch ever gets a chance to run,
// which surfaces client-side as a silent hang rather than a real error.
// 60s is the max Hobby allows without upgrading.
export const maxDuration = 60;

// Always the first stage for a new opportunity — subsequent stages go
// through /api/opportunities/[id]/next-step instead, which reuses the JD
// and cached research this route persists here.
const FIRST_STAGE = "recruiter_screen" as const;

export async function POST(request: Request) {
  let body: Partial<GenerateRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { applicantName, company, role, jdText, resumeText, appliedDate } = body;

  if (!applicantName?.trim()) {
    return NextResponse.json({ error: "applicantName is required." }, { status: 400 });
  }
  if (!company?.trim() || !role?.trim()) {
    return NextResponse.json({ error: "company and role are required." }, { status: 400 });
  }
  if (!jdText?.trim() || !resumeText?.trim()) {
    return NextResponse.json({ error: "jdText and resumeText are required." }, { status: 400 });
  }

  try {
    const stageLabel = stageLabelFor(FIRST_STAGE);
    const { content, research, source } = await generatePrep({
      stageType: FIRST_STAGE,
      stageLabel,
      company: company.trim(),
      role: role.trim(),
      jdText: jdText.trim(),
      existingResearch: null,
      resumeText: resumeText.trim(),
      priorStage: null,
      additionalContext: null,
      opportunityAdditionalContext: null, // no opportunity exists yet at this point — v3's field is set afterward, from the Opportunity Detail page
      interviewerTitle: null,
    });

    const opportunity = await createOpportunity(
      applicantName.trim(),
      company.trim(),
      role.trim(),
      jdText.trim(),
      appliedDate?.trim() || null
    );
    await setOpportunityResearch(opportunity.id, research);
    const prep = await addStagePrep(opportunity.id, FIRST_STAGE, stageLabel, content, null, null, source);

    const response: GenerateResponse = {
      opportunity: { ...opportunity, companyResearch: research },
      prep,
    };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("generate failed", err);
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  // Note: resumeText above only ever lives in this request's memory and the
  // generation call it feeds — it is never passed to store.ts / persisted.
}
