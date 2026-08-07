"use client";

import { theme, serifFont, sansFont } from "@/lib/theme";
import type { OpportunitySummary } from "@/types";

interface ArchiveProps {
  items: OpportunitySummary[];
  loading: boolean;
  onOpen: (id: string) => void;
}

export function Archive({ items, loading, onOpen }: ArchiveProps) {
  if (loading) {
    return (
      <p className="text-sm" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
        Loading…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
        No opportunities yet. Generate a prep doc and it&apos;ll show up here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const date = new Date(item.latestPrepAt ?? item.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
        return (
          <button
            key={item.id}
            onClick={() => onOpen(item.id)}
            className="flex items-center justify-between px-3.5 py-3 border text-left cursor-pointer"
            style={{ borderColor: theme.rule, background: theme.panel }}
          >
            <div style={{ fontFamily: serifFont }} className="text-base">
              {item.role} – {item.company}
            </div>
            <span className="text-[11px]" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
              {date}
            </span>
          </button>
        );
      })}
    </div>
  );
}
