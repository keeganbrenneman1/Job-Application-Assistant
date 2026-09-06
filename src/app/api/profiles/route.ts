import { NextResponse } from "next/server";
import { listProfiles } from "@/lib/store";
import type { ListProfilesResponse } from "@/types";

export const runtime = "nodejs";

// Backs the New Opportunity form's optional profile selector. Read-only:
// profiles are created only via the save-as-profile prompt (see
// .../opportunities/[id]/save-as-profile) — there's no POST here, by
// design (no profile management UI this session).
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
