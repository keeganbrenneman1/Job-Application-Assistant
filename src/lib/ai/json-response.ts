// Helper for calls that expect Claude's final response to be a single JSON
// object. Only Call 0 (JD field extraction) still uses this — Calls 1 and 2
// switched to markdown (see src/lib/ai/markdown-response.ts) because their
// prose fields could contain a literal double-quote or unescaped control
// character that breaks JSON.parse. Call 0 only ever returns two short
// single-line values (company name, role title), not prose, so that failure
// mode doesn't apply here and JSON stays the simpler choice.

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
