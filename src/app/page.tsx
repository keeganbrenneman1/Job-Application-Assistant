"use client";

import { useState } from "react";
import { Chrome, type View } from "@/components/Chrome";
import { NewPrepForm, type NewPrepInput } from "@/components/NewPrepForm";
import { DossierDoc } from "@/components/DossierDoc";
import { Archive } from "@/components/Archive";
import { theme, sansFont } from "@/lib/theme";
import type { GenerateResponse, OpportunitySummary, OpportunityWithPreps } from "@/types";

export default function App() {
  const [view, setView] = useState<View>("new");
  const [archive, setArchive] = useState<OpportunitySummary[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [activeOpportunity, setActiveOpportunity] = useState<OpportunityWithPreps | null>(null);
  const [activePrepId, setActivePrepId] = useState<string | null>(null);

  // Shared across both profiles — see JOB APPLICATION ASSISTANT SPEC.md "User & data
  // model". Who generated a prep is captured per-opportunity (set in the
  // New Prep form itself), not by a global switcher — there's nothing here
  // to scope the archive by.
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
    setActivePrepId(prep.id);
  };

  const handleOpenOpportunity = async (id: string) => {
    const res = await fetch(`/api/opportunities/${id}`);
    const data = await res.json();
    if (!res.ok) return;
    const opportunity = data.opportunity as OpportunityWithPreps;
    setActiveOpportunity(opportunity);
    setActivePrepId(opportunity.preps[0]?.id ?? null);
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

  const activePrep = activeOpportunity?.preps.find((p) => p.id === activePrepId) ?? null;
  const showingArchive = view === "archive" && !(activeOpportunity && activePrep);

  return (
    <Chrome view={view} setView={changeView} wide={showingArchive}>
      {activeOpportunity && activePrep ? (
        <div>
          <button
            onClick={() => {
              setActiveOpportunity(null);
              setActivePrepId(null);
            }}
            className="text-xs mb-4 cursor-pointer"
            style={{ color: theme.signal, fontFamily: sansFont }}
          >
            ← back
          </button>
          <DossierDoc company={activeOpportunity.company} role={activeOpportunity.role} prep={activePrep} />
          {activeOpportunity.preps.length > 1 && (
            <div className="mt-6">
              <div
                className="text-[11px] uppercase tracking-wide mb-2"
                style={{ color: theme.paperMuted, fontFamily: sansFont }}
              >
                Earlier preps for this opportunity
              </div>
              <div className="flex flex-col gap-1.5">
                {activeOpportunity.preps.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePrepId(p.id)}
                    className="text-left text-xs px-3 py-2 border cursor-pointer"
                    style={{
                      borderColor: p.id === activePrepId ? theme.brass : theme.rule,
                      color: p.id === activePrepId ? theme.brass : theme.paperMuted,
                      fontFamily: sansFont,
                    }}
                  >
                    {new Date(p.createdAt).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : view === "new" ? (
        <NewPrepForm onGenerate={handleGenerate} />
      ) : (
        <Archive
          items={archive}
          loading={archiveLoading}
          onOpen={handleOpenOpportunity}
          onDelete={handleDeleteOpportunity}
        />
      )}
    </Chrome>
  );
}
