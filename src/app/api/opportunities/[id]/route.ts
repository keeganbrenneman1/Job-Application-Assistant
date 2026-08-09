import { NextResponse } from "next/server";
import { deleteOpportunity, getOpportunity, setOpportunityAppliedDate } from "@/lib/store";

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

// Backfill/edit for applied_date — the only field this route updates,
// deliberately: it needs to be manually editable on the Opportunity
// Detail page regardless of which path created the record (see spec
// supplement "Backfill for existing opportunities"). Pass appliedDate:
// null to clear it.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: { appliedDate?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!("appliedDate" in body)) {
    return NextResponse.json({ error: "appliedDate is required (pass null to clear it)." }, { status: 400 });
  }

  try {
    await setOpportunityAppliedDate(id, body.appliedDate?.trim() || null);
    const opportunity = await getOpportunity(id);
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    return NextResponse.json({ opportunity });
  } catch (err) {
    console.error("update applied date failed", err);
    const message = err instanceof Error ? err.message : "Failed to update applied date.";
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
