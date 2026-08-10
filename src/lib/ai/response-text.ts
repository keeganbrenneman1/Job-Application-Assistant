// Shared helper for extracting Claude's final text block, regardless of
// what format that text is in (JSON, markdown, or otherwise) — used by
// every call in src/lib/ai/, not specific to any one response format.

import type Anthropic from "@anthropic-ai/sdk";

type ContentBlock = Anthropic.Messages.ContentBlock;

// When a call uses a tool (e.g. the research call's web_search tool), the
// response content array interleaves tool_use / tool_result blocks with
// text blocks, and the model often emits narration text ("Let me search
// for...") in an earlier text block before its real answer — an earlier
// version of this function used .find() for the first "text" block, which
// silently grabbed that narration instead of the real answer.
//
// But picking only the LAST text block (this function's prior fix) has its
// own failure mode: Claude doesn't always defer its *entire* structured
// answer to that final block. It can write one section right after an
// early search, keep searching, then write the rest in the actual final
// block — and since the "## Header" parser (see markdown-response.ts) only
// errors when it finds zero headers total, a response missing just one
// section from an earlier block never throws, it just silently falls back
// per-field. Concatenating every text block instead — in order — preserves
// whatever Claude wrote regardless of which block it landed in, while
// parseMarkdownSections still discards any narration that appears before
// the first real header. Calls with no tools (no interleaving) normally
// only ever produce one text block, so this is a no-op for them.
export function getFinalText(content: ContentBlock[], stopReason?: string | null): string {
  const textBlocks = content.filter(
    (block): block is Anthropic.Messages.TextBlock => block.type === "text"
  );
  if (textBlocks.length === 0) {
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
  return textBlocks.map((block) => block.text).join("\n\n");
}
