"use client";
// components/public/LiveSession.tsx
// Subscribes to Firestore in real time using the client SDK.
// Updates instantly whenever admin changes live match or enters a score.

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Hourglass, Trophy } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { groupByRound, seedKnockout } from "@/lib/format";
import type { ActiveTournament, Fixture } from "@/types/tournament";

interface LiveSessionProps {
  initial: ActiveTournament | null;
}

export default function LiveSession({ initial }: LiveSessionProps) {
  const [tournament, setTournament] = useState<ActiveTournament | null>(
    initial,
  );

  // Subscribe to Firestore real-time updates
  useEffect(() => {
    const ref = doc(getDb(), "tournaments", "active");
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
      <div className="flex items-center justify-center min-h-[60vh] text-[#3a5568] text-sm">
        No active tournament right now.
      </div>
    );
  }

  if (tournament.status === "registration" || tournament.status === "drawn") {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <Hourglass className="h-8 w-8 mx-auto mb-3 text-[#8aaabb]" aria-hidden="true" />
        <h2 className="text-xl font-bold text-[#ddeeff] mb-2">
          {tournament.name}
        </h2>
        <p className="text-[#8aaabb]">
          Matches haven't started yet. Check back soon!
        </p>
      </div>
    );
  }

  const colorMap: Record<string, string> = {};
  tournament.groups.forEach((g) => {
    colorMap[`Team ${g.label}`] = g.color;
  });

  const liveMatch =
    [...tournament.fixtures, ...tournament.knockout].find(
      (f) => f.id === tournament.liveMatchId,
    ) ?? null;

  const completedGroupFx = tournament.fixtures.filter((f) => f.played);
  const upcomingGroupFx = tournament.fixtures.filter(
    (f) => !f.played && f.id !== tournament.liveMatchId,
  );
  const seededKo = tournament.knockout.length
    ? seedKnockout(
        tournament.knockout,
        tournament.groups,
        tournament.fixtures,
        tournament.teams,
      )
    : [];
  const completedKo = seededKo.filter((f) => f.played);
  const upcomingKo = seededKo.filter(
    (f) => !f.played && f.id !== tournament.liveMatchId,
  );

  const rounds = groupByRound(upcomingGroupFx);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
      {/* ── NOW PLAYING ── */}
      {liveMatch ? (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-red-400">
              Now Playing
            </h2>
          </div>
          <LiveMatchCard
            match={liveMatch}
            colorMap={colorMap}
            liveHg={tournament.liveHg ?? 0} // ← add these
            liveAg={tournament.liveAg ?? 0}
          />
        </section>
      ) : (
        <section>
          <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-6 text-center">
            <p className="text-[#3a5568] text-sm">
              No match currently in progress.
            </p>
          </div>
        </section>
      )}

      {/* ── COMPLETED MATCHES ── */}
      {(completedGroupFx.length > 0 || completedKo.length > 0) && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#8aaabb] mb-4 inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            Completed — {completedGroupFx.length + completedKo.length}{" "}
            matches
          </h2>
          <div className="space-y-2">
            {/* Group stage completed */}
            {groupByRound(completedGroupFx).map((r) => (
              <div key={r.round}>
                <p className="text-[10px] uppercase tracking-widest text-[#3a5568] font-bold mb-1.5 mt-3">
                  Round {r.round}
                </p>
                {r.fixtures.map((f) => (
                  <ResultCard key={f.id} match={f} colorMap={colorMap} />
                ))}
              </div>
            ))}
            {/* Knockout completed */}
            {completedKo.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#3a5568] font-bold mb-1.5 mt-3">
                  Knockout
                </p>
                {completedKo.map((f) => (
                  <ResultCard key={f.id} match={f} colorMap={colorMap} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── UPCOMING MATCHES ── */}
      {(rounds.length > 0 || upcomingKo.length > 0) && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#8aaabb] mb-4 inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Upcoming
          </h2>
          <div className="space-y-2">
            {rounds.map((r) => (
              <div key={r.round}>
                <p className="text-[10px] uppercase tracking-widest text-[#3a5568] font-bold mb-1.5 mt-3">
                  Round {r.round}
                </p>
                {r.fixtures.map((f) => (
                  <UpcomingCard key={f.id} match={f} colorMap={colorMap} />
                ))}
              </div>
            ))}
            {upcomingKo.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#3a5568] font-bold mb-1.5 mt-3">
                  Knockout
                </p>
                {upcomingKo.map((f) => (
                  <UpcomingCard key={f.id} match={f} colorMap={colorMap} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── ALL DONE ── */}
      {tournament.status === "completed" && (
        <section className="text-center py-10">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-[#ffc53d]" aria-hidden="true" />
          <h2
            className="text-2xl font-black text-[#ffc53d] tracking-widest uppercase mb-1"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Tournament Complete!
          </h2>
          <p className="text-[#8aaabb] text-sm">
            {tournament.name} · {tournament.month}
          </p>
        </section>
      )}
    </div>
  );
}

// ── SUB-COMPONENTS ────────────────────────────────────────

function LiveMatchCard({
  match,
  colorMap,
  liveHg,
  liveAg,
}: {
  match: Fixture;
  colorMap: Record<string, string>;
  liveHg: number;
  liveAg: number;
}) {
  const hColor = colorMap[match.home] ?? "#8aaabb";
  const aColor = colorMap[match.away] ?? "#8aaabb";
  const stageLabel = getStageLabel(match);

  return (
    <div className="relative bg-[#131d28] border-2 border-red-500/50 rounded-2xl p-6 overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(239,68,68,0.06),transparent)] pointer-events-none" />

      <p className="text-[10px] uppercase tracking-widest text-[#8aaabb] font-bold mb-4 text-center">
        {stageLabel}
      </p>

      <div className="flex items-center justify-between gap-4">
        {/* Home */}
        <div className="flex-1 text-center">
          <div
            className="w-12 h-12 md:w-24 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-black"
            style={{ background: `${hColor}22`, border: `2px solid ${hColor}` }}
          >
            <span style={{ color: hColor }}>{match.home.replace("Team ", "")}</span>
          </div>
          <p className="font-bold text-sm" style={{ color: hColor }}>{match.home}</p>
        </div>

        {/* Score */}
        <div className="text-center shrink-0 px-4">
          <div className="text-4xl font-black text-white tracking-tight">
            {liveHg} : {liveAg}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-red-400 mt-1 animate-pulse">
            Live
          </p>
        </div>

        {/* Away */}
        <div className="flex-1 text-center">
          <div
            className="w-12 md:w-24 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-black"
            style={{ background: `${aColor}22`, border: `2px solid ${aColor}` }}
          >
            <span style={{ color: aColor }}>{match.away.replace("Team ", "")}</span>
          </div>
          <p className="font-bold text-sm" style={{ color: aColor }}>{match.away}</p>
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  match,
  colorMap,
}: {
  match: Fixture;
  colorMap: Record<string, string>;
}) {
  const hColor = colorMap[match.home] ?? "#8aaabb";
  const aColor = colorMap[match.away] ?? "#8aaabb";
  const hg = Number(match.hg);
  const ag = Number(match.ag);
  const hWon = hg > ag;
  const aWon = ag > hg;

  return (
    <div className="flex items-center gap-3 bg-[#0f1822] border border-[#1e2e40] rounded-xl px-4 py-3 mb-1.5">
      <span
        className={`flex-1 text-sm font-bold truncate ${hWon ? "" : "opacity-50"}`}
        style={{ color: hColor }}
      >
        {match.home}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-lg font-black ${hWon ? "text-white" : "text-[#8aaabb]"}`}
        >
          {hg}
        </span>
        <span className="text-[#3a5568] font-bold">—</span>
        <span
          className={`text-lg font-black ${aWon ? "text-white" : "text-[#8aaabb]"}`}
        >
          {ag}
        </span>
      </div>
      <span
        className={`flex-1 text-sm font-bold truncate text-right ${aWon ? "" : "opacity-50"}`}
        style={{ color: aColor }}
      >
        {match.away}
      </span>
    </div>
  );
}

function UpcomingCard({
  match,
  colorMap,
}: {
  match: Fixture;
  colorMap: Record<string, string>;
}) {
  const hColor = colorMap[match.home] ?? "#8aaabb";
  const aColor = colorMap[match.away] ?? "#8aaabb";

  return (
    <div className="flex items-center gap-3 bg-[#0d1520] border border-[#1e2e40] border-dashed rounded-xl px-4 py-3 mb-1.5 opacity-70">
      <span
        className="flex-1 text-sm font-semibold truncate"
        style={{ color: hColor }}
      >
        {match.home}
      </span>
      <span className="text-[#3a5568] text-xs font-bold shrink-0">vs</span>
      <span
        className="flex-1 text-sm font-semibold truncate text-right"
        style={{ color: aColor }}
      >
        {match.away}
      </span>
    </div>
  );
}

function getStageLabel(f: Fixture): string {
  if (f.stage === "group") return `Group Stage · Round ${f.round}`;
  if (f.stage === "semi") return "Semi-Final";
  if (f.stage === "third") return "3rd Place Play-off";
  if (f.stage === "final") return "Final";
  return "";
}
