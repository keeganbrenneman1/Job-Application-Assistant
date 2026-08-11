"use client";

import { useState } from "react";
import { Chrome, type View } from "@/components/Chrome";
import { NewPrepForm, type NewPrepInput } from "@/components/NewPrepForm";
import { LogAppliedForm } from "@/components/LogAppliedForm";
import { OpportunityDetail } from "@/components/OpportunityDetail";
import { Archive } from "@/components/Archive";
import { theme, sansFont } from "@/lib/theme";
import type {
  FirstPrepRequest,
  FirstPrepResponse,
  GenerateResponse,
  LogAppliedRequest,
  LogAppliedResponse,
  NextStepRequest,
  NextStepResponse,
  OpportunitySummary,
  OpportunityWithPreps,
  RegenerateResearchResponse,
} from "@/types";

// Shared by every flow that triggers Call 1 from the client (New
// Opportunity step 2, Log Applied's "add JD & generate" step 1, and the
// Company Snapshot Regenerate button) — runs research for an opportunity
// that already exists and returns it with research applied. The 65s abort
// timeout surfaces a stalled request as a visible error instead of an
// indefinite silent hang (see the maxDuration=60 fix on the server side —
// this is set just above that so the server's own limit fires first when
// that's the actual cause).
async function runResearch(opportunityId: string): Promise<OpportunityWithPreps> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 65000);
  let res: Response;
  try {
    res = await fetch(`/api/opportunities/${opportunityId}/regenerate-research`, {
      method: "POST",
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "Researching the company timed out after 65s with no response — the request may not be reaching the server, or the research call is taking unusually long."
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to research the company.");
  return (data as RegenerateResearchResponse).opportunity;
}

export default function App() {
  const [view, setView] = useState<View>("new");
  const [archive, setArchive] = useState<OpportunitySummary[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [activeOpportunity, setActiveOpportunity] = useState<OpportunityWithPreps | null>(null);
  const [showLogAppliedForm, setShowLogAppliedForm] = useState(false);

  // Shared across both users — see spec "User & data model". Applicant
  // name is captured per-opportunity (set in the New Prep form itself),
  // not by a global switcher — there's nothing here to scope the archive by.
  const loadArchive = async () => {
    setArchiveLoading(true);
    try {
      const res = await fetch("/api/opportunities");
      const data = await res.json();
      setArchive(res.ok ? data.opportunities : []);
    } finally {
      setArchiveLoading(false);
    }
  };

  const changeView = (v: View) => {
    setView(v);
    setShowLogAppliedForm(false);
    if (v === "archive") loadArchive();
  };

  // Three steps against three separate requests — see /api/generate for
  // why: research (Call 1) and generation (Call 2) combined in one request
  // routinely approached Vercel's 60s function duration limit. Step 1
  // (create) is fast and essentially never fails once validation passes,
  // so an error there still leaves the user on the form as before. Steps 2
  // and 3 run against an opportunity that now already exists in the
  // database — if either fails, that's surfaced explicitly and the user is
  // taken to the (now real) opportunity's Detail page to retry from there,
  // rather than left looking at a blank form with no sign anything happened.
  const handleGenerate = async (input: NewPrepInput, onStage: (stage: string) => void) => {
    onStage("Creating opportunity…");
    const createRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicantName: input.applicantName,
        company: input.company,
        role: input.role,
        jdText: input.jdText,
        appliedDate: input.appliedDate,
        additionalContext: input.additionalContext,
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData.error || "Failed to create the opportunity.");
    const { opportunity } = createData as GenerateResponse;
    // Reassigned as each step succeeds, so the catch block below can fall
    // back to whatever's actually persisted so far (e.g. research having
    // completed even if generation then fails) instead of the stale,
    // pre-research object from step 1.
    let latestOpportunity = opportunity;

    try {
      onStage("Researching company…");
      latestOpportunity = await runResearch(opportunity.id);

      onStage("Generating prep…");
      const prepRes = await fetch(`/api/opportunities/${opportunity.id}/first-prep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText: input.jdText, resumeText: input.resumeText }),
      });
      const prepData = await prepRes.json();
      if (!prepRes.ok) throw new Error(prepData.error || "Generation failed.");

      const { opportunity: finalOpportunity, prep } = prepData as FirstPrepResponse;
      setActiveOpportunity({ ...finalOpportunity, preps: [prep] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed.";
      window.alert(
        `"${opportunity.role} – ${opportunity.company}" was created, but generating its prep failed: ${message}\n\nYou can retry from its Opportunity Detail page.`
      );
      setActiveOpportunity({ ...latestOpportunity, preps: [] });
    }
  };

  const handleLogApplied = async (input: LogAppliedRequest) => {
    const res = await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to log the opportunity.");

    const { opportunity } = data as LogAppliedResponse;
    setShowLogAppliedForm(false);
    setActiveOpportunity({ ...opportunity, preps: [] });
  };

  // Same split as New Opportunity (see handleGenerate) — research, then
  // generation, as two requests instead of one. Skips the research step
  // entirely if this opportunity already has cached research (e.g. a
  // retry after generation failed last time but research had already
  // succeeded) rather than needlessly re-running Call 1.
  const handleGenerateFirstPrep = async (input: FirstPrepRequest, onStage: (stage: string) => void) => {
    if (!activeOpportunity) return;

    if (!activeOpportunity.companyResearch) {
      onStage("Researching company…");
      const researched = await runResearch(activeOpportunity.id);
      setActiveOpportunity((current) => (current ? { ...researched, preps: current.preps } : researched));
    }

    onStage("Generating prep…");
    const res = await fetch(`/api/opportunities/${activeOpportunity.id}/first-prep`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Generation failed.");

    const { opportunity, prep } = data as FirstPrepResponse;
    setActiveOpportunity({ ...opportunity, preps: [prep] });
  };

  const handleGenerateNextStep = async (input: NextStepRequest) => {
    if (!activeOpportunity) return;
    const res = await fetch(`/api/opportunities/${activeOpportunity.id}/next-step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Generation failed.");

    const { opportunity, prep } = data as NextStepResponse;
    setActiveOpportunity((current) =>
      current ? { ...opportunity, preps: [prep, ...current.preps] } : { ...opportunity, preps: [prep] }
    );
  };

  const handleUpdateAppliedDate = async (appliedDate: string | null) => {
    if (!activeOpportunity) return;
    const res = await fetch(`/api/opportunities/${activeOpportunity.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appliedDate }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update applied date.");
    setActiveOpportunity(data.opportunity as OpportunityWithPreps);
  };

  const handleUpdateAdditionalContext = async (additionalContext: string | null) => {
    if (!activeOpportunity) return;
    const res = await fetch(`/api/opportunities/${activeOpportunity.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ additionalContext }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update additional context.");
    setActiveOpportunity(data.opportunity as OpportunityWithPreps);
  };

  // v4: appends one entry to stageId's context log. Only the opportunity's
  // most-recently-created stage accepts this (enforced server-side too) —
  // see ContextLog on StagePrepCard.
  const handleAddContextEntry = async (stageId: string, body: string) => {
    if (!activeOpportunity) return;
    const res = await fetch(`/api/opportunities/${activeOpportunity.id}/preps/${stageId}/context-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add context entry.");
    setActiveOpportunity(data.opportunity as OpportunityWithPreps);
  };

  const handleRegenerateResearch = async () => {
    if (!activeOpportunity) return;
    const opportunity = await runResearch(activeOpportunity.id);
    setActiveOpportunity(opportunity);
  };

  const handleOpenOpportunity = async (id: string) => {
    const res = await fetch(`/api/opportunities/${id}`);
    const data = await res.json();
    if (!res.ok) {
      window.alert(data.error || "Failed to open opportunity.");
      return;
    }
    setActiveOpportunity(data.opportunity as OpportunityWithPreps);
  };

  const handleDeleteOpportunity = async (id: string) => {
    const res = await fetch(`/api/opportunities/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error || "Failed to delete opportunity.");
      return;
    }
    setArchive((prev) => prev.filter((o) => o.id !== id));
  };

  const showingArchiveList = view === "archive" && !activeOpportunity && !showLogAppliedForm;

  return (
    <Chrome view={view} setView={changeView} wide={showingArchiveList}>
      {activeOpportunity ? (
        <OpportunityDetail
          opportunity={activeOpportunity}
          onGenerateNextStep={handleGenerateNextStep}
          onGenerateFirstPrep={handleGenerateFirstPrep}
          onUpdateAppliedDate={handleUpdateAppliedDate}
          onUpdateAdditionalContext={handleUpdateAdditionalContext}
          onRegenerateResearch={handleRegenerateResearch}
          onAddContextEntry={handleAddContextEntry}
          onBack={() => setActiveOpportunity(null)}
        />
      ) : view === "new" ? (
        <NewPrepForm onGenerate={handleGenerate} />
      ) : showLogAppliedForm ? (
        <div>
          <button
            onClick={() => setShowLogAppliedForm(false)}
            className="text-xs mb-4 cursor-pointer"
            style={{ color: theme.signal, fontFamily: sansFont }}
          >
            ← back
          </button>
          <LogAppliedForm onLogApplied={handleLogApplied} />
        </div>
      ) : (
        <Archive
          items={archive}
          loading={archiveLoading}
          onOpen={handleOpenOpportunity}
          onDelete={handleDeleteOpportunity}
          onLogApplied={() => setShowLogAppliedForm(true)}
        />
      )}
    </Chrome>
  );
}
