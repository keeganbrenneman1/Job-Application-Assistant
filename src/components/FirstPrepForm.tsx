"use client";

import { useState } from "react";
import { theme, sansFont } from "@/lib/theme";
import { JdInputField } from "@/components/JdInputField";
import { ResumeInputField } from "@/components/ResumeInputField";
import type { FirstPrepRequest } from "@/types";

export interface FirstPrepFormProps {
  // onStage reports progress — this now runs research and generation as
  // two separate requests (see src/app/page.tsx's handleGenerateFirstPrep)
  // rather than one combined call.
  onGenerate: (input: FirstPrepRequest, onStage: (stage: string) => void) => Promise<void>;
}

// Completes a "Log Applied" quick-added opportunity: company/role/
// applicant are already set, so this only collects what quick-add
// skipped — JD and resume — then generates the Recruiter Screen prep.
// Shown on the Opportunity Detail page in place of the (empty) stage
// feed whenever an opportunity has zero stage-preps yet.
export function FirstPrepForm({ onGenerate }: FirstPrepFormProps) {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState("Working…");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = jd.trim() && resume.trim() && !generating;

  const handleGenerate = async () => {
    if (!canSubmit) return;
    setGenerating(true);
    setError(null);
    try {
      await onGenerate({ jdText: jd, resumeText: resume }, setStage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[11px]" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
        A screen got scheduled — add the JD and resume to generate the Recruiter Screen prep.
      </p>

      <JdInputField value={jd} onChange={setJd} />

      <ResumeInputField
        value={resume}
        onChange={setResume}
        label="Resume"
        helperText="Not stored — used once for this prep, then discarded."
      />

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
