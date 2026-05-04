"use client";
// components/shared/StatusBadge.tsx
import type { TournamentStatus } from "@/types/tournament";

const CONFIG: Record<TournamentStatus, { label: string; classes: string }> = {
  registration: { label: "🟢 Registration Open",  classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  drawn:        { label: "🎲 Draw Complete",        classes: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  ongoing:      { label: "⚽ Matches Ongoing",      classes: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  completed:    { label: "🏆 Completed",            classes: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

export default function StatusBadge({ status }: { status: TournamentStatus }) {
  const { label, classes } = CONFIG[status];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${classes}`}>
      {label}
    </span>
  );
}
