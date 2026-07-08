"use client";
// components/admin/FixturesClient.tsx
// Uses a Firestore real-time listener so the page updates instantly
// without needing router.refresh() — fixes the stale-data problem.

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import StandingsTable from "@/components/shared/StandingsTable";
import LiveMatchControl from "@/components/admin/LiveMatchControl";
import {
  seedKnockout,
  calcStandings,
  getFormat,
  groupByRound,
} from "@/lib/format";
import type { ActiveTournament, Award } from "@/types/tournament";

interface FixturesClientProps {
  // Initial server-fetched data for fast first paint
  initial: ActiveTournament | null;
}

export default function FixturesClient({ initial }: FixturesClientProps) {
  const [tournament, setTournament] = useState<ActiveTournament | null>(initial);
  const [generating, setGenerating] = useState(false);
  const [awardOpen, setAwardOpen]   = useState(false);
  const [error, setError]           = useState("");

  // Subscribe to Firestore — updates instantly when any field changes
  useEffect(() => {
    const ref   = doc(getDb(), "tournaments", "active");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setTournament({ id: snap.id, ...snap.data() } as ActiveTournament);
      } else {
        setTournament(null);
      }
    });
    return () => unsub();
  }, []);

  if (!tournament) {
    return (
      <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-6">
        <p className="text-[#ffc53d] text-sm">
          No active tournament found.{" "}
          <a href="/admin/setup" className="underline hover:text-[#c6f135]">
            Go to Setup →
          </a>
        </p>
      </div>
    );
  }

  const canGenerate = tournament.status === "drawn";
  const hasFixtures = tournament.fixtures.length > 0;

  const colorMap: Record<string, string> = {};
  tournament.groups.forEach((g) => {
    colorMap[g.label] = g.color;
  });

  const seededKo = hasFixtures
    ? seedKnockout(
        tournament.knockout,
        tournament.groups,
        tournament.fixtures,
        tournament.teams
      )
    : tournament.knockout;

  const rounds = groupByRound(tournament.fixtures);

  async function generateFixtures() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/tournament/scores", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      // No router.refresh() needed — Firestore listener picks up the change
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  // Called by LiveMatchControl after any live/score action
  // No-op here since Firestore listener handles updates automatically
  function handleRefresh() {
    // intentionally empty — onSnapshot handles it
  }

  return (
    <div className="space-y-5">

      {/* Top action bar */}
      <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-5">
        {!canGenerate && !hasFixtures && (
          <p className="text-[#ffc53d] text-sm">
            Complete the draw first before generating fixtures.{" "}
            <a href="/admin/draw" className="underline hover:text-[#c6f135]">
              Go to Draw →
            </a>
          </p>
        )}

        {canGenerate && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[#8aaabb] text-sm">
              Draw complete. Generate the round-by-round match schedule.
            </p>
            <button
              onClick={generateFixtures}
              disabled={generating}
              className="bg-[#c6f135] text-[#060a02] font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#d8ff40] transition-colors disabled:opacity-50"
            >
              {generating ? "Generating…" : "⚡ Generate Fixtures"}
            </button>
          </div>
        )}

        {hasFixtures && (
          <div className="flex items-center justify-between w-full flex-wrap gap-3">
            <p className="text-emerald-400 text-sm">
              ✅ {tournament.fixtures.length} group matches across{" "}
              {rounds.length} rounds. Updates are live.
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

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {hasFixtures && (
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-5 items-start">

          {/* ── Left: fixtures by round + knockout ── */}
          <div className="space-y-4">

            {/* Group stage rounds */}
            <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold">
                  Group Stage
                </p>
                <p className="text-[10px] text-[#3a5568]">
                  Hover a match → Set Live
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
                      liveScore={f.id === tournament.liveMatchId ? tournament.liveScore : null}
                      onRefresh={handleRefresh}
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
                      : "🏆 Final";
                  return (
                    <div key={stage} className="mb-4 last:mb-0">
                      <p
                        className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${
                          stage === "final"
                            ? "text-[#ffc53d]"
                            : "text-[#8aaabb]"
                        }`}
                      >
                        {label}
                      </p>
                      {matches.map((f) => (
                        <LiveMatchControl
                          key={f.id}
                          fixture={f}
                          isLive={f.id === tournament.liveMatchId}
                          isKnockout={true}
                          colorMap={colorMap}
                          liveScore={f.id === tournament.liveMatchId ? tournament.liveScore : null}
                          onRefresh={handleRefresh}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right: standings + complete button ── */}
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

            {tournament.status !== "completed" ? (
              <button
                onClick={() => setAwardOpen(true)}
                className="w-full bg-[#ffc53d] text-[#0a0600] font-bold text-sm py-3 rounded-xl hover:bg-[#ffd060] transition-colors"
              >
                🏆 Complete Month &amp; Save Records
              </button>
            ) : (
              <div className="w-full bg-[#0a1e10] border border-emerald-800/40 text-emerald-400 font-semibold text-sm py-3 rounded-xl text-center">
                ✅ Tournament completed and archived
              </div>
            )}
          </div>
        </div>
      )}

      {/* Award modal */}
      {awardOpen && (
        <AwardModal
          tournament={tournament}
          onClose={() => setAwardOpen(false)}
          onSaved={() => setAwardOpen(false)}
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
  const fin       = tournament.knockout.find((f) => f.stage === "final" && f.played);
  const autoChamp = fin
    ? Number(fin.hg) > Number(fin.ag)
      ? fin.home
      : fin.away
    : "";

  const [champion, setChampion] = useState(autoChamp);
  const [awards, setAwards]     = useState<Award[]>(
    DEFAULT_AWARDS.map((label) => ({ label, player: "" }))
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function updateAward(i: number, key: keyof Award, val: string) {
    setAwards((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [key]: val } : a))
    );
  }

  async function handleSave() {
    if (!champion) {
      setSaveError("Please enter the champion name.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const fmt    = getFormat(tournament.teams);
      let tIdx     = 0;
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
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#131d28] border border-[#243650] rounded-2xl p-6 w-full max-w-lg max-h-[88vh] overflow-y-auto">
        <h3
          className="text-[#ffc53d] font-black tracking-widest text-xl uppercase mb-5"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          🏆 Complete Month
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
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
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

        {saveError && (
          <p className="text-red-400 text-xs mb-3">{saveError}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#ffc53d] text-[#0a0600] font-bold text-sm py-2.5 rounded-lg hover:bg-[#ffd060] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save & Complete"}
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