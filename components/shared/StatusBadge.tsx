"use client";
// components/shared/StatusBadge.tsx
import { CircleDot, Dices, Goal, Trophy, type LucideIcon } from "lucide-react";
import type { TournamentStatus } from "@/types/tournament";

const CONFIG: Record<TournamentStatus, { label: string; classes: string; icon: LucideIcon }> = {
  registration: { label: "Registration Open", classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CircleDot },
  drawn: { label: "Draw Complete", classes: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: Dices },
  ongoing: { label: "Matches Ongoing", classes: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Goal },
  completed: { label: "Completed", classes: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: Trophy },
};

export default function StatusBadge({ status }: { status: TournamentStatus }) {
  const { label, classes, icon: Icon } = CONFIG[status];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${classes}`}>
      <Icon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
