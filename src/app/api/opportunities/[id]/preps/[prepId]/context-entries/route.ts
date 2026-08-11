import { NextResponse } from "next/server";
import { addContextEntry, getOpportunity } from "@/lib/store";
import type { AddContextEntryRequest, AddContextEntryResponse } from "@/types";

export const runtime = "nodejs";

// v4: appends one entry to a stage's context log (see README's v4 entry +
// ContextEntry in src/types). A stage's log is "open" only while it's the
// opportunity's most-recently-created stage — enforced here regardless of
// what the client sends, same pattern as next-step/route.ts's 2-stage cap
// check. Once a following stage exists, the prior stage's log is closed;
// its full contents already fed that next stage's generation.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; prepId: string }> }
) {
  const { id, prepId } = await params;

  let body: Partial<AddContextEntryRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.body?.trim()) {
    return NextResponse.json({ error: "body is required." }, { status: 400 });
  }

  try {
    const opportunity = await getOpportunity(id);
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }

    const prep = opportunity.preps.find((p) => p.id === prepId);
    if (!prep) {
      return NextResponse.json({ error: "Stage not found." }, { status: 404 });
    }
    if (opportunity.preps[0]?.id !== prepId) {
      return NextResponse.json(
        { error: "This stage's context log is closed — a later stage already exists for this opportunity." },
        { status: 400 }
      );
    }

    await addContextEntry(prepId, body.body.trim());
    const updated = await getOpportunity(id);
    if (!updated) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }

    const response: AddContextEntryResponse = { opportunity: updated };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("add context entry failed", err);
    const message = err instanceof Error ? err.message : "Failed to add context entry.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
