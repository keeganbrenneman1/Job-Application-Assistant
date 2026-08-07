import { NextResponse } from "next/server";
import { deleteOpportunity, getOpportunity } from "@/lib/store";

export const runtime = "nodejs";

// Shared across both profiles — anyone can open or delete any
// opportunity. See JOB APPLICATION ASSISTANT SPEC.md "User & data model" and
// src/lib/store.ts.
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
