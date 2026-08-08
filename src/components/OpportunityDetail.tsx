"use client";

import { useState } from "react";
import { theme, serifFont, sansFont } from "@/lib/theme";
import { CompanySnapshot } from "@/components/CompanySnapshot";
import { StagePrepCard } from "@/components/StagePrepCard";
import { NextStepForm } from "@/components/NextStepForm";
import type { NextStepRequest, OpportunityWithPreps } from "@/types";

interface OpportunityDetailProps {
  opportunity: OpportunityWithPreps;
  onGenerateNextStep: (input: NextStepRequest) => Promise<void>;
  onBack: () => void;
}

// Opportunity Detail page (see spec "v2 flow" step 3 + "Output — prep doc
// sections" Layout): Company Snapshot (collapsible, collapsed by default)
// above a reverse-chronological stage-prep feed — newest expanded, prior
// collapsed to a header — with "Generate Next Step" shown only while
// exactly 1 stage-prep exists (v2's hard cap of 2 total).
export function OpportunityDetail({ opportunity, onGenerateNextStep, onBack }: OpportunityDetailProps) {
  const preps = opportunity.preps; // already reverse-chronological from the API
  const [expandedId, setExpandedId] = useState<string | null>(preps[0]?.id ?? null);
  const [showNextStepForm, setShowNextStepForm] = useState(false);

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

  const canGenerateNextStep = preps.length === 1;

  const handleGenerateNextStep = async (input: NextStepRequest) => {
    await onGenerateNextStep(input);
    setShowNextStepForm(false);
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
      </div>

      <CompanySnapshot research={opportunity.companyResearch} />

      <div className="flex flex-col gap-2.5">
        {preps.map((prep) => (
          <StagePrepCard
            key={prep.id}
            prep={prep}
            expanded={expandedId === prep.id}
            onToggle={() => setExpandedId((current) => (current === prep.id ? null : prep.id))}
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
    </div>
  );
}
