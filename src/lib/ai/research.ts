// Call 1 — Research (grounded). Claude + the web search tool. Returns
// structured company facts only; no resume/JD reasoning happens here.
// Kept as its own call, separate from Call 2, so each can be verified
// independently (see spec "Grounding & architecture").

import { getAnthropic, MODEL } from "@/lib/ai/client";
import { getFinalText } from "@/lib/ai/response-text";
import { requireMarkdownSections } from "@/lib/ai/markdown-response";
import type { CompanyResearch } from "@/types";

const SYSTEM_PROMPT = `You are a research assistant gathering current, checkable facts about a company for a job candidate's interview prep. Use the web search tool to find recent, real information. Do not invent facts — if something can't be found, say so plainly in that section rather than guessing.

It's fine to search multiple times and think out loud between searches. But your LAST message must contain ONLY markdown using exactly these four "## " headers, in this exact order, and nothing else before, between, or after their content — no JSON, no code fences, no preamble or closing remarks:

## Basic Info
Plain prose: size, industry, funding stage/amount, HQ.

## Recent News
Plain prose: recent news, product launches, notable events (last ~6-12 months).

## Culture
Plain prose: culture/values signals from careers page, interviews, employee reviews.

## Sources
A markdown bullet list of the URLs you used, one per line, each starting with "- ". Nothing else in this section.

Write each field as plain prose paragraphs — quote exact language freely where it's useful (e.g. a mission statement), you don't need to avoid quotation marks or escape anything here.`;

export async function researchCompany(company: string, role: string): Promise<CompanyResearch> {
  const anthropic = getAnthropic();

  const message = await anthropic.messages.create({
    model: MODEL,
    // Generous headroom: this call can loop through several searches plus
    // narration before its final markdown message, and a truncated
    // response (stop_reason "max_tokens") looks identical to a malformed
    // one.
    max_tokens: 8000,
    // claude-sonnet-5 defaults to adaptive thinking, which silently spends
    // part of max_tokens on `thinking` blocks before the model ever writes
    // its answer — with a tool-use call like this one (multiple search
    // rounds), that budget can run out entirely before a final text block
    // is produced, and getFinalText() then has nothing to parse. This is a
    // structured-output-only call with no need for visible reasoning, so
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
  const sections = requireMarkdownSections(text, "Research call", message.stop_reason);

  const sourcesRaw = sections.get("sources") ?? "";
  const sources = sourcesRaw
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  const basicInfo = sections.get("basic info") || "Not found.";
  const recentNews = sections.get("recent news") || "Not found.";
  const culture = sections.get("culture") || "Not found.";

  // Diagnostic: requireMarkdownSections only throws when it finds zero
  // headers total, so a response missing just one or two expected sections
  // (out of "basic info" / "recent news" / "culture") never errors — it
  // just silently falls back per-field, with nothing logged. If that
  // happens, log what Claude actually wrote and which headers were parsed
  // out of it, so a recurrence is diagnosable instead of a guessing game.
  if (basicInfo === "Not found." || recentNews === "Not found." || culture === "Not found.") {
    console.warn(
      `[Research call] missing section(s) for "${company}". Parsed headers: [${[...sections.keys()].join(", ")}]. Raw response:\n${text}`
    );
  }

  return { basicInfo, recentNews, culture, sources };
}
