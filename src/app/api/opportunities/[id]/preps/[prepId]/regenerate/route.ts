import { NextResponse } from "next/server";
import { generatePrep } from "@/lib/ai";
import { getOpportunity, updateStagePrepContent } from "@/lib/store";
import type { RegeneratePrepResponse } from "@/types";

export const runtime = "nodejs";
// See src/app/api/generate/route.ts for why this is set — this route runs
// Call 2, same latency risk as first-prep/next-step.
export const maxDuration = 60;

// v6 "Regenerate" trigger (README's "re-request prep doc", mostly absorbed
// into the v4 stage-log work): reruns Call 2 for one existing stage prep,
// in place, using that stage's own current context log — including any
// entries logged after the prep's original generation (corrections,
// clarifications, an invite email pasted in later). No request body —
// nothing to configure. Full-doc regeneration only, never section-level
// (see README v-next: section-level regen is a distinct, backlogged
// feature, not built here). Call 2 only: company research stays cached and
// is never re-run here — see regenerate-research/route.ts for the separate,
// Call-1-only, opportunity-wide action. Valid on any existing stage prep,
// whether its own log is still open (this is the newest stage) or closed
// (a later stage already exists) — this only reads the log, it never
// writes to it, so "closed" doesn't apply here the way it does for adding
// a new entry (see context-entries/route.ts).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; prepId: string }> }
) {
  const { id, prepId } = await params;

  try {
    const opportunity = await getOpportunity(id);
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }

    // preps is newest-first (see getOpportunity) — the stage immediately
    // before this one in time, i.e. whatever "prior stage" originally fed
    // this prep's generation, sits at the next index. Undefined only when
    // this is the opportunity's first (Recruiter Screen) stage.
    const prepIndex = opportunity.preps.findIndex((p) => p.id === prepId);
    if (prepIndex === -1) {
      return NextResponse.json({ error: "Stage not found." }, { status: 404 });
    }
    if (!opportunity.companyResearch) {
      return NextResponse.json(
        { error: "This opportunity has no cached company research yet — regenerate research first." },
        { status: 400 }
      );
    }

    const prep = opportunity.preps[prepIndex];
    const priorPrep = opportunity.preps[prepIndex + 1] ?? null;

    const { content, source } = await generatePrep({
      stageType: prep.stageType,
      stageLabel: prep.stageLabel,
      company: opportunity.company,
      role: opportunity.role,
      jdText: opportunity.jdText,
      existingResearch: opportunity.companyResearch,
      resumeText: null,
      priorStage: priorPrep
        ? {
            stageLabel: priorPrep.stageLabel,
            content: priorPrep.content,
            contextLog: priorPrep.contextEntries.map((entry) => ({
              body: entry.body,
              createdAt: entry.createdAt,
            })),
          }
        : null,
      opportunityAdditionalContext: opportunity.additionalContext,
      interviewerTitle: prep.interviewerTitle,
      ownContextLog: prep.contextEntries.map((entry) => ({
        body: entry.body,
        createdAt: entry.createdAt,
      })),
    });

    await updateStagePrepContent(prepId, content, source);

    const updated = await getOpportunity(id);
    if (!updated) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }

    const response: RegeneratePrepResponse = { opportunity: updated };
    return NextResponse.json(response);
  } catch (err) {
    console.error("regenerate prep failed", err);
    const message = err instanceof Error ? err.message : "Failed to regenerate prep doc.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
