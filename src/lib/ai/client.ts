import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!cached) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Set it in .env.local, or set MOCK_MODE=true to use the hard-coded example response while iterating."
      );
    }
    cached = new Anthropic({ apiKey });
  }
  return cached;
}

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
