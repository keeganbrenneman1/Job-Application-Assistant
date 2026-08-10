import { NextResponse } from "next/server";
import {
  deleteOpportunity,
  getOpportunity,
  setOpportunityAdditionalContext,
  setOpportunityAppliedDate,
} from "@/lib/store";

export const runtime = "nodejs";

// Shared across both users — anyone can open or delete any
// opportunity. See spec "User & data model" and src/lib/store.ts.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const opportunity = await getOpportunity(id);
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    return NextResponse.json({ opportunity });
  } catch (err) {
    console.error("get opportunity failed", err);
    const message = err instanceof Error ? err.message : "Failed to load opportunity.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Backfill/edit for applied_date and (v3) the opportunity-wide additional-
// context running note — the only two fields this route updates,
// deliberately: both need to be manually editable on the Opportunity
// Detail page regardless of which path created the record (see spec
// supplement "Backfill for existing opportunities" and the v3 brief).
// Pass either as null to clear it; at least one of the two must be present.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: { appliedDate?: string | null; additionalContext?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!("appliedDate" in body) && !("additionalContext" in body)) {
    return NextResponse.json(
      { error: "appliedDate and/or additionalContext is required (pass null to clear either)." },
      { status: 400 }
    );
  }

  try {
    if ("appliedDate" in body) {
      await setOpportunityAppliedDate(id, body.appliedDate?.trim() || null);
    }
    if ("additionalContext" in body) {
      await setOpportunityAdditionalContext(id, body.additionalContext?.trim() || null);
    }
    const opportunity = await getOpportunity(id);
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    return NextResponse.json({ opportunity });
  } catch (err) {
    console.error("update opportunity failed", err);
    const message = err instanceof Error ? err.message : "Failed to update opportunity.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const deleted = await deleteOpportunity(id);
    if (!deleted) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("delete opportunity failed", err);
    const message = err instanceof Error ? err.message : "Failed to delete opportunity.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
