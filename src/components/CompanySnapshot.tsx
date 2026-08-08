"use client";

import { useState } from "react";
import { ChevronDown, Building2 } from "lucide-react";
import { theme, sansFont } from "@/lib/theme";
import type { CompanyResearch } from "@/types";

interface CompanySnapshotProps {
  research: CompanyResearch | null;
}

// Persistent, collapsible block at the top of the Opportunity Detail page
// — collapsed by default (see spec "Layout"). Generated once via Call 1
// and shown once per opportunity, never duplicated per stage.
export function CompanySnapshot({ research }: CompanySnapshotProps) {
  const [open, setOpen] = useState(false);

  if (!research) return null;

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
        </div>
      )}
    </div>
  );
}
