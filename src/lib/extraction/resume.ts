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
    // unpdf ships a PDF.js build compiled for serverless/edge runtimes —
    // no DOMMatrix/Canvas/browser globals required for text extraction,
    // unlike pdf-parse's underlying pdfjs-dist, which assumes a DOM and
    // breaks with "DOMMatrix is not defined" on Vercel's Node runtime.
    const { getDocumentProxy, extractText } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text.trim();
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
