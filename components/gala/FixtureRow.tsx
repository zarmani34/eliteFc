"use client";
// components/gala/FixtureRow.tsx
import { useState, useEffect } from "react";
import { useTournament } from "@/context/TournamentContext";
import type { Fixture, TeamColorMap } from "@/types/gala";

interface FixtureRowProps {
  fixture: Fixture;
  teamColorMap: TeamColorMap;
}

export default function FixtureRow({ fixture, teamColorMap }: FixtureRowProps) {
  const { saveScore } = useTournament();
  const [hg, setHg] = useState<string | number>(fixture.hg ?? "");
  const [ag, setAg] = useState<string | number>(fixture.ag ?? "");

  // Sync local state if scores are reset externally
  useEffect(() => {
    setHg(fixture.hg ?? "");
    setAg(fixture.ag ?? "");
  }, [fixture.hg, fixture.ag, fixture.played]);

  function handleSave(): void {
    if (hg !== "" && ag !== "") {
      saveScore(fixture.id, hg, ag);
    }
  }

  const hColor = teamColorMap[fixture.home] ?? "#8aaabb";
  const aColor = teamColorMap[fixture.away] ?? "#8aaabb";

  return (
    <div className="flex items-center gap-3 bg-[#172030] border border-[#1e2e40] rounded-lg px-3 py-2.5 mb-1.5">

      {/* Teams */}
      <div className="flex-1 flex items-center gap-1.5 text-sm font-semibold flex-wrap">
        <span style={{ color: hColor }}>{fixture.home}</span>
        <span className="text-[#3a5568] text-xs font-normal mx-1">vs</span>
        <span style={{ color: aColor }}>{fixture.away}</span>
      </div>

      {/* Score inputs */}
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          value={hg}
          min={0}
          onChange={(e) => setHg(e.target.value)}
          onBlur={handleSave}
          className="w-11 text-center bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-md py-1 text-sm outline-none focus:border-[#c6f135] transition-colors"
        />
        <span className="text-[#8aaabb] font-bold text-sm">:</span>
        <input
          type="number"
          value={ag}
          min={0}
          onChange={(e) => setAg(e.target.value)}
          onBlur={handleSave}
          className="w-11 text-center bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-md py-1 text-sm outline-none focus:border-[#c6f135] transition-colors"
        />
      </div>

      {/* Played indicator */}
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: fixture.played ? "#c6f135" : "#1e2e40" }}
      />
    </div>
  );
}
