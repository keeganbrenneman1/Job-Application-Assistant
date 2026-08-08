// Shared helpers for calls that expect Claude's final response to be a
// single JSON object.

import type Anthropic from "@anthropic-ai/sdk";

type ContentBlock = Anthropic.Messages.ContentBlock;

// When a call uses a tool (e.g. the research call's web_search tool), the
// response content array interleaves tool_use / tool_result blocks with
// text blocks, and the model often emits narration text ("Let me search
// for...") in an earlier text block before its real answer. The final
// answer is always the LAST text block, not the first — using .find() for
// the first "text" block silently grabs that narration instead and fails
// to parse as JSON. Calls with no tools normally only ever produce one
// text block, so .at(-1) is a no-op safety net for them.
export function getFinalText(content: ContentBlock[], stopReason?: string | null): string {
  const textBlocks = content.filter(
    (block): block is Anthropic.Messages.TextBlock => block.type === "text"
  );
  const last = textBlocks.at(-1);
  if (!last) {
    const blockTypes = content.map((b) => b.type).join(", ") || "(empty)";
    // stop_reason "max_tokens" here means the response was cut off before
    // Claude ever reached a text block — e.g. thinking + tool-use rounds
    // consumed the whole budget. See src/lib/ai/research.ts for the fix
    // (thinking disabled, more headroom) — this message exists so a
    // recurrence points straight at the cause instead of just "no text".
    throw new Error(
      `Claude's response had no text block (content block types: ${blockTypes}; stop_reason: ${stopReason ?? "unknown"}).`
    );
  }
  return last.text;
}

// Strips markdown code fences if present, extracts the outermost {...},
// and parses it. Logs the raw text on any failure — both "no JSON found"
// and "found JSON-looking text but it didn't parse" — so a failure in
// production points straight at what Claude actually returned instead of
// a bare error string.
export function parseJsonResponse<T>(text: string, context: string, stopReason?: string | null): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1) {
    console.error(
      `[${context}] no JSON object found in response (stop_reason: ${stopReason ?? "unknown"}):\n${text}`
    );
    throw new Error(`${context} did not return JSON. See server logs for the raw response.`);
  }

  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch (err) {
    console.error(
      `[${context}] failed to parse JSON (stop_reason: ${stopReason ?? "unknown"}):\n${text}`
    );
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`${context} returned malformed JSON: ${reason}. See server logs for the raw response.`);
  }
}
