// Call 0 — Field extraction (lightweight, optional path). When a JD is
// uploaded as PDF, this small reasoning call identifies the company name
// and role title from the extracted text to pre-fill the New Prep form.
// Not deterministic (unlike the text extraction itself feeding it) — the
// caller must always treat the result as an editable suggestion, never
// auto-locked, since JD formats vary too much to trust blindly (see
// JOB APPLICATION ASSISTANT SPEC.md "Call 0 — Field extraction"). Best-effort: any
// failure here is swallowed and returns nulls rather than blocking the
// upload, since this is a convenience prefill, not part of the core
// generation pipeline.

import { getAnthropic, MODEL } from "@/lib/ai/client";
import { getFinalText } from "@/lib/ai/response-text";
import { parseJsonResponse } from "@/lib/ai/json-response";
import { isMockMode } from "@/lib/ai";

const SYSTEM_PROMPT = `Identify the hiring company name and the job title/role from this job description text.

Respond with ONLY a JSON object (no markdown fences, no commentary):
{
  "company": "string, or null if you can't confidently identify it",
  "role": "string, or null if you can't confidently identify it"
}
Do not guess — return null rather than a low-confidence answer. This will be parsed by a strict JSON parser — never put a literal double-quote character inside a string value.`;

export interface JdFields {
  company: string | null;
  role: string | null;
}

export async function extractJdFields(jdText: string): Promise<JdFields> {
  // Skip silently in mock mode rather than maintaining a second mock
  // fixture just for this convenience prefill.
  if (isMockMode()) {
    return { company: null, role: null };
  }

  try {
    const anthropic = getAnthropic();
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 200,
      // See src/lib/ai/research.ts for why this is explicit: claude-sonnet-5
      // defaults to adaptive thinking, which could consume this call's
      // already-tight 200-token budget before it ever writes the JSON
      // answer.
      thinking: { type: "disabled" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: jdText.slice(0, 6000) }],
    });

    const text = getFinalText(message.content, message.stop_reason);
    const parsed = parseJsonResponse<Partial<JdFields>>(text, "JD field extraction", message.stop_reason);
    return {
      company: typeof parsed.company === "string" ? parsed.company : null,
      role: typeof parsed.role === "string" ? parsed.role : null,
    };
  } catch (err) {
    console.error("JD field extraction failed (non-blocking):", err);
    return { company: null, role: null };
  }
}
