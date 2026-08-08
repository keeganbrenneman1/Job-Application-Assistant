// Call 1 — Research (grounded). Claude + the web search tool. Returns
// structured company facts only; no resume/JD reasoning happens here.
// Kept as its own call, separate from Call 2, so each can be verified
// independently (see spec "Grounding & architecture").

import { getAnthropic, MODEL } from "@/lib/ai/client";
import { getFinalText, parseJsonResponse } from "@/lib/ai/json-response";
import type { CompanyResearch } from "@/types";

const SYSTEM_PROMPT = `You are a research assistant gathering current, checkable facts about a company for a job candidate's interview prep. Use the web search tool to find recent, real information. Do not invent facts — if something can't be found, say so plainly in that field rather than guessing.

It's fine to search multiple times and think out loud between searches. But your LAST message must contain ONLY a single JSON object — no preamble, no markdown code fences, no commentary before or after it — matching exactly this shape:
{
  "basicInfo": "string — size, industry, funding stage/amount, HQ",
  "recentNews": "string — recent news, product launches, notable events (last ~6-12 months)",
  "culture": "string — culture/values signals from careers page, interviews, employee reviews",
  "sources": ["array of URLs used"]
}`;

export async function researchCompany(company: string, role: string): Promise<CompanyResearch> {
  const anthropic = getAnthropic();

  const message = await anthropic.messages.create({
    model: MODEL,
    // Generous headroom: this call can loop through several searches plus
    // narration before its final JSON message, and a truncated response
    // (stop_reason "max_tokens") looks identical to a malformed one.
    max_tokens: 8000,
    // claude-sonnet-5 defaults to adaptive thinking, which silently spends
    // part of max_tokens on `thinking` blocks before the model ever writes
    // its answer — with a tool-use call like this one (multiple search
    // rounds), that budget can run out entirely before a final text block
    // is produced, and getFinalText() then has nothing to parse. This is a
    // structured-JSON-only call with no need for visible reasoning, so
    // thinking is turned off rather than raced against the token budget.
    thinking: { type: "disabled" },
    system: SYSTEM_PROMPT,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3,
      },
    ],
    messages: [
      {
        role: "user",
        content: `Research this company for a "${role}" candidate preparing for a recruiter screen: ${company}`,
      },
    ],
  });

  const text = getFinalText(message.content, message.stop_reason);
  const parsed = parseJsonResponse<Partial<CompanyResearch>>(text, "Research call", message.stop_reason);

  return {
    basicInfo: parsed.basicInfo || "Not found.",
    recentNews: parsed.recentNews || "Not found.",
    culture: parsed.culture || "Not found.",
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
  };
}
