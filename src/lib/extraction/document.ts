// Deterministic file-to-text extraction — no LLM involved (see spec
// "Extraction (deterministic, no LLM): resume file parsing, JD URL
// scraping"). Shared by both the resume upload path and the JD PDF-upload
// path (job postings saved as a PDF); the underlying parsing has never
// been resume-specific. Extracted text is returned to the caller and
// never written to disk, a database, or a log.

export class UnsupportedDocumentFormatError extends Error {}

export async function extractDocumentText(
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

  throw new UnsupportedDocumentFormatError(
    `Unsupported file format: ${mimeType || filename}. Upload a PDF, DOCX, or TXT, or paste the text directly.`
  );
}
