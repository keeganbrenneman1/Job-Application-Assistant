import { NextResponse } from "next/server";
import { generatePrep } from "@/lib/ai";
import { addStagePrep, getOpportunity, setOpportunityJdText, setOpportunityResearch } from "@/lib/store";
import { stageLabelFor } from "@/types";
import type { FirstPrepRequest, FirstPrepResponse } from "@/types";

export const runtime = "nodejs";
// See src/app/api/generate/route.ts for why this is set — same Call 1
// latency risk applies here.
export const maxDuration = 60;

const FIRST_STAGE = "recruiter_screen" as const;

// Completes a "Log Applied" quick-added opportunity (or the tail end of
// "New Opportunity", once its research step has already run — see
// /api/generate): generates the Recruiter Screen prep for an opportunity
// record that already exists. Reuses cached research when present
// (existingResearch below) rather than assuming there is none — Call 1's
// multi-round web-search loop plus Call 2 combined can approach Vercel's
// function duration limit, so callers are expected to run research as its
// own prior step (POST .../regenerate-research) whenever possible, letting
// this route do Call 2 only. Falls back to running Call 1 itself if no
// research is cached yet, so it still works standalone. Only valid while
// the opportunity still has zero stage-preps; once it has one,
// /api/opportunities/[id]/next-step is the route for stage 2.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: Partial<FirstPrepRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { jdText, resumeText } = body;

  if (!jdText?.trim() || !resumeText?.trim()) {
    return NextResponse.json({ error: "jdText and resumeText are required." }, { status: 400 });
  }

  try {
    const opportunity = await getOpportunity(id);
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    if (opportunity.preps.length !== 0) {
      return NextResponse.json(
        { error: "This opportunity already has a prep — use Generate Next Step instead." },
        { status: 400 }
      );
    }

    const stageLabel = stageLabelFor(FIRST_STAGE);
    const { content, research, researchIsFresh, source } = await generatePrep({
      stageType: FIRST_STAGE,
      stageLabel,
      company: opportunity.company,
      role: opportunity.role,
      jdText: jdText.trim(),
      existingResearch: opportunity.companyResearch,
      resumeText: resumeText.trim(),
      priorStage: null,
      opportunityAdditionalContext: opportunity.additionalContext,
      interviewerTitle: null,
    });

    await setOpportunityJdText(opportunity.id, jdText.trim());
    if (researchIsFresh) await setOpportunityResearch(opportunity.id, research);
    const prep = await addStagePrep(opportunity.id, FIRST_STAGE, stageLabel, content, null, null, source);

    const response: FirstPrepResponse = {
      opportunity: { ...opportunity, jdText: jdText.trim(), companyResearch: research },
      prep,
    };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("first-prep generate failed", err);
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  // Note: resumeText above only ever lives in this request's memory and the
  // generation call it feeds — it is never passed to store.ts / persisted.
}
