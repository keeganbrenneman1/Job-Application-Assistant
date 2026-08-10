import { NextResponse } from "next/server";
import { generatePrep } from "@/lib/ai";
import { addStagePrep, getOpportunity, setOpportunityResearch } from "@/lib/store";
import { NEXT_STEP_STAGE_TYPES, stageLabelFor } from "@/types";
import type { NextStepRequest, NextStepResponse, StageType } from "@/types";

export const runtime = "nodejs";

// recruiter_screen deliberately excluded — it's v1's implicit first stage,
// created at opportunity creation and never re-selectable as a next step.
const VALID_STAGE_TYPES = NEXT_STEP_STAGE_TYPES.map((s) => s.id);

// v2's "Generate Next Step" — see spec "v2 flow" step 4. Hard capped at 2
// total stage-preps per opportunity for v2 (only appears in the UI when
// exactly 1 exists; enforced here too so the cap holds regardless of what
// the client sends). Reuses the opportunity's persisted jdText and cached
// company research — Call 1 does not run again here.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: Partial<NextStepRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { stageType, stageLabel, resumeText, additionalContext, interviewerTitle } = body;

  if (!stageType || !VALID_STAGE_TYPES.includes(stageType as StageType)) {
    return NextResponse.json(
      { error: `stageType must be one of: ${VALID_STAGE_TYPES.join(", ")}.` },
      { status: 400 }
    );
  }
  if (stageType === "other" && !stageLabel?.trim()) {
    return NextResponse.json({ error: "stageLabel is required when stageType is 'other'." }, { status: 400 });
  }

  try {
    const opportunity = await getOpportunity(id);
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    if (opportunity.preps.length !== 1) {
      return NextResponse.json(
        {
          error:
            opportunity.preps.length === 0
              ? "This opportunity has no prep yet — generate the first stage before a next step."
              : "This opportunity already has 2 stages, the v2 cap. v3 removes this limit.",
        },
        { status: 400 }
      );
    }

    const priorPrep = opportunity.preps[0];
    const resolvedStageLabel = stageLabelFor(stageType as StageType, stageLabel);

    const { content, research, researchIsFresh, source } = await generatePrep({
      stageType: stageType as StageType,
      stageLabel: resolvedStageLabel,
      company: opportunity.company,
      role: opportunity.role,
      jdText: opportunity.jdText,
      existingResearch: opportunity.companyResearch,
      resumeText: resumeText?.trim() || null,
      priorStage: { stageLabel: priorPrep.stageLabel, content: priorPrep.content },
      additionalContext: additionalContext?.trim() || null,
      opportunityAdditionalContext: opportunity.additionalContext,
      interviewerTitle: interviewerTitle?.trim() || null,
    });

    // Defensive only — an opportunity reaching this route should always
    // already have cached research from its first stage.
    if (researchIsFresh) await setOpportunityResearch(opportunity.id, research);

    const prep = await addStagePrep(
      opportunity.id,
      stageType as StageType,
      resolvedStageLabel,
      content,
      additionalContext?.trim() || null,
      interviewerTitle?.trim() || null,
      source
    );

    const response: NextStepResponse = {
      opportunity: { ...opportunity, companyResearch: research },
      prep,
    };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("next-step generate failed", err);
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  // Note: resumeText above only ever lives in this request's memory and the
  // generation call it feeds — it is never passed to store.ts / persisted.
}
