import { NextResponse } from "next/server";
import { createOpportunity, listOpportunities } from "@/lib/store";
import type { LogAppliedRequest, LogAppliedResponse } from "@/types";

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

// "Log Applied" quick-add — the second opportunity-creation entry point.
// Creates the opportunity record only: no JD, no resume, no Call 0/1/2, no
// prep doc. Distinct from /api/generate, which always creates the
// opportunity AND immediately generates its Recruiter Screen prep. Once
// this record exists, /api/opportunities/[id]/first-prep completes it
// later when a screen is actually scheduled.
export async function POST(request: Request) {
  let body: Partial<LogAppliedRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { applicantName, company, role, appliedDate } = body;

  if (!applicantName?.trim()) {
    return NextResponse.json({ error: "applicantName is required." }, { status: 400 });
  }
  if (!company?.trim() || !role?.trim()) {
    return NextResponse.json({ error: "company and role are required." }, { status: 400 });
  }

  try {
    const opportunity = await createOpportunity(
      applicantName.trim(),
      company.trim(),
      role.trim(),
      "",
      appliedDate?.trim() || null,
      null
    );

    const response: LogAppliedResponse = { opportunity };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("log-applied create failed", err);
    const message = err instanceof Error ? err.message : "Failed to log the opportunity.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
