"use client";

import { Trash2 } from "lucide-react";
import { theme, sansFont } from "@/lib/theme";
import { STAGE_LABEL } from "@/lib/constants";
import type { OpportunitySummary } from "@/types";

interface ArchiveProps {
  items: OpportunitySummary[];
  loading: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

const headerCellClass = "px-3 py-2 text-[10px] uppercase tracking-wide font-medium text-left whitespace-nowrap";
const headerCellStyle = { color: theme.paperMuted, fontFamily: sansFont };
const cellClass = "px-3 py-2.5 text-sm whitespace-nowrap";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function Archive({ items, loading, onOpen, onDelete }: ArchiveProps) {
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

  const handleDelete = (e: React.MouseEvent, item: OpportunitySummary) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${item.role} – ${item.company}" and its prep doc(s)? This can't be undone.`)) {
      onDelete(item.id);
    }
  };

  return (
    <div className="overflow-x-auto border" style={{ borderColor: theme.rule }}>
      <table className="w-full border-collapse" style={{ fontFamily: sansFont }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${theme.rule}` }}>
            <th className={headerCellClass} style={headerCellStyle}>
              Role
            </th>
            <th className={headerCellClass} style={headerCellStyle}>
              Company
            </th>
            <th className={headerCellClass} style={headerCellStyle}>
              Date Created
            </th>
            <th className={headerCellClass} style={headerCellStyle}>
              Last Updated
            </th>
            <th className={headerCellClass} style={headerCellStyle}>
              Stage
            </th>
            <th className="px-3 py-2 w-8" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              onClick={() => onOpen(item.id)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              style={{ borderBottom: `1px solid ${theme.rule}` }}
            >
              <td className={cellClass} style={{ color: theme.paper }}>
                {item.role}
              </td>
              <td className={cellClass} style={{ color: theme.paper }}>
                {item.company}
              </td>
              <td className={cellClass + " text-xs"} style={{ color: theme.paperMuted }}>
                {formatDate(item.createdAt)}
              </td>
              <td className={cellClass + " text-xs"} style={{ color: theme.paperMuted }}>
                {formatDate(item.latestPrepAt ?? item.createdAt)}
              </td>
              <td className={cellClass + " text-xs"} style={{ color: theme.paperMuted }}>
                {STAGE_LABEL}
              </td>
              <td className="px-3 py-2.5">
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
  );
}
