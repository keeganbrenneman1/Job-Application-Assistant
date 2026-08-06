import { NextResponse } from "next/server";
import { parseResumeFile, UnsupportedResumeFormatError } from "@/lib/extraction/resume";

export const runtime = "nodejs";

// Accepts a single uploaded file and returns extracted text. The file
// bytes and extracted text exist only for the duration of this request —
// nothing here writes to disk or a database (see spec "Resume is NOT
// persisted").
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("resume");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded under field 'resume'." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await parseResumeFile(buffer, file.name, file.type);
    if (!text) {
      return NextResponse.json(
        { error: "Couldn't extract any text from that file. Try pasting the resume instead." },
        { status: 422 }
      );
    }
    return NextResponse.json({ text });
  } catch (err) {
    if (err instanceof UnsupportedResumeFormatError) {
      return NextResponse.json({ error: err.message }, { status: 415 });
    }
    console.error("parse-resume failed", err);
    return NextResponse.json({ error: "Failed to parse resume file." }, { status: 500 });
  }
}
