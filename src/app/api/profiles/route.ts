import { NextResponse } from "next/server";
import { createProfile, listProfiles } from "@/lib/store";
import type { CreateProfileRequest, CreateProfileResponse, ListProfilesResponse } from "@/types";

export const runtime = "nodejs";

// Backs the New Opportunity form's optional profile selector, and the
// Profiles tab's own list.
export async function GET() {
  try {
    const profiles = await listProfiles();
    const response: ListProfilesResponse = { profiles };
    return NextResponse.json(response);
  } catch (err) {
    console.error("list profiles failed", err);
    const message = err instanceof Error ? err.message : "Failed to list profiles.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// v10: the Profiles tab's "New Profile" form. Distinct from the
// save-as-profile route (which requires an existing opportunity and both
// fields non-empty) — this creates a profile directly, resume optional.
export async function POST(request: Request) {
  let body: Partial<CreateProfileRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, resumeText } = body;
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  try {
    const profile = await createProfile(name.trim(), resumeText?.trim() || null);
    const response: CreateProfileResponse = { profile };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("create profile failed", err);
    const message = err instanceof Error ? err.message : "Failed to create profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
