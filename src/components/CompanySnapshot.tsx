"use client";

import { useState } from "react";
import { ChevronDown, Building2, RefreshCw } from "lucide-react";
import { theme, sansFont } from "@/lib/theme";
import type { CompanyResearch } from "@/types";

interface CompanySnapshotProps {
  research: CompanyResearch | null;
  onRegenerate: () => Promise<void>;
}

// Persistent, collapsible block at the top of the Opportunity Detail page
// — collapsed by default (see spec "Layout"). Generated once via Call 1
// and shown once per opportunity, never duplicated per stage. The
// Regenerate action below is the one deliberate exception to "once per
// opportunity": a manual, opt-in re-run of Call 1 for when the cached
// result came back malformed (e.g. a missing section rendered as a
// literal "Not found." — see src/lib/ai/research.ts).
export function CompanySnapshot({ research, onRegenerate }: CompanySnapshotProps) {
  const [open, setOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!research) return null;

  const handleRegenerate = async () => {
    if (
      !window.confirm(
        "Re-run company research? This replaces the cached snapshot shown across every stage for this opportunity."
      )
    ) {
      return;
    }
    setRegenerating(true);
    setError(null);
    try {
      await onRegenerate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate.");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="border mb-5" style={{ borderColor: theme.rule }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left cursor-pointer"
        style={{ background: open ? theme.panelRaised : "transparent" }}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <Building2 size={14} color={open ? theme.brass : theme.paperMuted} />
          <span className="text-sm" style={{ fontFamily: sansFont, fontWeight: 500, color: theme.paper }}>
            Company Snapshot
          </span>
          <span className="text-[11px] italic" style={{ color: theme.signal, fontFamily: sansFont }}>
            From live research — verify independently
          </span>
        </div>
        <ChevronDown
          size={15}
          color={theme.paperMuted}
          className="shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 120ms" }}
        />
      </button>
      {open && (
        <div
          className="px-3.5 pb-4 text-sm leading-relaxed flex flex-col gap-2.5 border-t"
          style={{ color: theme.paper, fontFamily: sansFont, opacity: 0.92, borderColor: theme.rule, paddingTop: 12 }}
        >
          <p>{research.basicInfo}</p>
          <p>{research.recentNews}</p>
          <p>{research.culture}</p>
          {research.sources.length > 0 && (
            <p className="text-[11px]" style={{ color: theme.paperMuted, opacity: 1 }}>
              Sources: {research.sources.join(", ")}
            </p>
          )}
          <div className="flex items-center gap-2.5 mt-1" style={{ opacity: 1 }}>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-xs px-3 py-1.5 tracking-wide flex items-center gap-1.5"
              style={{
                background: theme.panelRaised,
                color: theme.paperMuted,
                fontFamily: sansFont,
                fontWeight: 600,
                border: `1px solid ${theme.rule}`,
                cursor: regenerating ? "default" : "pointer",
              }}
            >
              <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
              {regenerating ? "Regenerating…" : "Regenerate"}
            </button>
            {error && (
              <span className="text-[11px]" style={{ color: theme.danger, fontFamily: sansFont }}>
                {error}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
