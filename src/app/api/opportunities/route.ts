import { NextResponse } from "next/server";
import { listOpportunities } from "@/lib/store";
import type { Profile } from "@/types";

export const runtime = "nodejs";

const VALID_PROFILES: Profile[] = ["keegan", "spouse"];

export async function GET(request: Request) {
  const owner = new URL(request.url).searchParams.get("owner") as Profile | null;

  if (!owner || !VALID_PROFILES.includes(owner)) {
    return NextResponse.json({ error: "owner query param must be 'keegan' or 'spouse'." }, { status: 400 });
  }

  try {
    const opportunities = await listOpportunities(owner);
    return NextResponse.json({ opportunities });
  } catch (err) {
    console.error("list opportunities failed", err);
    const message = err instanceof Error ? err.message : "Failed to list opportunities.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
