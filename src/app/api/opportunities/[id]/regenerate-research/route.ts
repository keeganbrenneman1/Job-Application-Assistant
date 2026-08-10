import { NextResponse } from "next/server";
import { regenerateResearch } from "@/lib/ai";
import { getOpportunity, setOpportunityResearch } from "@/lib/store";
import type { RegenerateResearchResponse } from "@/types";

export const runtime = "nodejs";

// Manual, opportunity-level refresh of Call 1 (research) — for when the
// cached Company Snapshot came back malformed/incomplete (see
// src/lib/ai/research.ts's per-field "Not found." fallback). Unlike
// generatePrep's existingResearch reuse, this always re-runs Call 1 and
// unconditionally overwrites the cached value, shared across every stage
// on this opportunity. Deliberately Call-1-only, not a stage-prep
// regenerate — see RegenerateResearchResponse in src/types/index.ts.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
