"use client";

import { useState } from "react";
import { ChevronDown, Building2, Target, HelpCircle, MessageSquareText, ClipboardList } from "lucide-react";
import { theme, serifFont, sansFont } from "@/lib/theme";
import type { Prep } from "@/types";

// Hard-coded for v1 (recruiter screen is the only stage). v2 adds more
// stages across the same prep-doc pattern — this label is what will need
// to vary per prep once that lands (see job-assistant-spec.md v1/v2/v-next).
const STAGE_LABEL = "Recruiter Screen Prep";

const SECTIONS = [
  {
    code: "01",
    key: "company",
    label: "Company",
    subtext: "funding, culture, and recent signals worth knowing",
    icon: Building2,
  },
  {
    code: "02",
    key: "fit",
    label: "Fit",
    subtext: "where your background matches what they're asking for",
    icon: Target,
  },
  {
    code: "03",
    key: "expect",
    label: "Expect",
    subtext: "likely questions and how to frame your answers",
    icon: HelpCircle,
  },
  {
    code: "04",
    key: "ask",
    label: "Ask",
    subtext: "good questions to ask them",
    icon: MessageSquareText,
  },
  {
    code: "05",
    key: "logistics",
    label: "Logistics",
    subtext: "comp, availability, and practical details to confirm",
    icon: ClipboardList,
  },
] as const;

interface DossierDocProps {
  company: string;
  role: string;
  prep: Prep;
}

export function DossierDoc({ company, role, prep }: DossierDocProps) {
  const [open, setOpen] = useState<string | null>("company");
  const date = new Date(prep.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-wide" style={{ color: theme.brass, fontFamily: sansFont }}>
            {date}
          </div>
          <h1 style={{ fontFamily: serifFont }} className="text-2xl mt-0.5">
            {company}
          </h1>
          <p className="text-sm" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
            {role}
          </p>
          <p
            className="text-[10px] uppercase tracking-wide mt-1"
            style={{ color: theme.paperMuted, fontFamily: sansFont }}
          >
            {STAGE_LABEL}
          </p>
        </div>
        {prep.source === "mock" && (
          <span
            className="text-[10px] uppercase tracking-wide px-2 py-1 border shrink-0"
            style={{ borderColor: theme.brassDim, color: theme.brassDim, fontFamily: sansFont }}
            title="Generated from the hard-coded example response (MOCK_MODE=true), not a live Claude call."
          >
            Mock
          </span>
        )}
      </div>

      <div className="border" style={{ borderColor: theme.rule }}>
        {SECTIONS.map((s, i) => {
          const isOpen = open === s.key;
          const Icon = s.icon;
          return (
            <div key={s.key} style={{ borderTop: i === 0 ? "none" : `1px solid ${theme.rule}` }}>
              <button
                onClick={() => setOpen(isOpen ? null : s.key)}
                className="w-full flex items-start justify-between gap-3 px-3.5 py-3 text-left cursor-pointer"
                style={{ background: isOpen ? theme.panelRaised : "transparent" }}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="text-[10px]"
                      style={{ color: isOpen ? theme.brass : theme.paperMuted, fontFamily: sansFont }}
                    >
                      {s.code}
                    </span>
                    <Icon size={14} color={isOpen ? theme.brass : theme.paperMuted} />
                    <span className="text-sm" style={{ fontFamily: sansFont, fontWeight: 500, color: theme.paper }}>
                      {s.label}
                    </span>
                  </div>
                  <span className="text-[11px] pl-[42px]" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
                    {s.subtext}
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
                  className="px-3.5 pb-4 text-sm leading-relaxed"
                  style={{ color: theme.paper, fontFamily: sansFont, opacity: 0.92 }}
                >
                  {prep.content[s.key]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
