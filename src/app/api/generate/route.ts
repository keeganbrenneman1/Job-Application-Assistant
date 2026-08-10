import { NextResponse } from "next/server";
import { createOpportunity } from "@/lib/store";
import type { GenerateRequest, GenerateResponse } from "@/types";

export const runtime = "nodejs";

// "New Opportunity" step 1 of 3: creates the opportunity record only — no
// Claude calls here. Previously this route also ran Call 1 (research) and
// Call 2 (generation) inline, but that combination — a multi-round
// web-search loop plus a reasoning call, sequentially, in one request —
// routinely approached or exceeded Vercel's function duration limit (60s
// max on the Hobby plan, which this app targets). Splitting research and
// generation into their own requests keeps each one comfortably under that
// limit instead of racing it. The client is expected to follow this call
// with POST /api/opportunities/[id]/regenerate-research (step 2, Call 1
// only) and then POST /api/opportunities/[id]/first-prep (step 3, Call 2
// only — and it reuses whatever research is already cached from step 2
// rather than re-running Call 1, see that route). resumeText is
// deliberately not read here: it's never persisted (see spec "Resume is
// NOT persisted"), so it stays client-side until step 3 needs it.
export async function POST(request: Request) {
  let body: Partial<GenerateRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { applicantName, company, role, jdText, appliedDate, additionalContext } = body;

  if (!applicantName?.trim()) {
    return NextResponse.json({ error: "applicantName is required." }, { status: 400 });
  }
  if (!company?.trim() || !role?.trim()) {
    return NextResponse.json({ error: "company and role are required." }, { status: 400 });
  }
  if (!jdText?.trim()) {
    return NextResponse.json({ error: "jdText is required." }, { status: 400 });
  }

  try {
    const opportunity = await createOpportunity(
      applicantName.trim(),
      company.trim(),
      role.trim(),
      jdText.trim(),
      appliedDate?.trim() || null,
      additionalContext?.trim() || null
    );

    const response: GenerateResponse = { opportunity };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("create opportunity failed", err);
    const message = err instanceof Error ? err.message : "Failed to create the opportunity.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
