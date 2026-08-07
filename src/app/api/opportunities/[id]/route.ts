import { NextResponse } from "next/server";
import { getOpportunity } from "@/lib/store";

export const runtime = "nodejs";

// Shared across both profiles — anyone can open any opportunity. See
// job-assistant-spec.md "User & data model" and src/lib/store.ts.
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
