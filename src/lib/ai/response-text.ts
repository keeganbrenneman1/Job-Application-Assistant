// Shared helper for extracting Claude's final text block, regardless of
// what format that text is in (JSON, markdown, or otherwise) — used by
// every call in src/lib/ai/, not specific to any one response format.

import type Anthropic from "@anthropic-ai/sdk";

type ContentBlock = Anthropic.Messages.ContentBlock;

// When a call uses a tool (e.g. the research call's web_search tool), the
// response content array interleaves tool_use / tool_result blocks with
// text blocks, and the model often emits narration text ("Let me search
// for...") in an earlier text block before its real answer. The final
// answer is always the LAST text block, not the first — using .find() for
// the first "text" block silently grabs that narration instead and fails
// to parse. Calls with no tools normally only ever produce one text
// block, so .at(-1) is a no-op safety net for them.
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
