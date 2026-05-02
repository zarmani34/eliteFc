"use client";
// components/gala/KnockoutBracket.tsx
import { useTournament, getFormat } from "@/context/TournamentContext";
import FixtureRow from "./FixtureRow";
import type { TeamColorMap } from "@/types/gala";

interface KnockoutBracketProps {
  teamColorMap: TeamColorMap;
}

export default function KnockoutBracket({ teamColorMap }: KnockoutBracketProps) {
  const { state } = useTournament();
  const { knockout, cfg } = state;

  if (!knockout.length) {
    return <p className="text-[#3a5568] text-sm text-center py-6">—</p>;
  }

  const fmt    = getFormat(cfg.teams);
  const semis  = knockout.filter((f) => f.stage === "semi");
  const third  = knockout.filter((f) => f.stage === "third");
  const finals = knockout.filter((f) => f.stage === "final");

  if (fmt.ko === "final") {
    return (
      <div>
        <p className="text-[11px] uppercase tracking-widest text-[#ffc53d] font-semibold mb-2">
          🏆 Final
        </p>
        {finals.map((f) => (
          <FixtureRow key={f.id} fixture={f} teamColorMap={teamColorMap} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {semis.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold mb-2">
            Semi-Finals
          </p>
          {semis.map((f) => (
            <FixtureRow key={f.id} fixture={f} teamColorMap={teamColorMap} />
          ))}
        </div>
      )}
      {third.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold mb-2">
            3rd Place Play-off
          </p>
          {third.map((f) => (
            <FixtureRow key={f.id} fixture={f} teamColorMap={teamColorMap} />
          ))}
        </div>
      )}
      {finals.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#ffc53d] font-semibold mb-2">
            🏆 Final
          </p>
          {finals.map((f) => (
            <FixtureRow key={f.id} fixture={f} teamColorMap={teamColorMap} />
          ))}
        </div>
      )}
    </div>
  );
}
