// Call 1 — Research (grounded). Claude + the web search tool. Returns
// structured company facts only; no resume/JD reasoning happens here.
// Kept as its own call, separate from Call 2, so each can be verified
// independently (see spec "Grounding & architecture").

import { getAnthropic, MODEL } from "@/lib/ai/client";
import type { CompanyResearch } from "@/types";

const SYSTEM_PROMPT = `You are a research assistant gathering current, checkable facts about a company for a job candidate's interview prep. Use the web search tool to find recent, real information. Do not invent facts — if something can't be found, say so plainly in that field rather than guessing.

When you're done searching, respond with ONLY a JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "basicInfo": "string — size, industry, funding stage/amount, HQ",
  "recentNews": "string — recent news, product launches, notable events (last ~6-12 months)",
  "culture": "string — culture/values signals from careers page, interviews, employee reviews",
  "sources": ["array of URLs used"]
}`;

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Research call did not return JSON.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function researchCompany(company: string, role: string): Promise<CompanyResearch> {
  const anthropic = getAnthropic();

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
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

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Research call returned no text content.");
  }

  const parsed = extractJson(textBlock.text) as Partial<CompanyResearch>;

  return {
    basicInfo: parsed.basicInfo || "Not found.",
    recentNews: parsed.recentNews || "Not found.",
    culture: parsed.culture || "Not found.",
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
  };
}
