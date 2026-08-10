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

  const handleGenerate = async (input: NewPrepInput) => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Generation failed.");

    const { opportunity, prep } = data as GenerateResponse;
    setActiveOpportunity({ ...opportunity, preps: [prep] });
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

  const handleGenerateFirstPrep = async (input: FirstPrepRequest) => {
    if (!activeOpportunity) return;
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

  const handleRegenerateResearch = async () => {
    if (!activeOpportunity) return;

    // Diagnostic: without this, a stalled request just leaves the button
    // stuck on "Regenerating…" indefinitely with no visible error —
    // exactly the symptom this is meant to surface instead. Distinguishes
    // "we gave up waiting" from a real server-side error response. Set
    // above the route's own maxDuration=60s (see regenerate-research/
    // route.ts) so the server's own limit fires first when that's the
    // actual cause, rather than this racing it and winning by 5s.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 65000);
    let res: Response;
    try {
      res = await fetch(`/api/opportunities/${activeOpportunity.id}/regenerate-research`, {
        method: "POST",
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error(
          "Regenerate timed out after 65s with no response — the request may not be reaching the server, or the research call is taking unusually long."
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to regenerate company research.");
    const { opportunity } = data as RegenerateResearchResponse;
    setActiveOpportunity(opportunity);
  };

  const handleOpenOpportunity = async (id: string) => {
    const res = await fetch(`/api/opportunities/${id}`);
    const data = await res.json();
    if (!res.ok) return;
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
