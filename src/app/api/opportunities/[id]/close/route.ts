import { NextResponse } from "next/server";
import { getOpportunity, setOpportunityStatus } from "@/lib/store";
import { CLOSE_STATUSES } from "@/types";
import type { CloseOpportunityRequest, CloseOpportunityResponse, OpportunityStatus } from "@/types";

export const runtime = "nodejs";

const VALID_CLOSE_STATUSES = CLOSE_STATUSES.map((s) => s.id);

// Close Opportunity: picks one of the 4 closing outcomes (Offered /
// Rejected / Withdrawn / Ghosted) and closes the opportunity in the same
// action — there's no separate "closed" state independent of status (see
// OpportunityStatus in src/types). One-way: once status is anything other
// than "open" this route refuses to change it again — no reopen path, by
// design (see README "No reopen path"). The confirmation step lives
// client-side (OpportunityDetail); this route re-validates the "still
// open" precondition server-side regardless of what the client believes.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: Partial<CloseOpportunityRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { status } = body;
  if (!status || !VALID_CLOSE_STATUSES.includes(status as Exclude<OpportunityStatus, "open">)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_CLOSE_STATUSES.join(", ")}.` },
      { status: 400 }
    );
  }

  try {
    const opportunity = await getOpportunity(id);
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    if (opportunity.status !== "open") {
      return NextResponse.json(
        { error: "This opportunity is already closed and cannot be reopened or re-closed." },
        { status: 400 }
      );
    }

    await setOpportunityStatus(id, status);
    const updated = await getOpportunity(id);
    if (!updated) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }

    const response: CloseOpportunityResponse = { opportunity: updated };
    return NextResponse.json(response);
  } catch (err) {
    console.error("close opportunity failed", err);
    const message = err instanceof Error ? err.message : "Failed to close opportunity.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
