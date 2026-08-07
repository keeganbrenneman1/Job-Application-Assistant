// Call 2 — Generation (reasoning only, no search tool). Takes the resume,
// the JD, and Call 1's structured research output, and produces the prep
// doc content. Deliberately has no tool access — it must reason over the
// grounded facts it's given, not go fetch new ones (see spec
// "Grounding & architecture").

import { getAnthropic, MODEL } from "@/lib/ai/client";
import { getFinalText, parseJsonResponse } from "@/lib/ai/json-response";
import type { CompanyResearch, PrepContent } from "@/types";

const SYSTEM_PROMPT = `You are helping a job candidate prepare for a recruiter screen. You will be given their resume, the job description, and researched company facts. Produce a five-section prep doc.

Tone, throughout every section: candid over supportive. Do not default to encouraging or uniformly-positive language anywhere in the doc. This is a preparation tool, not reassurance — a candidate who walks in blind to a real weakness is worse off than one who saw it coming. Wherever the underlying material is genuinely mixed, uneven, or weak, say so plainly instead of softening it into vague positivity.

Rules:
- "fit" must reference SPECIFIC resume content mapped to SPECIFIC JD language — no generic boilerplate that could apply to any candidate. Identify the 2-3 strongest matches AND at least one genuine stretch or gap. Do not hedge into "decent fit" language when the comparison is actually uneven — if a requirement is weakly supported by the resume, name the requirement and say so directly.
- "expect" gives short frameworks for answering likely questions, not scripted answers. If a likely question exposes a real gap the candidate seems underprepared for, flag it directly and say what to do about it — don't soften it into a generic "be ready to discuss X."
- "company" should read as a tightened synthesis of the provided research, not new invented claims.
- "logistics" should flag comp range only if findable from the research; otherwise say to ask directly. Note availability/work-authorization only if the JD or resume raises it.
- Keep each section to 2-4 sentences, written for someone scanning right before a call.
- The same candid standard applies everywhere, not just "fit" and "expect": if any section's honest content is unflattering or uncertain, say that plainly rather than defaulting to encouraging language to fill the space.

Respond with ONLY a JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "company": "string",
  "fit": "string",
  "expect": "string",
  "ask": "string",
  "logistics": "string"
}`;

export async function generatePrepContent(
  resumeText: string,
  jdText: string,
  company: string,
  role: string,
  research: CompanyResearch
): Promise<PrepContent> {
  const anthropic = getAnthropic();

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Company: ${company}
Role: ${role}

--- RESEARCH (Call 1 output) ---
Basic info: ${research.basicInfo}
Recent news: ${research.recentNews}
Culture: ${research.culture}

--- JOB DESCRIPTION ---
${jdText}

--- RESUME ---
${resumeText}`,
      },
    ],
  });

  const text = getFinalText(message.content);
  const parsed = parseJsonResponse<Partial<PrepContent>>(text, "Generation call", message.stop_reason);

  return {
    company: parsed.company || "",
    fit: parsed.fit || "",
    expect: parsed.expect || "",
    ask: parsed.ask || "",
    logistics: parsed.logistics || "",
  };
}
