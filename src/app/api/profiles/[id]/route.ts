import { NextResponse } from "next/server";
import { deleteProfile } from "@/lib/store";

export const runtime = "nodejs";

// v10: the Profiles tab's delete action. Un-links (doesn't delete) any
// opportunity that referenced this profile — see schema.sql's
// `on delete set null` note on opportunities.profile_id.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const deleted = await deleteProfile(id);
    if (!deleted) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("delete profile failed", err);
    const message = err instanceof Error ? err.message : "Failed to delete profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
