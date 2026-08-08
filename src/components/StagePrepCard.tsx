"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { theme, serifFont, sansFont } from "@/lib/theme";
import { STAGE_SECTIONS } from "@/types";
import type { StagePrep } from "@/types";

interface StagePrepCardProps {
  prep: StagePrep;
  expanded: boolean;
  onToggle: () => void;
}

// One stage-prep in the reverse-chronological feed. `expanded` controls
// whether this renders as a full card (newest, by default) or collapsed
// to a single header row (prior stages) — toggling never triggers a new
// API call, the prep's content is already loaded (see spec "Review
// without regeneration").
export function StagePrepCard({ prep, expanded, onToggle }: StagePrepCardProps) {
  const sections = STAGE_SECTIONS[prep.stageType];
  const [openSection, setOpenSection] = useState<string | null>(sections[0]?.key ?? null);
  const date = new Date(prep.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  if (!expanded) {
    return (
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-3 border cursor-pointer text-left"
        style={{ borderColor: theme.rule, background: theme.panel }}
      >
        <div className="flex items-baseline gap-2">
          <span style={{ fontFamily: serifFont, color: theme.paper }} className="text-sm">
            {prep.stageLabel}
          </span>
          <span className="text-[11px]" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
            {date}
          </span>
        </div>
        <ChevronRight size={14} color={theme.paperMuted} className="shrink-0" />
      </button>
    );
  }

  return (
    <div className="border" style={{ borderColor: theme.rule }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left cursor-pointer"
        style={{ background: theme.panelRaised }}
      >
        <div className="flex items-baseline gap-2 flex-wrap">
          <span style={{ fontFamily: serifFont, color: theme.brass }} className="text-base">
            {prep.stageLabel}
          </span>
          <span className="text-[11px]" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
            {date}
          </span>
          {prep.source === "mock" && (
            <span
              className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 border"
              style={{ borderColor: theme.brassDim, color: theme.brassDim, fontFamily: sansFont }}
              title="Generated from the hard-coded example response (MOCK_MODE=true), not a live Claude call."
            >
              Mock
            </span>
          )}
        </div>
        <ChevronDown size={15} color={theme.paperMuted} className="shrink-0" style={{ transform: "rotate(180deg)" }} />
      </button>

      {prep.additionalContext && (
        <div
          className="px-3.5 py-2 text-[11px] italic border-t"
          style={{ borderColor: theme.rule, color: theme.paperMuted, fontFamily: sansFont }}
        >
          Context supplied for this stage: {prep.additionalContext}
        </div>
      )}

      <div>
        {sections.map((s, i) => {
          const isOpen = openSection === s.key;
          return (
            <div key={s.key} style={{ borderTop: `1px solid ${theme.rule}` }}>
              <button
                onClick={() => setOpenSection(isOpen ? null : s.key)}
                className="w-full flex items-start justify-between gap-3 px-3.5 py-3 text-left cursor-pointer"
                style={{ background: isOpen ? theme.panelRaised : "transparent" }}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="text-[10px]"
                      style={{ color: isOpen ? theme.brass : theme.paperMuted, fontFamily: sansFont }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm" style={{ fontFamily: sansFont, fontWeight: 500, color: theme.paper }}>
                      {s.label}
                    </span>
                  </div>
                  <span className="text-[11px] pl-[26px]" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
                    {s.subtext}
                  </span>
                  <span className="text-[11px] pl-[26px] italic" style={{ color: theme.signal, fontFamily: sansFont }}>
                    {s.provenance}
                  </span>
                </div>
                <ChevronDown
                  size={15}
                  color={theme.paperMuted}
                  className="mt-0.5 shrink-0"
                  style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 120ms" }}
                />
              </button>
              {isOpen && (
                <div
                  className="pb-4 text-sm leading-relaxed"
                  style={{
                    color: theme.paper,
                    fontFamily: sansFont,
                    opacity: 0.92,
                    paddingLeft: 26,
                    paddingRight: 14,
                  }}
                >
                  {prep.content[s.key] ?? ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
