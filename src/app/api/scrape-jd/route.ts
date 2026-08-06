import { NextResponse } from "next/server";
import { scrapeJobDescription } from "@/lib/extraction/jd-scrape";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "url is required." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Not a valid URL." }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only http/https URLs are supported." }, { status: 400 });
  }

  const result = await scrapeJobDescription(parsed.toString());
  return NextResponse.json(result);
}
