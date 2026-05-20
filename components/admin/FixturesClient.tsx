"use client";
// components/admin/FixturesClient.tsx
import { useState } from "react";
import { BadgeCheck, Trophy, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import StandingsTable from "@/components/shared/StandingsTable";
import LiveMatchControl from "@/components/admin/LiveMatchControl";
import {
  seedKnockout,
  calcStandings,
  getFormat,
  groupByRound,
} from "@/lib/format";
import type { ActiveTournament, Award } from "@/types/tournament";
import { getActiveTournament } from "@/lib/tournament";

export default function FixturesClient({
  tournament: initialTournament,
}: {
  tournament: ActiveTournament;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [awardOpen, setAwardOpen] = useState(false);
  const [tournament, setTournament] =
    useState<ActiveTournament>(initialTournament);

  const canGenerate = tournament.status === "drawn";
  const hasFixtures = tournament.fixtures.length > 0;

  async function refetch() {
    const updated = await getActiveTournament();
    if (updated) setTournament(updated);
  }

  const colorMap: Record<string, string> = {};
  tournament.groups.forEach((g) => {
    colorMap[`Team ${g.label}`] = g.color;
  });

  async function generateFixtures() {
    setGenerating(true);
    try {
      const res = await fetch("/api/tournament/scores", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setGenerating(false);
    }
  }

  const seededKo = hasFixtures
    ? seedKnockout(
        tournament.knockout,
        tournament.groups,
        tournament.fixtures,
        tournament.teams,
      )
    : tournament.knockout;

  const rounds = groupByRound(tournament.fixtures);

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
        {!canGenerate && !hasFixtures && (
          <p className="text-[#ffc53d] text-sm">Complete the draw first.</p>
        )}
        {canGenerate && (
          <>
            <p className="text-[#8aaabb] text-sm">
              Draw is complete. Generate round-by-round fixtures.
            </p>
            <button
              onClick={generateFixtures}
              disabled={generating}
              className="bg-[#c6f135] text-[#060a02] font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#d8ff40] transition-colors disabled:opacity-50"
            >
              {generating ? "Generating..." : (
                <span className="inline-flex items-center gap-2">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  Generate Fixtures
                </span>
              )}
            </button>
          </>
        )}
        {hasFixtures && (
          <div className="flex items-center justify-between w-full flex-wrap gap-3">
            <p className="text-emerald-400 text-sm inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{tournament.fixtures.length} group matches across {rounds.length} rounds.</span>
            </p>
            <a
              href="/live"
              target="_blank"
              className="text-[#8aaabb] hover:text-[#c6f135] text-xs font-semibold underline underline-offset-2 transition-colors"
            >
              View public live page ↗
            </a>
          </div>
        )}
      </div>

      {hasFixtures && (
        <div className="grid lg:grid-cols-2 gap-5 items-start">
          {/* Left: round-by-round match list + knockout */}
          <div className="space-y-4">
            {/* Group stage by round */}
            <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold">
                  Group Stage
                </p>
                <p className="text-[10px] text-[#3a5568]">
                  Hover a match to set live
                </p>
              </div>

              {rounds.map((r) => (
                <div key={r.round} className="mb-5 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[11px] text-[#8aaabb] font-bold uppercase tracking-wider">
                      Round {r.round}
                    </p>
                    <div className="flex-1 h-px bg-[#1e2e40]" />
                  </div>
                  {r.fixtures.map((f) => (
                    <LiveMatchControl
                      key={f.id}
                      fixture={f}
                      isLive={f.id === tournament.liveMatchId}
                      isKnockout={false}
                      colorMap={colorMap}
                      onRefresh={() => refetch()}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Knockout stage */}
            {seededKo.length > 0 && (
              <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-5">
                <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold mb-4">
                  Knockout Stage
                </p>
                {(["semi", "third", "final"] as const).map((stage) => {
                  const matches = seededKo.filter((f) => f.stage === stage);
                  if (!matches.length) return null;
                  const label =
                    stage === "semi"
                      ? "Semi-Finals"
                      : stage === "third"
                        ? "3rd Place Play-off"
                        : "Final";
                  return (
                    <div key={stage} className="mb-4 last:mb-0">
                      <p
                        className={`text-[11px] font-bold uppercase tracking-wider mb-2 inline-flex items-center gap-1.5 ${
                          stage === "final"
                            ? "text-[#ffc53d]"
                            : "text-[#8aaabb]"
                        }`}
                      >
                        {stage === "final" && <Trophy className="h-3.5 w-3.5" aria-hidden="true" />}
                        {label}
                      </p>
                      {matches.map((f) => (
                        <LiveMatchControl
                          key={f.id}
                          fixture={f}
                          isLive={f.id === tournament.liveMatchId}
                          isKnockout={true}
                          colorMap={colorMap}
                          onRefresh={() => refetch()}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: standings + save button */}
          <div className="space-y-4">
            <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-5">
              <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold mb-4">
                Standings
              </p>
              <StandingsTable
                groups={tournament.groups}
                fixtures={tournament.fixtures}
                teams={tournament.teams}
              />
            </div>
            <button
              onClick={() => setAwardOpen(true)}
              className="w-full bg-[#ffc53d] text-[#0a0600] font-bold text-sm py-3 rounded-xl hover:bg-[#ffd060] transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <Trophy className="h-4 w-4" aria-hidden="true" />
                Complete Month & Save Records
              </span>
            </button>
          </div>
        </div>
      )}

      {awardOpen && (
        <AwardModal
          tournament={tournament}
          onClose={() => setAwardOpen(false)}
          onSaved={() => {
            setAwardOpen(false);
            router.push("/admin/records");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ── Award Modal ───────────────────────────────────────────

const DEFAULT_AWARDS = [
  "Man of the Match",
  "Top Scorer",
  "Best Defender",
  "Best Goalkeeper",
  "Most Improved Player",
];

function AwardModal({
  tournament,
  onClose,
  onSaved,
}: {
  tournament: ActiveTournament;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fin = tournament.knockout.find((f) => f.stage === "final" && f.played);
  const autoChamp = fin
    ? Number(fin.hg) > Number(fin.ag)
      ? fin.home
      : fin.away
    : "";

  const [champion, setChampion] = useState(autoChamp);
  const [awards, setAwards] = useState<Award[]>(
    DEFAULT_AWARDS.map((label) => ({ label, player: "" })),
  );
  const [saving, setSaving] = useState(false);

  function updateAward(i: number, key: keyof Award, val: string) {
    setAwards((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [key]: val } : a)),
    );
  }

  async function handleSave() {
    if (!champion) {
      alert("Please enter the champion name");
      return;
    }
    setSaving(true);
    try {
      const fmt = getFormat(tournament.teams);
      let tIdx = 0;
      const standings = fmt.groups.flatMap((count) => {
        const labels: string[] = [];
        for (let i = 0; i < count; i++) {
          if (tIdx < tournament.groups.length)
            labels.push(tournament.groups[tIdx++].label);
        }
        return calcStandings(labels, tournament.fixtures).slice(0, 3);
      });

      const res = await fetch("/api/tournament/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          champion,
          awards: awards.filter((a) => a.label && a.player),
          standings,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onSaved();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#131d28] border border-[#243650] rounded-2xl p-6 w-full max-w-lg max-h-[88vh] overflow-y-auto">
        <h3
          className="text-[#ffc53d] font-black tracking-widest text-xl uppercase mb-5"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          <span className="inline-flex items-center gap-2">
            <Trophy className="h-5 w-5" aria-hidden="true" />
            Complete Month
          </span>
        </h3>

        <div className="mb-4">
          <label className="block text-[11px] uppercase tracking-wider text-[#8aaabb] mb-1.5 font-semibold">
            Champion
          </label>
          <input
            value={champion}
            onChange={(e) => setChampion(e.target.value)}
            className="w-full bg-[#0a1018] border border-[#243650] text-[#c6f135] font-bold rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#c6f135]"
          />
        </div>

        <p className="text-[11px] uppercase tracking-wider text-[#8aaabb] font-semibold mb-3">
          Awards
        </p>
        <div className="space-y-2 mb-3">
          {awards.map((aw, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
            >
              <input
                value={aw.label}
                onChange={(e) => updateAward(i, "label", e.target.value)}
                placeholder="Award"
                className="bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c6f135]"
              />
              <input
                value={aw.player}
                onChange={(e) => updateAward(i, "player", e.target.value)}
                placeholder="Player"
                className="bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c6f135]"
              />
              <button
                onClick={() =>
                  setAwards((p) => p.filter((_, idx) => idx !== i))
                }
                className="text-red-400 hover:bg-red-500/20 rounded-lg px-2 py-2 text-sm transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setAwards((p) => [...p, { label: "", player: "" }])}
          className="text-[#8aaabb] hover:text-[#c6f135] text-sm border border-[#243650] hover:border-[#c6f135] rounded-lg px-3 py-1.5 transition-colors mb-5"
        >
          + Add Award
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#ffc53d] text-[#0a0600] font-bold text-sm py-2.5 rounded-lg hover:bg-[#ffd060] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save & Complete"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-[#243650] text-[#8aaabb] font-semibold text-sm py-2.5 rounded-lg hover:border-[#c6f135] hover:text-[#c6f135] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
