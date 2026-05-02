"use client";
// components/gala/FixturesPage.tsx
import { useTournament } from "@/context/TournamentContext";
import FixtureRow from "./FixtureRow";
import StandingsTable from "./StandingsTable";
import KnockoutBracket from "./KnockoutBracket";
import type { TeamColorMap } from "@/types/gala";

interface FixturesPageProps {
  onOpenAwardModal: () => void;
}

export default function FixturesPage({ onOpenAwardModal }: FixturesPageProps) {
  const { state, generateFixtures, resetScores } = useTournament();
  const { fixtures, knockout, groups, cfg } = state;

  const totalPlayers = groups.flatMap((g) => g.slots.filter(Boolean)).length;
  const needed       = cfg.teams * cfg.ppt;
  const isReady      = totalPlayers >= needed;

  // Build label → color map once for all child components
  const teamColorMap: TeamColorMap = {};
  groups.forEach((g) => {
    teamColorMap[`Team ${g.label}`] = g.color;
  });

  // Group fixtures by their fixture-group letter (X, Y, …)
  const byGroup: Record<string, typeof fixtures> = {};
  fixtures.forEach((f) => {
    if (!byGroup[f.group]) byGroup[f.group] = [];
    byGroup[f.group].push(f);
  });

  return (
    <div className="flex-1 overflow-y-auto p-5">

      {/* Page heading */}
      <div className="flex items-center justify-between mb-5">
        <h1
          className="text-[#c6f135] font-bold tracking-widest text-lg uppercase"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Fixtures{cfg.month ? ` — ${cfg.month}` : ""}
        </h1>
      </div>

      {/* Action bar */}
      <div className="bg-[#131d28] border border-[#1e2e40] rounded-xl p-4 mb-5">
        {!isReady ? (
          <p className="text-[#ffc53d] text-sm">
            ⚠ Complete setup ({needed - totalPlayers} more players needed) before generating fixtures.
          </p>
        ) : fixtures.length > 0 ? (
          <p className="text-[#4ade80] text-sm">
            ✅ {fixtures.length} group matches generated. Enter scores as games are played.
          </p>
        ) : (
          <p className="text-[#8aaabb] text-sm">
            Ready! Click Generate Fixtures to schedule all matches.
          </p>
        )}

        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={generateFixtures}
            disabled={!isReady}
            className="bg-[#c6f135] text-[#060a02] font-bold text-sm px-5 py-2 rounded-lg hover:bg-[#d8ff40] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ⚡ Generate Fixtures
          </button>
          <button
            onClick={resetScores}
            className="bg-transparent border border-[#243650] text-[#8aaabb] font-semibold text-sm px-5 py-2 rounded-lg hover:border-[#c6f135] hover:text-[#c6f135] transition-colors"
          >
            Reset Scores
          </button>
        </div>
      </div>

      {fixtures.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* Left: matches */}
          <div className="space-y-4">
            <div className="bg-[#131d28] border border-[#1e2e40] rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold mb-3">
                Group Stage
              </p>
              {Object.entries(byGroup).map(([grp, matches]) => (
                <div key={grp} className="mb-4 last:mb-0">
                  <p className="text-[11px] text-[#8aaabb] font-semibold mb-1.5">
                    Fixture Group {grp}
                  </p>
                  {matches.map((f) => (
                    <FixtureRow key={f.id} fixture={f} teamColorMap={teamColorMap} />
                  ))}
                </div>
              ))}
            </div>

            {knockout.length > 0 && (
              <div className="bg-[#131d28] border border-[#1e2e40] rounded-xl p-4">
                <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold mb-3">
                  Knockout Stage
                </p>
                <KnockoutBracket teamColorMap={teamColorMap} />
              </div>
            )}
          </div>

          {/* Right: standings + save */}
          <div className="space-y-4">
            <div className="bg-[#131d28] border border-[#1e2e40] rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold mb-3">
                Group Standings
              </p>
              <StandingsTable />
            </div>

            <button
              onClick={onOpenAwardModal}
              className="w-full bg-[#ffc53d] text-[#0a0600] font-bold text-sm py-3 rounded-xl hover:bg-[#ffd060] transition-colors"
            >
              🏆 Save Month Results
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
