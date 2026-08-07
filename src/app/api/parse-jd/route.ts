import { NextResponse } from "next/server";
import { extractDocumentText, UnsupportedDocumentFormatError } from "@/lib/extraction/document";
import { extractJdFields } from "@/lib/ai/extract-jd-fields";

export const runtime = "nodejs";

// Third JD input path alongside URL scrape and manual paste — for when
// someone saves the job posting page as a PDF. Same deterministic,
// no-LLM extraction as the resume upload path (see
// src/lib/extraction/document.ts); nothing here writes to disk or a
// database. Also runs the lightweight, best-effort company/role field
// extraction (Call 0, see src/lib/ai/extract-jd-fields.ts) so the form
// can suggest pre-fills — always editable, never authoritative.
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("jd");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded under field 'jd'." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractDocumentText(buffer, file.name, file.type);
    if (!text) {
      return NextResponse.json(
        { error: "Couldn't extract any text from that file. Try pasting the JD instead." },
        { status: 422 }
      );
    }
    const fields = await extractJdFields(text);
    return NextResponse.json({ text, ...fields });
  } catch (err) {
    if (err instanceof UnsupportedDocumentFormatError) {
      return NextResponse.json({ error: err.message }, { status: 415 });
    }
    console.error("parse-jd failed", err);
    return NextResponse.json({ error: "Failed to parse JD file." }, { status: 500 });
  }
}
