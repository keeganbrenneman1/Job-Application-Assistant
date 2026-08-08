"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Trash2 } from "lucide-react";
import { theme, serifFont, sansFont } from "@/lib/theme";
import type { OpportunitySummary } from "@/types";

interface ArchiveProps {
  items: OpportunitySummary[];
  loading: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

type SortKey = "role" | "company" | "applicant" | "createdAt" | "updatedAt" | "stage";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "role", label: "Role" },
  { key: "company", label: "Company" },
  { key: "applicant", label: "Applicant" },
  { key: "createdAt", label: "Date Created" },
  { key: "updatedAt", label: "Last Updated" },
  { key: "stage", label: "Stage" },
];

// Date columns read most-useful newest-first on first click; text columns
// read most-useful A-Z on first click.
function defaultDirFor(key: SortKey): SortDir {
  return key === "createdAt" || key === "updatedAt" ? "desc" : "asc";
}

function updatedAt(item: OpportunitySummary): string {
  return item.latestPrepAt ?? item.createdAt;
}

function stageDisplay(item: OpportunitySummary): string {
  if (!item.latestStageLabel) return "—";
  return item.stageCount > 1 ? `${item.latestStageLabel} (${item.stageCount})` : item.latestStageLabel;
}

function compareByKey(a: OpportunitySummary, b: OpportunitySummary, key: SortKey): number {
  switch (key) {
    case "role":
      return a.role.localeCompare(b.role, undefined, { sensitivity: "base" });
    case "company":
      return a.company.localeCompare(b.company, undefined, { sensitivity: "base" });
    case "applicant":
      return a.applicantName.localeCompare(b.applicantName, undefined, { sensitivity: "base" });
    case "createdAt":
      return a.createdAt.localeCompare(b.createdAt);
    case "updatedAt":
      return updatedAt(a).localeCompare(updatedAt(b));
    case "stage":
      return stageDisplay(a).localeCompare(stageDisplay(b), undefined, { sensitivity: "base" });
  }
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
const cellClass = "px-2.5 py-2.5 text-sm whitespace-nowrap";
// Free-text fields (role/company) are user-entered and unbounded — cap
// and truncate with a tooltip so one long value can't blow out the whole
// table. Everything else (dates, the fixed stage label) is naturally
// short, so it's left to size to its own content.
const freeTextCellClass = cellClass + " max-w-[16rem] truncate";

export function Archive({ items, loading, onOpen, onDelete }: ArchiveProps) {
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

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(defaultDirFor(key));
    }
  };

  const handleDelete = (e: React.MouseEvent, item: OpportunitySummary) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${item.role} – ${item.company}" and its prep doc(s)? This can't be undone.`)) {
      onDelete(item.id);
    }
  };

  return (
    <>
      {/* Below `sm`, a 5-column table plus a delete icon doesn't have room
          to breathe even with compact formatting — headers collide instead
          of just feeling tight. Swap to a card list there instead of
          fighting the table into an unreadable state (sort still applies;
          there's just no header row to click on the narrow layout). */}
      <div className="sm:hidden flex flex-col gap-2">
        {sorted.map((item) => (
          <div
            key={item.id}
            onClick={() => onOpen(item.id)}
            className="flex items-center justify-between gap-2 px-3.5 py-3 border cursor-pointer"
            style={{ borderColor: theme.rule, background: theme.panel }}
          >
            <div className="min-w-0">
              <div style={{ fontFamily: serifFont }} className="text-base truncate">
                {item.role} – {item.company}
              </div>
              <div className="text-[11px] mt-0.5 truncate" style={{ color: theme.paperMuted, fontFamily: sansFont }}>
                {item.applicantName} · {formatTimestamp(item.createdAt)} · {stageDisplay(item)}
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(e, item)}
              className="cursor-pointer shrink-0"
              style={{ color: theme.paperMuted }}
              aria-label={`Delete ${item.role} – ${item.company}`}
              title="Delete opportunity"
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
              <th className="px-2.5 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr
                key={item.id}
                onClick={() => onOpen(item.id)}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderBottom: `1px solid ${theme.rule}` }}
              >
                <td className={freeTextCellClass} style={{ color: theme.paper }} title={item.role}>
                  {item.role}
                </td>
                <td className={freeTextCellClass} style={{ color: theme.paper }} title={item.company}>
                  {item.company}
                </td>
                <td className={freeTextCellClass} style={{ color: theme.paper }} title={item.applicantName}>
                  {item.applicantName}
                </td>
                <td className={cellClass + " text-xs"} style={{ color: theme.paperMuted }}>
                  {formatTimestamp(item.createdAt)}
                </td>
                <td className={cellClass + " text-xs"} style={{ color: theme.paperMuted }}>
                  {formatTimestamp(updatedAt(item))}
                </td>
                <td className={cellClass + " text-xs"} style={{ color: theme.paperMuted }}>
                  {stageDisplay(item)}
                </td>
                <td className="px-2.5 py-2.5">
                  <button
                    onClick={(e) => handleDelete(e, item)}
                    className="cursor-pointer block"
                    style={{ color: theme.paperMuted }}
                    aria-label={`Delete ${item.role} – ${item.company}`}
                    title="Delete opportunity"
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
