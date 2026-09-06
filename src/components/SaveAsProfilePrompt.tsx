"use client";

import { useState } from "react";
import { theme, sansFont } from "@/lib/theme";

interface SaveAsProfilePromptProps {
  name: string;
  onSave: () => Promise<void>;
  onDismiss: () => void;
}

// Post-submit, non-blocking prompt (see README "Profiles" / story 3):
// shown once, right after an opportunity is created with a name + resume
// typed manually (no profile selected). The opportunity is already saved
// either way — accepting just creates a profiles row from what was already
// typed and links this opportunity to it; dismissing (or ignoring) leaves
// everything as-is. Never reappears for this opportunity — this is
// transient client state in src/app/page.tsx, not a persisted flag.
export function SaveAsProfilePrompt({ name, onSave, onDismiss }: SaveAsProfilePromptProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
      setSaving(false);
    }
  };

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 mb-5 border flex-wrap"
      style={{ borderColor: theme.rule, background: theme.panel }}
    >
      <div>
        <p className="text-sm" style={{ color: theme.paper, fontFamily: sansFont }}>
          Save &quot;{name}&quot; as a profile?
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
          Reuse this name + resume next time without retyping.
        </p>
        {error && (
          <p className="text-[11px] mt-1" style={{ color: theme.danger, fontFamily: sansFont }}>
            {error}
          </p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-3 py-1.5 cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: theme.brass,
            color: theme.ink,
            fontFamily: sansFont,
            fontWeight: 600,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "Save as profile"}
        </button>
        <button
          onClick={onDismiss}
          disabled={saving}
          className="text-xs px-3 py-1.5 border cursor-pointer disabled:cursor-not-allowed"
          style={{ borderColor: theme.rule, color: theme.paperMuted, fontFamily: sansFont }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
