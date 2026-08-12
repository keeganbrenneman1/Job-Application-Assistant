import { NextResponse } from "next/server";
import { generatePrep } from "@/lib/ai";
import { addStagePrep, getOpportunity, setOpportunityResearch } from "@/lib/store";
import { NEXT_STEP_STAGE_TYPES, stageLabelFor } from "@/types";
import type { NextStepRequest, NextStepResponse, StageType } from "@/types";

export const runtime = "nodejs";
// See src/app/api/generate/route.ts for why this is set — same Call 1
// latency risk applies here (research is cached once an opportunity has
// its first stage-prep, but Call 2 itself can still run long).
export const maxDuration = 60;

// recruiter_screen deliberately excluded — it's v1's implicit first stage,
// created at opportunity creation and never re-selectable as a next step.
const VALID_STAGE_TYPES = NEXT_STEP_STAGE_TYPES.map((s) => s.id);

// "Generate Next Step" — see spec "v2 flow" step 4. v2's hard cap of 2
// total stage-preps per opportunity is gone as of v5: this route now
// accepts any opportunity with at least one existing stage-prep, however
// many it already has. Context-wise nothing changes stage over stage —
// `priorPrep` below is always just "whatever the most recently created
// prep is," the same single immediately-preceding-stage content + context
// log (v4) it already used for the 1-to-2 transition, simply repeated.
// Deliberately no accumulation across more than one hop and no rolling
// summary — see README's v5 entry for why that's a scoping decision, not
// an oversight. Reuses the opportunity's persisted jdText and cached
// company research — Call 1 does not run again here.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: Partial<NextStepRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { stageType, stageLabel, resumeText, interviewerTitle } = body;

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
    if (opportunity.preps.length === 0) {
      return NextResponse.json(
        { error: "This opportunity has no prep yet — generate the first stage before a next step." },
        { status: 400 }
      );
    }

    const priorPrep = opportunity.preps[0];
    const resolvedStageLabel = stageLabelFor(stageType as StageType, stageLabel);

    // v4: the prior stage's full context log feeds this generation,
    // replacing v2's one-shot per-stage additionalContext request field —
    // see PriorStageContext in src/lib/ai/generate.ts.
    const { content, research, researchIsFresh, source } = await generatePrep({
      stageType: stageType as StageType,
      stageLabel: resolvedStageLabel,
      company: opportunity.company,
      role: opportunity.role,
      jdText: opportunity.jdText,
      existingResearch: opportunity.companyResearch,
      resumeText: resumeText?.trim() || null,
      priorStage: {
        stageLabel: priorPrep.stageLabel,
        content: priorPrep.content,
        contextLog: priorPrep.contextEntries.map((entry) => ({
          body: entry.body,
          createdAt: entry.createdAt,
        })),
      },
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
      null,
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
