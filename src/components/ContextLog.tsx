"use client";

import { useState } from "react";
import { theme, sansFont } from "@/lib/theme";
import { inputStyle } from "@/components/formStyles";
import type { ContextEntry } from "@/types";

interface ContextLogProps {
  entries: ContextEntry[];
  // True while this is the opportunity's most-recently-created stage —
  // the only state in which new entries are addable (see README's v4
  // entry: "stays open ... until the next stage begins").
  open: boolean;
  onAdd: (body: string) => Promise<void>;
}

// v4: append-only log for a single stage, rendered inside StagePrepCard.
// Entries accumulate here from the moment a stage is created — pre-
// interview notes, live notes, a post-call debrief, eventually the invite
// email for the next round — until Generate Next Step creates the
// following stage, at which point this log goes read-only and its full
// contents have already fed that next stage's generation (see
// PriorStageContext.contextLog in src/lib/ai/generate.ts). No edit/delete
// surfaced — additive only, matching a log that doesn't rewrite history.
export function ContextLog({ entries, open, onAdd }: ContextLogProps) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (entries.length === 0 && !open) return null;

  const handleAdd = async () => {
    if (!draft.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd(draft.trim());
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-3.5 py-3 border-t" style={{ borderColor: theme.rule }}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[11px] uppercase tracking-wide"
          style={{ color: theme.paperMuted, fontFamily: sansFont }}
        >
          Context Log
        </span>
        {entries.length > 0 && (
          <span className="text-[11px]" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
            ({entries.length})
          </span>
        )}
        {!open && (
          <span className="text-[11px] italic" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
            — closed, fed the next stage&apos;s prep
          </span>
        )}
      </div>

      {entries.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {entries.map((entry) => (
            <div key={entry.id} className="text-sm leading-snug" style={{ fontFamily: sansFont, color: theme.paper }}>
              <span className="text-[11px] mr-1.5" style={{ color: theme.signal }}>
                {new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <span style={{ opacity: 0.92 }}>{entry.body}</span>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Add a note — pre-interview prep, how it went, an invite email for the next round…"
            className="w-full text-sm px-2.5 py-2 outline-none resize-y"
            style={inputStyle}
          />
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleAdd}
              disabled={saving || !draft.trim()}
              className="text-xs px-3 py-1.5 tracking-wide self-start"
              style={{
                background: draft.trim() ? theme.brass : theme.panelRaised,
                color: draft.trim() ? theme.ink : theme.paperMuted,
                fontFamily: sansFont,
                fontWeight: 600,
                cursor: draft.trim() && !saving ? "pointer" : "default",
              }}
            >
              {saving ? "Adding…" : "Add entry"}
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
