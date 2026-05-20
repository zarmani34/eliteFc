"use client";
// components/admin/DrawClient.tsx
import { useState } from "react";
import { BadgeCheck, Dices, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import GroupCard from "@/components/shared/GroupCard";
import StatusBadge from "@/components/shared/StatusBadge";
import type { ActiveTournament } from "@/types/tournament";

export default function DrawClient({ tournament }: { tournament: ActiveTournament }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const needed  = tournament.teams * tournament.ppt;
  const canDraw = tournament.players.length >= needed && tournament.status === "registration";
  const drawn   = tournament.status === "drawn" || tournament.status === "ongoing" || tournament.status === "completed";

  async function handleDraw() {
    if (!confirm("Run the draw? This will randomly assign all players to teams. This cannot be undone.")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tournament/draw", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Draw failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Status card */}
      <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-bold text-[#ddeeff]">{tournament.name}</p>
          <p className="text-[#8aaabb] text-sm mt-0.5">
            {tournament.players.length} players · {tournament.teams} teams · {tournament.ppt} per team
          </p>
        </div>
        <StatusBadge status={tournament.status} />
      </div>

      {/* Draw action */}
      {!drawn && (
        <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-5">
          {!canDraw ? (
            <p className="text-[#ffc53d] text-sm flex items-center gap-2 flex-wrap">
              <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Need {needed} players. Currently {tournament.players.length} registered.</span>
              <a href="/admin/setup" className="underline ml-2 hover:text-[#c6f135]">Go to Setup →</a>
            </p>
          ) : (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-emerald-400 text-sm font-semibold inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Ready to draw! {tournament.players.length} players will be randomly split into {tournament.teams} teams.</span>
              </p>
              <button
                onClick={handleDraw}
                disabled={loading}
                className="bg-[#c6f135] text-[#060a02] font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#d8ff40] transition-colors disabled:opacity-50 shrink-0"
              >
                {loading ? "Drawing..." : (
                  <span className="inline-flex items-center gap-2">
                    <Dices className="h-4 w-4" aria-hidden="true" />
                    Run Draw
                  </span>
                )}
              </button>
            </div>
          )}
          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
        </div>
      )}

      {/* Show groups after draw */}
      {drawn && tournament.groups.length > 0 && (
        <>
          <div className="bg-[#0a1e10] border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-emerald-400 text-sm font-semibold inline-flex items-center gap-2">
              <Dices className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Draw complete! Teams have been assigned.</span>
            </p>
            <a
              href="/admin/fixtures"
              className="bg-[#c6f135] text-[#060a02] font-bold text-sm px-6 py-2 rounded-lg hover:bg-[#d8ff40] transition-colors"
            >
              Go to Fixtures →
            </a>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {tournament.groups.map((g) => (
              <GroupCard key={g.label} group={g} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
