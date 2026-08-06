// Deterministic resume extraction — no LLM involved (see spec
// "Extraction (deterministic, no LLM): resume file parsing, JD URL
// scraping"). The extracted text is returned to the caller and never
// written to disk, a database, or a log.

export class UnsupportedResumeFormatError extends Error {}

export async function parseResumeFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const lower = filename.toLowerCase();

  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (mimeType === "text/plain" || lower.endsWith(".txt")) {
    return buffer.toString("utf-8").trim();
  }

  throw new UnsupportedResumeFormatError(
    `Unsupported resume format: ${mimeType || filename}. Upload a PDF, DOCX, or TXT, or paste the text directly.`
  );
}
