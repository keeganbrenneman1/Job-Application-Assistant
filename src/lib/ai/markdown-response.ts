// Deterministic markdown-section parser — not an LLM step, same
// extraction/reasoning separation principle used elsewhere in this codebase
// (see src/lib/extraction/). Calls 1 and 2 ask Claude to respond with
// markdown using fixed "## Header" sections instead of JSON, specifically
// because their fields are prose that can legitimately contain a literal
// double-quote or other character a strict JSON string would need escaped —
// asking for markdown removes that failure mode structurally rather than
// patching prompt instructions around it (see src/lib/ai/research.ts and
// src/lib/ai/generate.ts).

export interface MarkdownSection {
  header: string; // exact header text as Claude wrote it, trimmed
  content: string; // everything between this header and the next, trimmed
}

// Splits on lines that are exactly a level-2 header ("## Some Header").
// Anything before the first header (preamble Claude was told not to add,
// but might anyway) is discarded rather than parsed.
export function parseMarkdownSections(text: string): MarkdownSection[] {
  const lines = text.split("\n");
  const sections: MarkdownSection[] = [];
  let currentHeader: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentHeader !== null) {
      sections.push({ header: currentHeader, content: currentLines.join("\n").trim() });
    }
  };

  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      flush();
      currentHeader = match[1];
      currentLines = [];
    } else if (currentHeader !== null) {
      currentLines.push(line);
    }
  }
  flush();

  return sections;
}

// Parses and returns a lookup keyed by trimmed, lowercased header text, so
// callers can do `sections.get(label.toLowerCase())` without worrying about
// exact-case matching. Throws only when parsing found no headers at all
// (fully malformed response) — logs the raw text server-side first, same
// pattern as src/lib/ai/json-response.ts, so a production failure points
// straight at what Claude actually returned. Missing individual expected
// headers (some sections present, others not) is left for the caller to
// handle via its own per-field fallback, matching how JSON parsing already
// tolerated missing keys.
export function requireMarkdownSections(
  text: string,
  context: string,
  stopReason?: string | null
): Map<string, string> {
  const sections = parseMarkdownSections(text);

  if (sections.length === 0) {
    console.error(
      `[${context}] no markdown "## Header" sections found in response (stop_reason: ${stopReason ?? "unknown"}):\n${text}`
    );
    throw new Error(`${context} did not return the expected markdown sections. See server logs for the raw response.`);
  }

  const lookup = new Map<string, string>();
  for (const section of sections) {
    lookup.set(section.header.trim().toLowerCase(), section.content);
  }
  return lookup;
}
