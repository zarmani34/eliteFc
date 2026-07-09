"use client";
// components/public/LiveSession.tsx
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { groupByRound, seedKnockout } from "@/lib/format";
import type { ActiveTournament, Fixture, LiveScore } from "@/types/tournament";

interface LiveSessionProps {
  initial: ActiveTournament | null;
}

function safeActiveTournament(data: Record<string, unknown>, id: string): ActiveTournament {
  return {
    id,
    name: "",
    month: "",
    teams: 6,
    ppt: 8,
    status: "registration",
    registrationOpen: true,
    players: [],
    teamNames: [],
    groups: [],
    fixtures: [],
    knockout: [],
    liveMatchId: null,
    liveScore: null,
    createdAt: "",
    updatedAt: "",
    ...data,
  } as ActiveTournament;
}

export default function LiveSession({ initial }: LiveSessionProps) {
  const [tournament, setTournament] = useState<ActiveTournament | null>(initial);

  useEffect(() => {
    const ref = doc(getDb(), "tournaments", "active");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setTournament(safeActiveTournament(snap.data() as Record<string, unknown>, snap.id));
      } else {
        setTournament(null);
      }
    });
    return () => unsub();
  }, []);

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[#3a5568] text-sm px-4">
        No active tournament right now.
      </div>
    );
  }

  if (tournament.status === "registration" || tournament.status === "drawn") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">⏳</p>
        <h2 className="text-xl font-bold text-[#ddeeff] mb-2">{tournament.name}</h2>
        <p className="text-[#8aaabb] text-sm">Matches haven't started yet. Check back soon!</p>
      </div>
    );
  }

  const colorMap: Record<string, string> = {};
  tournament.groups.forEach((g) => { colorMap[g.label] = g.color; });

  const allFixtures = [...tournament.fixtures, ...tournament.knockout];
  const liveMatch = allFixtures.find((f) => f.id === tournament.liveMatchId) ?? null;

  const completedGroupFx = tournament.fixtures.filter((f) => f.played);
  const upcomingGroupFx  = tournament.fixtures.filter(
    (f) => !f.played && f.id !== tournament.liveMatchId
  );
  const seededKo    = tournament.knockout.length
    ? seedKnockout(tournament.knockout, tournament.groups, tournament.fixtures, tournament.teams)
    : [];
  const completedKo = seededKo.filter((f) => f.played);
  const upcomingKo  = seededKo.filter(
    (f) => !f.played && f.id !== tournament.liveMatchId
  );
  const rounds = groupByRound(upcomingGroupFx);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

      {/* ── NOW PLAYING ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <h2 className="text-xs font-bold uppercase tracking-widest text-red-400">Now Playing</h2>
        </div>
        {liveMatch ? (
          <LiveMatchCard match={liveMatch} liveScore={tournament.liveScore} colorMap={colorMap} />
        ) : (
          <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-6 text-center">
            <p className="text-[#3a5568] text-sm">No match currently in progress.</p>
          </div>
        )}
      </section>

      {/* ── COMPLETED ── */}
      {(completedGroupFx.length > 0 || completedKo.length > 0) && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#8aaabb] mb-3">
            ✅ Completed — {completedGroupFx.length + completedKo.length}
          </h2>
          <div className="space-y-1.5">
            {groupByRound(completedGroupFx).map((r) => (
              <div key={r.round}>
                <p className="text-[10px] uppercase tracking-widest text-[#3a5568] font-bold mb-1.5 mt-3">
                  Round {r.round}
                </p>
                {r.fixtures.map((f) => <ResultCard key={f.id} match={f} colorMap={colorMap} />)}
              </div>
            ))}
            {completedKo.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#3a5568] font-bold mb-1.5 mt-3">
                  Knockout
                </p>
                {completedKo.map((f) => <ResultCard key={f.id} match={f} colorMap={colorMap} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── UPCOMING ── */}
      {(rounds.length > 0 || upcomingKo.length > 0) && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#8aaabb] mb-3">
            🕐 Upcoming
          </h2>
          <div className="space-y-1.5">
            {rounds.map((r) => (
              <div key={r.round}>
                <p className="text-[10px] uppercase tracking-widest text-[#3a5568] font-bold mb-1.5 mt-3">
                  Round {r.round}
                </p>
                {r.fixtures.map((f) => <UpcomingCard key={f.id} match={f} colorMap={colorMap} />)}
              </div>
            ))}
            {upcomingKo.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#3a5568] font-bold mb-1.5 mt-3">
                  Knockout
                </p>
                {upcomingKo.map((f) => <UpcomingCard key={f.id} match={f} colorMap={colorMap} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── COMPLETED ── */}
      {tournament.status === "completed" && (
        <section className="text-center py-10">
          <p className="text-5xl mb-4">🏆</p>
          <h2 className="text-2xl font-black text-[#ffc53d] tracking-widest uppercase mb-1"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            Tournament Complete!
          </h2>
          <p className="text-[#8aaabb] text-sm">{tournament.name} · {tournament.month}</p>
        </section>
      )}
    </div>
  );
}

// ── LIVE MATCH CARD ───────────────────────────────────────

function LiveMatchCard({ match, liveScore, colorMap }: {
  match: Fixture;
  liveScore: LiveScore | null;
  colorMap: Record<string, string>;
}) {
  const hColor    = colorMap[match.home] ?? "#8aaabb";
  const aColor    = colorMap[match.away] ?? "#8aaabb";
  const hg        = liveScore?.hg ?? 0;
  const ag        = liveScore?.ag ?? 0;
  const isPens    = liveScore?.isPenalties ?? false;
  const pensHome  = liveScore?.penalties?.home ?? 0;
  const pensAway  = liveScore?.penalties?.away ?? 0;

  return (
    <div className="relative bg-[#131d28] border-2 border-red-500/50 rounded-2xl p-5 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(239,68,68,0.06),transparent)] pointer-events-none" />

      <p className="text-[10px] uppercase tracking-widest text-[#8aaabb] font-bold mb-4 text-center">
        {getStageLabel(match)}
      </p>

      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <div className="flex-1 text-center min-w-0">
          <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-base font-black"
            style={{ background: `${hColor}22`, border: `2px solid ${hColor}` }}>
            <span style={{ color: hColor }}>{match.home.slice(0, 3).toUpperCase()}</span>
          </div>
          <p className="font-bold text-xs truncate px-1" style={{ color: hColor }}>{match.home}</p>
        </div>

        {/* Score */}
        <div className="text-center shrink-0 px-2">
          <div className="text-4xl font-black text-white tracking-tight tabular-nums">
            {hg}<span className="text-[#3a5568] mx-1 text-2xl">:</span>{ag}
          </div>
          {isPens && (
            <p className="text-[10px] text-[#ffc53d] font-bold mt-1">
              Pens: {pensHome} – {pensAway}
            </p>
          )}
          <p className="text-[10px] uppercase tracking-widest text-red-400 mt-1 font-bold">
            {isPens ? "Penalties" : "In Progress"}
          </p>
        </div>

        {/* Away */}
        <div className="flex-1 text-center min-w-0">
          <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-base font-black"
            style={{ background: `${aColor}22`, border: `2px solid ${aColor}` }}>
            <span style={{ color: aColor }}>{match.away.slice(0, 3).toUpperCase()}</span>
          </div>
          <p className="font-bold text-xs truncate px-1" style={{ color: aColor }}>{match.away}</p>
        </div>
      </div>
    </div>
  );
}

// ── RESULT CARD ───────────────────────────────────────────

function ResultCard({ match, colorMap }: { match: Fixture; colorMap: Record<string, string> }) {
  const hColor = colorMap[match.home] ?? "#8aaabb";
  const aColor = colorMap[match.away] ?? "#8aaabb";
  const hg     = Number(match.hg);
  const ag     = Number(match.ag);
  const hasPens = match.penalties != null;

  // Winner is determined by penalties if scores level
  const hWon = hasPens
    ? (match.penalties!.home > match.penalties!.away)
    : hg > ag;
  const aWon = hasPens
    ? (match.penalties!.away > match.penalties!.home)
    : ag > hg;

  return (
    <div className="flex items-center gap-2 bg-[#0f1822] border border-[#1e2e40] rounded-xl px-3 py-2.5">
      <span className={`flex-1 text-xs font-bold truncate ${!hWon ? "opacity-50" : ""}`}
        style={{ color: hColor }}>
        {match.home}
      </span>
      <div className="flex flex-col items-center shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-base font-black ${hWon ? "text-white" : "text-[#8aaabb]"}`}>{hg}</span>
          <span className="text-[#3a5568] font-bold text-sm">—</span>
          <span className={`text-base font-black ${aWon ? "text-white" : "text-[#8aaabb]"}`}>{ag}</span>
        </div>
        {hasPens && (
          <span className="text-[9px] text-[#ffc53d] font-bold">
            ({match.penalties!.home} – {match.penalties!.away}) pens
          </span>
        )}
      </div>
      <span className={`flex-1 text-xs font-bold truncate text-right ${!aWon ? "opacity-50" : ""}`}
        style={{ color: aColor }}>
        {match.away}
      </span>
    </div>
  );
}

// ── UPCOMING CARD ─────────────────────────────────────────

function UpcomingCard({ match, colorMap }: { match: Fixture; colorMap: Record<string, string> }) {
  const hColor = colorMap[match.home] ?? "#8aaabb";
  const aColor = colorMap[match.away] ?? "#8aaabb";
  return (
    <div className="flex items-center gap-2 bg-[#0d1520] border border-[#1e2e40] border-dashed rounded-xl px-3 py-2.5 opacity-60">
      <span className="flex-1 text-xs font-semibold truncate" style={{ color: hColor }}>{match.home}</span>
      <span className="text-[#3a5568] text-[10px] font-bold shrink-0">vs</span>
      <span className="flex-1 text-xs font-semibold truncate text-right" style={{ color: aColor }}>{match.away}</span>
    </div>
  );
}

function getStageLabel(f: Fixture): string {
  if (f.stage === "group") return `Group Stage · Round ${f.round}`;
  if (f.stage === "semi")  return "Semi-Final";
  if (f.stage === "third") return "3rd Place Play-off";
  if (f.stage === "final") return "🏆 Final";
  return "";
}