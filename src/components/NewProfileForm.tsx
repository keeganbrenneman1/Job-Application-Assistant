"use client";

import { useState } from "react";
import { theme, sansFont } from "@/lib/theme";
import { inputStyle, labelClass, labelStyle } from "@/components/formStyles";
import { ResumeInputField } from "@/components/ResumeInputField";
import type { CreateProfileRequest } from "@/types";

export interface NewProfileFormProps {
  onCreate: (input: CreateProfileRequest) => Promise<void>;
}

// Profiles tab's "New Profile" form — creates a profile directly (see
// POST /api/profiles), distinct from the save-as-profile prompt shown
// after a manual New Opportunity submission. Resume is optional here: a
// name-only profile can be created and the resume added later by deleting
// and recreating it (no edit path this session).
export function NewProfileForm({ onCreate }: NewProfileFormProps) {
  const [name, setName] = useState("");
  const [resume, setResume] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({ name: name.trim(), resumeText: resume.trim() || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[11px]" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
        Save a name + resume for reuse — pick this profile later from the New Opportunity form to prefill both
        (still fully editable from there).
      </p>

      <div>
        <label className={labelClass} style={labelStyle}>
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jane Doe"
          className="w-full px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <ResumeInputField
        value={resume}
        onChange={setResume}
        label={
          <>
            Resume <span style={{ opacity: 0.6 }}>(optional)</span>
          </>
        }
        helperText="Stored with this profile, unlike everywhere else in the app — reused whenever it's selected. No edit path yet; delete and recreate the profile to change it."
      />

      {error && (
        <p className="text-xs" style={{ color: theme.danger, fontFamily: sansFont }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
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
        {submitting ? "Creating…" : "Create profile"}
      </button>
    </div>
  );
}
