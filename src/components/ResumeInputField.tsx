"use client";

import { useRef, useState } from "react";
import { theme, sansFont } from "@/lib/theme";
import { inputStyle, labelClass, labelStyle } from "@/components/formStyles";

interface ResumeInputFieldProps {
  value: string;
  onChange: (text: string) => void;
  label: React.ReactNode; // e.g. "Resume" or "Resume (recommended)"
  helperText: React.ReactNode;
}

// Resume input: upload PDF/DOCX/TXT or paste text — shared by NewPrepForm,
// FirstPrepForm, and NextStepForm. Label/helper text are caller-supplied
// since "required" (New Prep, First Prep) and "recommended" (Next Step)
// framings need different copy (see spec "Resume: never persisted...
// recommended, not required, on the stage-2 form").
export function ResumeInputField({ value, onChange, label, helperText }: ResumeInputFieldProps) {
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [parsingResume, setParsingResume] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumeFileInputRef = useRef<HTMLInputElement>(null);

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
        onChange(data.text);
        setResumeFileName(file.name);
      }
    } catch {
      setError("Couldn't parse that file — paste the text instead.");
    } finally {
      setParsingResume(false);
    }
  };

  return (
    <div>
      <label className={labelClass} style={labelStyle}>
        {label}
      </label>
      <p className="text-[11px] mb-2" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
        {helperText}
      </p>
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste resume text, or upload above"
        rows={5}
        className="w-full px-3 py-2.5 text-sm outline-none"
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
