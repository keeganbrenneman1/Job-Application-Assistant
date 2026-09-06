import { NextResponse } from "next/server";
import { createProfile, getOpportunity, setOpportunityProfileId } from "@/lib/store";
import type { SaveAsProfileRequest, SaveAsProfileResponse } from "@/types";

export const runtime = "nodejs";

// Post-submit, non-blocking "save as profile" prompt (see story 3): the
// opportunity is already saved by the time this is ever called — this
// route only creates a profiles row from the name + resume the user
// manually typed (profile_id was null on submit) and links it to the
// opportunity that already exists. Never called for a partial submission
// (name only, or resume only) — that trigger check happens client-side,
// before the prompt is even shown.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: Partial<SaveAsProfileRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, resumeText } = body;
  if (!name?.trim() || !resumeText?.trim()) {
    return NextResponse.json({ error: "name and resumeText are required." }, { status: 400 });
  }

  try {
    const opportunity = await getOpportunity(id);
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    if (opportunity.profileId) {
      return NextResponse.json({ error: "Opportunity is already linked to a profile." }, { status: 400 });
    }

    const profile = await createProfile(name.trim(), resumeText.trim());
    await setOpportunityProfileId(id, profile.id);

    const updated = await getOpportunity(id);
    if (!updated) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }

    const response: SaveAsProfileResponse = { profile, opportunity: updated };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("save-as-profile failed", err);
    const message = err instanceof Error ? err.message : "Failed to save profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
