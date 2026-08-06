import { NextResponse } from "next/server";
import { getOpportunity } from "@/lib/store";
import type { Profile } from "@/types";

export const runtime = "nodejs";

const VALID_PROFILES: Profile[] = ["keegan", "spouse"];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owner = new URL(request.url).searchParams.get("owner") as Profile | null;

  if (!owner || !VALID_PROFILES.includes(owner)) {
    return NextResponse.json({ error: "owner query param must be 'keegan' or 'spouse'." }, { status: 400 });
  }

  try {
    const opportunity = await getOpportunity(id, owner);
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
