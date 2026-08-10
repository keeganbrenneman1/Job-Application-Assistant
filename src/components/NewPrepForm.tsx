"use client";

import { useState } from "react";
import { theme, sansFont } from "@/lib/theme";
import { inputStyle, labelClass, labelStyle } from "@/components/formStyles";
import { JdInputField } from "@/components/JdInputField";
import { ResumeInputField } from "@/components/ResumeInputField";
import { SAMPLE_APPLICANT_NAME, SAMPLE_COMPANY, SAMPLE_JD, SAMPLE_RESUME, SAMPLE_ROLE } from "@/lib/sample-data";
import type { GenerateRequest } from "@/types";

export type NewPrepInput = GenerateRequest;

interface NewPrepFormProps {
  // onStage reports progress across the now-multi-step generation flow
  // (create → research → generate, each a separate request — see
  // src/app/page.tsx's handleGenerate) so the button reflects what's
  // actually happening instead of one static label for the whole wait.
  onGenerate: (input: NewPrepInput, onStage: (stage: string) => void) => Promise<void>;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NewPrepForm({ onGenerate }: NewPrepFormProps) {
  const [applicantName, setApplicantName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [appliedDate, setAppliedDate] = useState(todayIsoDate);
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState("Working…");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = applicantName.trim() && company.trim() && role.trim() && jd.trim() && resume.trim() && !generating;

  const handleGenerate = async () => {
    if (!canSubmit) return;
    setGenerating(true);
    setError(null);
    try {
      await onGenerate(
        {
          applicantName: applicantName.trim(),
          company: company.trim(),
          role: role.trim(),
          jdText: jd,
          resumeText: resume,
          appliedDate: appliedDate || undefined,
          additionalContext: additionalContext.trim() || undefined,
        },
        setStage
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const loadSample = () => {
    setApplicantName(SAMPLE_APPLICANT_NAME);
    setCompany(SAMPLE_COMPANY);
    setRole(SAMPLE_ROLE);
    setJd(SAMPLE_JD);
    setResume(SAMPLE_RESUME);
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

      <div>
        <label className={labelClass} style={labelStyle}>
          Applicant
        </label>
        <input
          value={applicantName}
          onChange={(e) => setApplicantName(e.target.value)}
          placeholder="Your name"
          className="w-full px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
        />
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
          Applied
        </label>
        <input
          type="date"
          value={appliedDate}
          onChange={(e) => setAppliedDate(e.target.value)}
          className="w-full px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <JdInputField
        value={jd}
        onChange={setJd}
        onFieldsExtracted={({ company: extractedCompany, role: extractedRole }) => {
          // Best-effort suggestion from Call 0 — only fills fields the
          // user hasn't already typed into, and stays fully editable
          // either way; never treated as authoritative.
          if (extractedCompany && !company.trim()) setCompany(extractedCompany);
          if (extractedRole && !role.trim()) setRole(extractedRole);
        }}
      />

      <ResumeInputField
        value={resume}
        onChange={setResume}
        label="Resume"
        helperText="Not stored — used once for this prep, then discarded."
      />

      <div>
        <label className={labelClass} style={labelStyle}>
          Additional Context <span style={{ opacity: 0.6 }}>(optional)</span>
        </label>
        <textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          rows={3}
          placeholder="Anything you already know going in — an interviewer's email, notes from a referral, org-structure detail. Persists on this opportunity and feeds every future generation for it, editable later from the Opportunity Detail page."
          className="w-full px-3 py-2.5 text-sm outline-none resize-y"
          style={inputStyle}
        />
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
        {generating ? stage : "Generate prep doc"}
      </button>
    </div>
  );
}
