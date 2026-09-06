"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Trash2, UserRoundPlus } from "lucide-react";
import { theme, serifFont, sansFont } from "@/lib/theme";
import type { Profile } from "@/types";

interface ProfilesProps {
  items: Profile[];
  loading: boolean;
  onDelete: (id: string) => void;
  onNew: () => void;
}

type SortKey = "name" | "createdAt";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "createdAt", label: "Created" },
];

function defaultDirFor(key: SortKey): SortDir {
  return key === "createdAt" ? "desc" : "asc";
}

function compareByKey(a: Profile, b: Profile, key: SortKey): number {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    case "createdAt":
      return a.createdAt.localeCompare(b.createdAt);
  }
}

function resumePreview(profile: Profile): string {
  if (!profile.resumeText) return "—";
  const oneLine = profile.resumeText.replace(/\s+/g, " ").trim();
  return oneLine.length > 80 ? `${oneLine.slice(0, 80)}…` : oneLine;
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

const headerCellClass = "px-2.5 py-2 text-[10px] uppercase tracking-wide font-medium text-left whitespace-nowrap";
const cellClass = "px-2.5 py-2.5 text-sm";
const nameCellClass = cellClass + " max-w-[14rem] truncate whitespace-nowrap";
const resumeCellClass = cellClass + " max-w-[28rem] truncate";

const newProfileButtonClass = "text-xs px-3 py-2 border shrink-0 cursor-pointer flex items-center gap-1.5";

// Profiles management screen (Profiles tab): a saved name + resume,
// created only via this tab's "New Profile" form or, as before, the New
// Opportunity form's post-submit save-as-profile prompt. Mirrors Archive's
// table/sort/mobile-card layout for consistency. No inline edit this
// session — delete + recreate is the only way to change a profile's
// stored resume or name.
export function Profiles({ items, loading, onDelete, onNew }: ProfilesProps) {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const cmp = compareByKey(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [items, sortKey, sortDir]);

  const newProfileButton = (
    <div className="flex justify-end mb-3">
      <button
        onClick={onNew}
        className={newProfileButtonClass}
        style={{ borderColor: theme.rule, color: theme.paperMuted, fontFamily: sansFont }}
      >
        <UserRoundPlus size={13} />
        New Profile
      </button>
    </div>
  );

  if (loading) {
    return (
      <>
        {newProfileButton}
        <p className="text-sm" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
          Loading…
        </p>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        {newProfileButton}
        <p className="text-sm" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
          No profiles yet. Create one, or accept the &quot;Save as profile?&quot; prompt after submitting a New
          Opportunity form manually.
        </p>
      </>
    );
  }

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(defaultDirFor(key));
    }
  };

  const handleDelete = (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Delete the profile "${profile.name}"? Any opportunity linked to it keeps its own saved data — this only removes the profile itself. This can't be undone.`
      )
    ) {
      onDelete(profile.id);
    }
  };

  return (
    <>
      {newProfileButton}

      {/* Same breakpoint swap as Archive's table -> card list. */}
      <div className="sm:hidden flex flex-col gap-2">
        {sorted.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center justify-between gap-2 px-3.5 py-3 border"
            style={{ borderColor: theme.rule, background: theme.panel }}
          >
            <div className="min-w-0">
              <div style={{ fontFamily: serifFont }} className="text-base truncate">
                {profile.name}
              </div>
              <div className="text-[11px] mt-0.5 truncate" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
                {resumePreview(profile)}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
                {formatTimestamp(profile.createdAt)}
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(e, profile)}
              className="cursor-pointer shrink-0"
              style={{ color: theme.paperMuted }}
              aria-label={`Delete ${profile.name}`}
              title="Delete profile"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto border" style={{ borderColor: theme.rule }}>
        <table className="w-full border-collapse table-auto" style={{ fontFamily: sansFont }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.rule}` }}>
              {COLUMNS.map((col) => {
                const isActive = sortKey === col.key;
                const Icon = isActive ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th key={col.key} className={headerCellClass}>
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 cursor-pointer"
                      style={{ color: isActive ? theme.brass : theme.paperMuted, fontFamily: sansFont }}
                    >
                      {col.label}
                      <Icon size={11} className={isActive ? "" : "opacity-50"} />
                    </button>
                  </th>
                );
              })}
              <th className={headerCellClass}>Resume</th>
              <th className="px-2.5 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((profile) => (
              <tr key={profile.id} style={{ borderBottom: `1px solid ${theme.rule}` }}>
                <td className={nameCellClass} style={{ color: theme.paper }} title={profile.name}>
                  {profile.name}
                </td>
                <td className={cellClass + " text-xs whitespace-nowrap"} style={{ color: theme.paperMuted }}>
                  {formatTimestamp(profile.createdAt)}
                </td>
                <td
                  className={resumeCellClass + " text-xs"}
                  style={{ color: theme.paperMuted }}
                  title={profile.resumeText ?? undefined}
                >
                  {resumePreview(profile)}
                </td>
                <td className="px-2.5 py-2.5">
                  <button
                    onClick={(e) => handleDelete(e, profile)}
                    className="cursor-pointer block"
                    style={{ color: theme.paperMuted }}
                    aria-label={`Delete ${profile.name}`}
                    title="Delete profile"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
