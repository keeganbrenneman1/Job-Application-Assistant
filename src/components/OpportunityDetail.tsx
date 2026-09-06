"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { theme, serifFont, sansFont } from "@/lib/theme";
import { CompanySnapshot } from "@/components/CompanySnapshot";
import { OpportunityContext } from "@/components/OpportunityContext";
import { StagePrepCard } from "@/components/StagePrepCard";
import { NextStepForm } from "@/components/NextStepForm";
import { FirstPrepForm } from "@/components/FirstPrepForm";
import { CLOSE_STATUSES, statusLabelFor } from "@/types";
import type { FirstPrepRequest, NextStepRequest, OpportunityStatus, OpportunityWithPreps } from "@/types";

interface OpportunityDetailProps {
  opportunity: OpportunityWithPreps;
  onGenerateNextStep: (input: NextStepRequest) => Promise<void>;
  // onStage lets FirstPrepForm show granular progress text — this path now
  // runs research and generation as two separate requests (see
  // src/app/page.tsx's handleGenerateFirstPrep) rather than one combined
  // call, so the wait is longer/lumpier than a single spinner suggests.
  onGenerateFirstPrep: (input: FirstPrepRequest, onStage: (stage: string) => void) => Promise<void>;
  onUpdateAppliedDate: (appliedDate: string | null) => Promise<void>;
  onUpdateAdditionalContext: (additionalContext: string | null) => Promise<void>;
  onRegenerateResearch: () => Promise<void>;
  // v4: appends one entry to a stage's context log (see ContextLog on
  // StagePrepCard) — only the opportunity's most-recently-created stage
  // accepts new entries, enforced both here (isOpenStage below) and again
  // server-side.
  onAddContextEntry: (stageId: string, body: string) => Promise<void>;
  // v6: "Regenerate" trigger — reruns Call 2 for one stage prep in place,
  // using that stage's own current context log (see StagePrepCard).
  onRegeneratePrep: (prepId: string) => Promise<void>;
  // Close Opportunity: picks one of the 4 closing outcomes and closes the
  // opportunity in the same action. No reopen path — see CloseOpportunity
  // below, which gates this behind an explicit confirmation.
  onCloseOpportunity: (status: OpportunityStatus) => Promise<void>;
  onBack: () => void;
}

