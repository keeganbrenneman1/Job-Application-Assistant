import { NextResponse } from "next/server";
import { regenerateResearch } from "@/lib/ai";
import { getOpportunity, setOpportunityResearch } from "@/lib/store";
import type { RegenerateResearchResponse } from "@/types";

export const runtime = "nodejs";
// See src/app/api/generate/route.ts for why this is set — this route
// always runs Call 1 fresh, so it's the one most exposed to this.
export const maxDuration = 60;

// Manual, opportunity-level refresh of Call 1 (research) — for when the
// cached Company Snapshot came back malformed/incomplete (see
// src/lib/ai/research.ts's per-field "Not found." fallback). Unlike
// generatePrep's existingResearch reuse, this always re-runs Call 1 and
// unconditionally overwrites the cached value, shared across every stage
// on this opportunity. Deliberately Call-1-only, not a stage-prep
// regenerate — see RegenerateResearchResponse in src/types/index.ts.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Diagnostic only: confirms the invocation actually reached this
  // function (as opposed to being dropped/blocked before reaching Vercel,
  // or hanging silently inside the Claude call below with nothing else in
  // this route logged until the catch block).
  console.log(`[regenerate-research] request received for opportunity ${id}`);

  try {
    const opportunity = await getOpportunity(id);
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }

    const research = await regenerateResearch(opportunity.company, opportunity.role);
    await setOpportunityResearch(opportunity.id, research);

    const response: RegenerateResearchResponse = {
      opportunity: { ...opportunity, companyResearch: research },
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("regenerate research failed", err);
    const message = err instanceof Error ? err.message : "Failed to regenerate company research.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
