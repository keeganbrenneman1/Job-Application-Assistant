import { NextResponse } from "next/server";
import { listOpportunities } from "@/lib/store";

export const runtime = "nodejs";

// Shared across both users — see spec "User & data model" and
// src/lib/store.ts. No applicant filter here.
export async function GET() {
  try {
    const opportunities = await listOpportunities();
    return NextResponse.json({ opportunities });
  } catch (err) {
    console.error("list opportunities failed", err);
    const message = err instanceof Error ? err.message : "Failed to list opportunities.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
