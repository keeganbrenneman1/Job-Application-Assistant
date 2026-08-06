// Deterministic JD URL scraping — no LLM involved. Falls back to
// `blocked: true` when the page can't be fetched or looks like it returned
// a login/bot-check wall instead of a real posting (e.g. LinkedIn, many
// ATS pages), so the UI can prompt for a manual paste instead.

import * as cheerio from "cheerio";

export interface ScrapeResult {
  text: string;
  blocked: boolean;
  reason?: string;
}

const STRIP_SELECTORS = [
  "script",
  "style",
  "noscript",
  "nav",
  "footer",
  "header",
  "svg",
  "form",
  "iframe",
];

const MIN_USABLE_LENGTH = 200;

export async function scrapeJobDescription(url: string): Promise<ScrapeResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; JobApplicationAssistant/1.0; +personal-use-tool)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
  } catch {
    return { text: "", blocked: true, reason: "Could not reach that URL." };
  }

  if (!response.ok) {
    return {
      text: "",
      blocked: true,
      reason: `Site returned ${response.status}. Paste the JD text instead.`,
    };
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  STRIP_SELECTORS.forEach((sel) => $(sel).remove());

  const text = $("body").text().replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  if (text.length < MIN_USABLE_LENGTH) {
    return {
      text: "",
      blocked: true,
      reason: "Page content looks blocked or empty (common on LinkedIn/ATS pages). Paste the JD text instead.",
    };
  }

  return { text, blocked: false };
}
