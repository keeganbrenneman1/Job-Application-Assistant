"use client";

import { useState } from "react";
import { theme, sansFont } from "@/lib/theme";
import { inputStyle, labelClass, labelStyle } from "@/components/formStyles";
import type { LogAppliedRequest } from "@/types";

export interface LogAppliedFormProps {
  onLogApplied: (input: LogAppliedRequest) => Promise<void>;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// "Log Applied" quick-add — the second opportunity-creation entry point
// (see spec supplement "New — 'Log Applied' quick-add"). Creates the
// opportunity record only: no JD, no resume, no generation. For when
// you've applied somewhere with no screen scheduled yet — add the JD and
// generate the Recruiter Screen prep later, once one is.
export function LogAppliedForm({ onLogApplied }: LogAppliedFormProps) {
  const [applicantName, setApplicantName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [appliedDate, setAppliedDate] = useState(todayIsoDate);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = applicantName.trim() && company.trim() && role.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onLogApplied({
        applicantName: applicantName.trim(),
        company: company.trim(),
        role: role.trim(),
        appliedDate: appliedDate || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log the opportunity.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[11px]" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
        Applied somewhere with no screen scheduled yet? Log it now — add the JD and generate the Recruiter Screen
        prep later, once one is.
      </p>

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
        {submitting ? "Logging…" : "Log applied"}
      </button>
    </div>
  );
}
