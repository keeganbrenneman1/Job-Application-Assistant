"use client";

import { useRef, useState } from "react";
import { theme, sansFont } from "@/lib/theme";
import { SAMPLE_COMPANY, SAMPLE_JD, SAMPLE_RESUME, SAMPLE_ROLE } from "@/lib/sample-data";

export interface NewPrepInput {
  company: string;
  role: string;
  jdText: string;
  resumeText: string;
}

interface NewPrepFormProps {
  onGenerate: (input: NewPrepInput) => Promise<void>;
}

const inputStyle = {
  background: theme.panelRaised,
  border: `1px solid ${theme.rule}`,
  color: theme.paper,
  fontFamily: sansFont,
};

const labelClass = "text-xs uppercase tracking-wide block mb-1.5";
const labelStyle = { color: theme.paperMuted, fontFamily: sansFont };

export function NewPrepForm({ onGenerate }: NewPrepFormProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [resume, setResume] = useState("");
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  const [fetchingJd, setFetchingJd] = useState(false);
  const [parsingJdFile, setParsingJdFile] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jdFileInputRef = useRef<HTMLInputElement>(null);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    company.trim() &&
    role.trim() &&
    jd.trim() &&
    resume.trim() &&
    !generating &&
    !fetchingJd &&
    !parsingJdFile &&
    !parsingResume;

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
        setJd(data.text);
        setJdFileName(null);
      }
    } catch {
      setError("Couldn't fetch that JD — paste the text instead.");
    } finally {
      setFetchingJd(false);
    }
  };

  const handleResumeFileUpload = async (file: File) => {
    setParsingResume(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't parse that file — paste the text instead.");
      } else {
        setResume(data.text);
        setResumeFileName(file.name);
      }
    } catch {
      setError("Couldn't parse that file — paste the text instead.");
    } finally {
      setParsingResume(false);
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
        setJd(data.text);
        setJdFileName(file.name);
        // Best-effort suggestion from Call 0 (see src/lib/ai/extract-jd-fields.ts) —
        // only fills fields the user hasn't already typed into, and stays
        // fully editable either way; never treated as authoritative.
        if (data.company && !company.trim()) setCompany(data.company);
        if (data.role && !role.trim()) setRole(data.role);
      }
    } catch {
      setError("Couldn't parse that file — paste the text instead.");
    } finally {
      setParsingJdFile(false);
    }
  };

  const handleGenerate = async () => {
    if (!canSubmit) return;
    setGenerating(true);
    setError(null);
    try {
      await onGenerate({ company: company.trim(), role: role.trim(), jdText: jd, resumeText: resume });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const loadSample = () => {
    setCompany(SAMPLE_COMPANY);
    setRole(SAMPLE_ROLE);
    setJd(SAMPLE_JD);
    setJdUrl("");
    setJdFileName(null);
    setResume(SAMPLE_RESUME);
    setResumeFileName(null);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end -mb-2">
        <button
          onClick={loadSample}
          className="text-[11px] cursor-pointer"
          style={{ color: theme.signal, fontFamily: sansFont }}
        >
          Load sample JD + resume
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} style={labelStyle}>
            Company
          </label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Northline"
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>
            Role
          </label>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Senior Product Manager"
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </div>

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
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the JD text"
          rows={5}
          className="w-full px-3 py-2.5 text-sm outline-none mt-2"
          style={inputStyle}
        />
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>
          Resume
        </label>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => resumeFileInputRef.current?.click()}
            disabled={parsingResume}
            className="text-xs px-3 py-2 border shrink-0 cursor-pointer disabled:cursor-not-allowed"
            style={{ borderColor: theme.rule, color: theme.paperMuted, fontFamily: sansFont, opacity: parsingResume ? 0.6 : 1 }}
          >
            {parsingResume ? "Parsing…" : "Upload PDF/DOCX"}
          </button>
          {resumeFileName && (
            <span className="text-[11px]" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
              {resumeFileName}
            </span>
          )}
          <input
            ref={resumeFileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleResumeFileUpload(file);
              e.target.value = "";
            }}
          />
        </div>
        <textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="Paste resume text, or upload a PDF/DOCX above"
          rows={5}
          className="w-full px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
        />
        <p className="text-[11px] mt-1.5" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
          Not stored — used once for this prep, then discarded.
        </p>
      </div>

      {error && (
        <p className="text-xs" style={{ color: theme.danger, fontFamily: sansFont }}>
          {error}
        </p>
      )}

      <button
        onClick={handleGenerate}
        disabled={!canSubmit}
        className="text-sm py-2.5 mt-1 tracking-wide cursor-pointer disabled:cursor-not-allowed"
        style={{
          background: theme.brass,
          color: theme.ink,
          fontFamily: sansFont,
          fontWeight: 600,
          opacity: canSubmit ? 1 : 0.5,
        }}
      >
        {generating ? "Researching & generating…" : "Generate prep doc"}
      </button>
    </div>
  );
}
