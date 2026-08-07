"use client";

import { FolderOpen, FilePlus } from "lucide-react";
import { theme, serifFont, sansFont } from "@/lib/theme";

export type View = "new" | "archive";

interface ChromeProps {
  view: View;
  setView: (v: View) => void;
  wide?: boolean;
  children: React.ReactNode;
}

export function Chrome({ view, setView, wide, children }: ChromeProps) {
  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: theme.ink, color: theme.paper }}>
      <header
        className="flex items-center px-5 py-4 border-b"
        style={{ borderColor: theme.rule, background: theme.panel }}
      >
        <div className="flex items-baseline gap-2">
          <span style={{ fontFamily: serifFont }} className="text-lg tracking-tight">
            Interview Prep
          </span>
          <span className="text-xs" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
            recruiter screen
          </span>
        </div>
      </header>

      <nav className="flex border-b" style={{ borderColor: theme.rule, background: theme.panel }}>
        {(
          [
            { key: "new", label: "New Prep", icon: FilePlus },
            { key: "archive", label: "Opportunities", icon: FolderOpen },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs cursor-pointer"
            style={{
              fontFamily: sansFont,
              color: view === tab.key ? theme.brass : theme.paperMuted,
              borderBottom: view === tab.key ? `2px solid ${theme.brass}` : "2px solid transparent",
            }}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </nav>

      <main className={`flex-1 px-5 py-6 w-full mx-auto ${wide ? "max-w-4xl" : "max-w-xl"}`}>{children}</main>
    </div>
  );
}