// Close Opportunity control: while open, offers the 4 closing outcomes,
// each requiring an explicit confirm() before committing (irreversible —
// see README "No reopen path"). Once closed, renders as a read-only status
// badge instead — there's nothing left to do here.
function CloseOpportunity({
  status,
  onClose,
}: {
  status: OpportunityStatus;
  onClose: (status: OpportunityStatus) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "open") {
    return (
      <div
        className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide px-2 py-1 border w-fit mb-5"
        style={{ borderColor: theme.rule, color: theme.paperMuted, fontFamily: sansFont }}
      >
        <Lock size={11} />
        Closed — {statusLabelFor(status)}
      </div>
    );
  }

  const handlePick = async (next: OpportunityStatus) => {
    if (
      !window.confirm(
        `This will close this opportunity as "${statusLabelFor(next)}" and cannot be undone. Continue?`
      )
    ) {
      return;
    }
    setClosing(true);
    setError(null);
    try {
      await onClose(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close opportunity.");
      setClosing(false);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-[11px] uppercase tracking-wide px-2 py-1 border w-fit mb-5 cursor-pointer"
        style={{ borderColor: theme.rule, color: theme.paperMuted, fontFamily: sansFont }}
      >
        Close Opportunity
      </button>
    );
  }

  return (
    <div className="mb-5 p-3 border w-fit" style={{ borderColor: theme.rule, background: theme.panel }}>
      <p className="text-[11px] mb-2.5" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
        Closing cannot be undone. Pick an outcome:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {CLOSE_STATUSES.map((s) => (
          <button
            key={s.id}
            onClick={() => handlePick(s.id)}
            disabled={closing}
            className="text-xs px-3 py-1.5 border cursor-pointer"
            style={{
              borderColor: theme.rule,
              color: theme.paper,
              background: theme.panelRaised,
              fontFamily: sansFont,
              fontWeight: 500,
              cursor: closing ? "default" : "pointer",
            }}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => setExpanded(false)}
          disabled={closing}
          className="text-xs px-3 py-1.5 cursor-pointer"
          style={{ color: theme.paperMuted, fontFamily: sansFont }}
        >
          Cancel
        </button>
      </div>
      {error && (
        <p className="text-[11px] mt-2" style={{ color: theme.danger, fontFamily: sansFont }}>
          {error}
        </p>
      )}
    </div>
  );
}

// Opportunity Detail page (see spec "v2 flow" step 3 + "Output — prep doc
// sections" Layout): Company Snapshot (collapsible, collapsed by default)
// above a reverse-chronological stage-prep feed — newest expanded, prior
// collapsed to a header — with "Generate Next Step" shown whenever at
// least one stage-prep exists (v2's hard cap of 2 total is gone as of v5 —
// unlimited sequential stages). An opportunity created via "Log Applied"
// starts with zero preps; this page shows FirstPrepForm in that case
// instead of an empty feed, so JD/resume can be added and the Recruiter
// Screen prep generated once a screen is scheduled.
export function OpportunityDetail({
  opportunity,
  onGenerateNextStep,
  onGenerateFirstPrep,
  onUpdateAppliedDate,
  onUpdateAdditionalContext,
  onRegenerateResearch,
  onAddContextEntry,
  onRegeneratePrep,
  onCloseOpportunity,
  onBack,
}: OpportunityDetailProps) {
  const preps = opportunity.preps; // already reverse-chronological from the API
  const [expandedId, setExpandedId] = useState<string | null>(preps[0]?.id ?? null);
  const [showNextStepForm, setShowNextStepForm] = useState(false);
  const [appliedDateError, setAppliedDateError] = useState<string | null>(null);
  const isClosed = opportunity.status !== "open";

  // Keep the newest stage expanded whenever a new prep is generated for
  // this opportunity, rather than leaving the previously-expanded (now
  // second-newest) prep open. Adjusted during render (React's recommended
  // pattern for state derived from a changing prop) rather than in an
  // effect, so there's no extra render pass.
  const [tracked, setTracked] = useState(preps);
  if (tracked !== preps) {
    setTracked(preps);
    setExpandedId(preps[0]?.id ?? null);
  }

  // v5: no upper bound — any opportunity with at least one stage-prep can
  // generate another. v8: closed opportunities can never generate another,
  // regardless of stage count — see README "Effect of closing".
  const canGenerateNextStep = preps.length >= 1 && !isClosed;

  const handleGenerateNextStep = async (input: NextStepRequest) => {
    await onGenerateNextStep(input);
    setShowNextStepForm(false);
  };

  const handleAppliedDateChange = async (value: string) => {
    setAppliedDateError(null);
    try {
      await onUpdateAppliedDate(value || null);
    } catch (err) {
      setAppliedDateError(err instanceof Error ? err.message : "Failed to update applied date.");
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="text-xs mb-4 cursor-pointer"
        style={{ color: theme.signal, fontFamily: sansFont }}
      >
        ← back
      </button>

      <p
        className="text-[11px] mb-4 pb-3 border-b"
        style={{ color: theme.paperMuted, fontFamily: sansFont, borderColor: theme.rule }}
      >
        A starting point, not a replacement for the original posting.
      </p>

      <div className="mb-5">
        <h1 style={{ fontFamily: serifFont }} className="text-2xl">
          {opportunity.company}
        </h1>
        <p className="text-sm" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
          {opportunity.role}
        </p>
        <p className="text-[11px] mt-1" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
          {opportunity.applicantName}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px]" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
            Applied
          </span>
          <input
            type="date"
            value={opportunity.appliedDate ?? ""}
            onChange={(e) => handleAppliedDateChange(e.target.value)}
            className="text-[11px] px-2 py-1 outline-none"
            style={{
              background: theme.panelRaised,
              border: `1px solid ${theme.rule}`,
              color: theme.paper,
              fontFamily: sansFont,
            }}
          />
          {appliedDateError && (
            <span className="text-[11px]" style={{ color: theme.danger, fontFamily: sansFont }}>
              {appliedDateError}
            </span>
          )}
        </div>
      </div>

      <CloseOpportunity status={opportunity.status} onClose={onCloseOpportunity} />

      <CompanySnapshot research={opportunity.companyResearch} onRegenerate={onRegenerateResearch} />

      <OpportunityContext value={opportunity.additionalContext} onSave={onUpdateAdditionalContext} />

      {preps.length === 0 ? (
        isClosed ? (
          <p className="text-sm" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
            This opportunity was closed before a prep doc was ever generated.
          </p>
        ) : (
          <div>
            <h2 className="text-sm mb-4" style={{ fontFamily: sansFont, fontWeight: 500, color: theme.paper }}>
              Add JD &amp; Generate Recruiter Screen Prep
            </h2>
            <FirstPrepForm onGenerate={onGenerateFirstPrep} />
          </div>
        )
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {preps.map((prep) => (
              <StagePrepCard
                key={prep.id}
                prep={prep}
                expanded={expandedId === prep.id}
                onToggle={() => setExpandedId((current) => (current === prep.id ? null : prep.id))}
                isOpenStage={prep.id === preps[0]?.id}
                onAddContextEntry={(body) => onAddContextEntry(prep.id, body)}
                onRegenerate={() => onRegeneratePrep(prep.id)}
              />
            ))}
          </div>

          {canGenerateNextStep && !showNextStepForm && (
            <button
              onClick={() => setShowNextStepForm(true)}
              className="w-full text-sm py-2.5 mt-5 tracking-wide cursor-pointer"
              style={{ background: theme.brass, color: theme.ink, fontFamily: sansFont, fontWeight: 600 }}
            >
              Generate Next Step
            </button>
          )}

          {canGenerateNextStep && showNextStepForm && (
            <div className="mt-5 pt-5 border-t" style={{ borderColor: theme.rule }}>
              <h2 className="text-sm mb-4" style={{ fontFamily: sansFont, fontWeight: 500, color: theme.paper }}>
                Generate Next Step
              </h2>
              <NextStepForm
                jdText={opportunity.jdText}
                onGenerate={handleGenerateNextStep}
                onCancel={() => setShowNextStepForm(false)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
