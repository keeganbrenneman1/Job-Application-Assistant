import { NextResponse } from "next/server";
import { generatePrep } from "@/lib/ai";
import { addPrep, createOpportunity } from "@/lib/store";
import type { GenerateRequest, GenerateResponse, Profile } from "@/types";

export const runtime = "nodejs";

const VALID_PROFILES: Profile[] = ["keegan", "spouse"];

export async function POST(request: Request) {
  let body: Partial<GenerateRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { owner, company, role, jdText, resumeText } = body;

  if (!owner || !VALID_PROFILES.includes(owner)) {
    return NextResponse.json({ error: "owner must be 'keegan' or 'spouse'." }, { status: 400 });
  }
  if (!company?.trim() || !role?.trim()) {
    return NextResponse.json({ error: "company and role are required." }, { status: 400 });
  }
  if (!jdText?.trim() || !resumeText?.trim()) {
    return NextResponse.json({ error: "jdText and resumeText are required." }, { status: 400 });
  }

  try {
    const { content, research, source } = await generatePrep(
      resumeText,
      jdText,
      company.trim(),
      role.trim()
    );

    const opportunity = await createOpportunity(owner, company.trim(), role.trim());
    const prep = await addPrep(opportunity.id, content, research, source);

    const response: GenerateResponse = { opportunity, prep };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("generate failed", err);
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  // Note: resumeText above only ever lives in this request's memory and the
  // two AI calls it feeds — it is never passed to store.ts / persisted.
}
