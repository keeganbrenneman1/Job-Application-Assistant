"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { theme, sansFont } from "@/lib/theme";
import { inputStyle, labelClass, labelStyle } from "@/components/formStyles";
import { ResumeInputField } from "@/components/ResumeInputField";
import { NEXT_STEP_STAGE_TYPES } from "@/types";
import type { NextStepRequest, StageType } from "@/types";

export interface NextStepFormProps {
  jdText: string;
  onGenerate: (input: NextStepRequest) => Promise<void>;
  onCancel: () => void;
}

// Generate Next Step form (see spec "v2 flow" step 4): stage type dropdown,
// optional additional-context free text, optional resume, JD reused
// read-only from the opportunity — no re-entry required.
export function NextStepForm({ jdText, onGenerate, onCancel }: NextStepFormProps) {
  const [stageType, setStageType] = useState<StageType>(NEXT_STEP_STAGE_TYPES[0].id);
  const [customLabel, setCustomLabel] = useState("");
  const [interviewerTitle, setInterviewerTitle] = useState("");
  const [jdExpanded, setJdExpanded] = useState(false);
  const [additionalContext, setAdditionalContext] = useState("");
  const [resume, setResume] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsCustomLabel = stageType === "other";
  const canSubmit = (!needsCustomLabel || customLabel.trim()) && !generating;

  const handleGenerate = async () => {
    if (!canSubmit) return;
    setGenerating(true);
    setError(null);
    try {
      await onGenerate({
        stageType,
        stageLabel: needsCustomLabel ? customLabel.trim() : undefined,
        resumeText: resume.trim() || undefined,
        additionalContext: additionalContext.trim() || undefined,
        interviewerTitle: interviewerTitle.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className={labelClass} style={labelStyle}>
          Stage type
        </label>
        <select
          value={stageType}
          onChange={(e) => setStageType(e.target.value as StageType)}
          className="w-full px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
        >
          {NEXT_STEP_STAGE_TYPES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        {needsCustomLabel && (
          <input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Name this stage, e.g. 'Founder chat'"
            className="w-full px-3 py-2.5 text-sm outline-none mt-2"
            style={inputStyle}
          />
        )}
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>
          Interviewer title <span style={{ opacity: 0.6 }}>(optional)</span>
        </label>
        <p className="text-[11px] mb-1.5" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
          E.g. &quot;CTO&quot; or &quot;Senior Engineering Manager&quot; — a short title, not a resume or bio. Shapes
          what this stage&apos;s prep focuses on.
        </p>
        <input
          value={interviewerTitle}
          onChange={(e) => setInterviewerTitle(e.target.value)}
          placeholder="e.g. CTO"
          className="w-full px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <div className="border" style={{ borderColor: theme.rule }}>
        <button
          type="button"
          onClick={() => setJdExpanded((e) => !e)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left cursor-pointer"
        >
          <div>
            <div className="text-xs uppercase tracking-wide" style={labelStyle}>
              Job description
            </div>
            <p className="text-[11px] mt-1" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
              Reused automatically from this opportunity.
            </p>
          </div>
          <ChevronDown
            size={15}
            color={theme.paperMuted}
            className="shrink-0"
            style={{ transform: jdExpanded ? "rotate(180deg)" : "none", transition: "transform 120ms" }}
          />
        </button>
        {jdExpanded && (
          <textarea
            value={jdText}
            readOnly
            rows={6}
            className="w-full px-3 py-2.5 text-sm outline-none resize-none border-t"
            style={{ ...inputStyle, opacity: 0.7, borderColor: theme.rule }}
          />
        )}
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>
          Additional context <span style={{ opacity: 0.6 }}>(optional)</span>
        </label>
        <p className="text-[11px] mb-1.5" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
          E.g. paste the interview-invite email — helps ground this stage in reality, not generic assumptions.
        </p>
        <textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          placeholder="Anything specific to this stage"
          rows={3}
          className="w-full px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <ResumeInputField
        value={resume}
        onChange={setResume}
        label={
          <>
            Resume <span style={{ opacity: 0.6 }}>(recommended)</span>
          </>
        }
        helperText={
          <>
            Not required — omitting it still uses prior-stage content + JD + company research. Recommended for
            stages like this one, though: they often benefit from resume specifics the Recruiter Screen prep
            wasn&apos;t written to surface. Not stored either way.
          </>
        }
      />

      {error && (
        <p className="text-xs" style={{ color: theme.danger, fontFamily: sansFont }}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="text-sm py-2.5 px-4 tracking-wide cursor-pointer border"
          style={{ borderColor: theme.rule, color: theme.paperMuted, fontFamily: sansFont }}
        >
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          disabled={!canSubmit}
          className="flex-1 text-sm py-2.5 tracking-wide cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: theme.brass,
            color: theme.ink,
            fontFamily: sansFont,
            fontWeight: 600,
            opacity: canSubmit ? 1 : 0.5,
          }}
        >
          {generating ? "Generating…" : "Generate next step"}
        </button>
      </div>
    </div>
  );
}
