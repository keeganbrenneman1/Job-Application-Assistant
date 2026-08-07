"use client";

import { useEffect, useState } from "react";
import { Chrome, type View } from "@/components/Chrome";
import { NewPrepForm, type NewPrepInput } from "@/components/NewPrepForm";
import { DossierDoc } from "@/components/DossierDoc";
import { Archive } from "@/components/Archive";
import { theme, sansFont } from "@/lib/theme";
import type { GenerateResponse, OpportunitySummary, OpportunityWithPreps, Profile } from "@/types";

const PROFILE_STORAGE_KEY = "jaa-profile";

export default function App() {
  const [profile, setProfileState] = useState<Profile>("keegan");
  const [view, setView] = useState<View>("new");
  const [archive, setArchive] = useState<OpportunitySummary[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [activeOpportunity, setActiveOpportunity] = useState<OpportunityWithPreps | null>(null);
  const [activePrepId, setActivePrepId] = useState<string | null>(null);

  useEffect(() => {
    // One-time hydration from client-only storage: server and first client
    // render both use the "keegan" default, so there's no mismatch to
    // reconcile — just a same-value read, not derived/cascading state.
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "keegan" || stored === "spouse") setProfileState(stored);
  }, []);

  // Shared across both profiles — see job-assistant-spec.md "User & data
  // model". The profile picker only tags who generated a new prep; it
  // doesn't scope what's visible in the archive.
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

  const setProfile = (p: Profile) => {
    setProfileState(p);
    window.localStorage.setItem(PROFILE_STORAGE_KEY, p);
    setActiveOpportunity(null);
    setActivePrepId(null);
  };

  const changeView = (v: View) => {
    setView(v);
    if (v === "archive") loadArchive();
  };

  const handleGenerate = async (input: NewPrepInput) => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: profile, ...input }),
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

  const activePrep = activeOpportunity?.preps.find((p) => p.id === activePrepId) ?? null;

  return (
    <Chrome profile={profile} setProfile={setProfile} view={view} setView={changeView}>
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
        <Archive items={archive} loading={archiveLoading} onOpen={handleOpenOpportunity} />
      )}
    </Chrome>
  );
}
