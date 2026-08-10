"use client";

import { useState, useEffect } from "react";
import { ChevronDown, StickyNote } from "lucide-react";
import { theme, sansFont } from "@/lib/theme";
import { inputStyle } from "@/components/formStyles";

interface OpportunityContextProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
}

// v3: persistent, opportunity-wide running note — separate from each stage
// prep's one-shot additional-context field (see StagePrepCard/NextStepForm).
// Collapsible like Company Snapshot, but behaves like a running note rather
// than a form: the textarea is seeded from `value` (already loaded with the
// opportunity) so it never opens blank when content already exists — the
// user edits/appends in place rather than filling out a fresh field.
export function OpportunityContext({ value, onSave }: OpportunityContextProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // Stay in sync if the saved value changes from outside this component
  // (e.g. reopening the opportunity fresh from the archive).
  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  const dirty = draft !== (value ?? "");

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft.trim() || null);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
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
          <StickyNote size={14} color={open ? theme.brass : theme.paperMuted} />
          <span className="text-sm" style={{ fontFamily: sansFont, fontWeight: 500, color: theme.paper }}>
            Additional Context
          </span>
          <span className="text-[11px] italic" style={{ color: theme.signal, fontFamily: sansFont }}>
            Persists across every stage for this opportunity
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
        <div className="px-3.5 pb-4 border-t" style={{ borderColor: theme.rule, paddingTop: 12 }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder="A running note for this opportunity — interviewer email contents, how a prior session actually went, org-structure detail you've picked up. Add your own dates inline if useful, e.g. &quot;Aug 10: ...&quot;"
            className="w-full text-sm px-2.5 py-2 outline-none resize-y"
            style={inputStyle}
          />
          <div className="flex items-center gap-2.5 mt-2">
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="text-xs px-3 py-1.5 tracking-wide"
              style={{
                background: dirty ? theme.brass : theme.panelRaised,
                color: dirty ? theme.ink : theme.paperMuted,
                fontFamily: sansFont,
                fontWeight: 600,
                cursor: dirty && !saving ? "pointer" : "default",
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {justSaved && (
              <span className="text-[11px]" style={{ color: theme.signal, fontFamily: sansFont }}>
                Saved
              </span>
            )}
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
