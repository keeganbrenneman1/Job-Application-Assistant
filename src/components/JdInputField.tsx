"use client";

import { useRef, useState } from "react";
import { theme, sansFont } from "@/lib/theme";
import { inputStyle, labelClass, labelStyle } from "@/components/formStyles";

interface JdInputFieldProps {
  value: string;
  onChange: (text: string) => void;
  // Best-effort suggestion from Call 0 (see src/lib/ai/extract-jd-fields.ts),
  // fired only on PDF upload. Omit for callers where company/role are
  // already fixed (e.g. completing an already-created opportunity).
  onFieldsExtracted?: (fields: { company: string | null; role: string | null }) => void;
}

// Job description input: paste, fetch by URL, or upload a PDF — shared by
// NewPrepForm and FirstPrepForm (NextStepForm's JD block is a different
// shape, a read-only collapsed display of the already-persisted JD, so it
// doesn't use this).
export function JdInputField({ value, onChange, onFieldsExtracted }: JdInputFieldProps) {
  const [jdUrl, setJdUrl] = useState("");
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [fetchingJd, setFetchingJd] = useState(false);
  const [parsingJdFile, setParsingJdFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jdFileInputRef = useRef<HTMLInputElement>(null);

  const handleFetchJd = async () => {
    if (!jdUrl.trim()) return;
    setFetchingJd(true);
    setError(null);
    try {
      const res = await fetch("/api/scrape-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jdUrl.trim() }),
      });
      const data = await res.json();
      if (data.blocked || !res.ok) {
        setError(data.reason || "Couldn't fetch that JD — paste the text instead.");
      } else {
        onChange(data.text);
        setJdFileName(null);
      }
    } catch {
      setError("Couldn't fetch that JD — paste the text instead.");
    } finally {
      setFetchingJd(false);
    }
  };

  const handleJdFileUpload = async (file: File) => {
    setParsingJdFile(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("jd", file);
      const res = await fetch("/api/parse-jd", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't parse that file — paste the text instead.");
      } else {
        onChange(data.text);
        setJdFileName(file.name);
        onFieldsExtracted?.({ company: data.company ?? null, role: data.role ?? null });
      }
    } catch {
      setError("Couldn't parse that file — paste the text instead.");
    } finally {
      setParsingJdFile(false);
    }
  };

  return (
    <div>
      <label className={labelClass} style={labelStyle}>
        Job description
      </label>
      <p className="text-[11px] mb-2" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
        Paste the text below, fetch it from a URL, or upload the posting as a PDF.
      </p>
      <div className="flex gap-2 mb-1.5">
        <input
          value={jdUrl}
          onChange={(e) => setJdUrl(e.target.value)}
          placeholder="Paste a URL to fetch"
          className="flex-1 px-3 py-2 text-sm outline-none min-w-0"
          style={inputStyle}
        />
        <button
          onClick={handleFetchJd}
          disabled={!jdUrl.trim() || fetchingJd}
          className="text-xs px-3 py-2 border shrink-0 cursor-pointer disabled:cursor-not-allowed"
          style={{ borderColor: theme.rule, color: theme.paperMuted, fontFamily: sansFont, opacity: fetchingJd ? 0.6 : 1 }}
        >
          {fetchingJd ? "Fetching…" : "Fetch"}
        </button>
        <button
          onClick={() => jdFileInputRef.current?.click()}
          disabled={parsingJdFile}
          className="text-xs px-3 py-2 border shrink-0 cursor-pointer disabled:cursor-not-allowed"
          style={{ borderColor: theme.rule, color: theme.paperMuted, fontFamily: sansFont, opacity: parsingJdFile ? 0.6 : 1 }}
        >
          {parsingJdFile ? "Parsing…" : "Upload PDF"}
        </button>
        <input
          ref={jdFileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleJdFileUpload(file);
            e.target.value = "";
          }}
        />
      </div>
      {jdFileName && (
        <p className="text-[11px] mb-2" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
          {jdFileName}
        </p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the JD text"
        rows={5}
        className="w-full px-3 py-2.5 text-sm outline-none mt-2"
        style={inputStyle}
      />
      {error && (
        <p className="text-xs mt-1.5" style={{ color: theme.danger, fontFamily: sansFont }}>
          {error}
        </p>
      )}
    </div>
  );
}
