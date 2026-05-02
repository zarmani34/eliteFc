"use client";
// components/gala/StandingsTable.tsx
import { useTournament, getFormat } from "@/context/TournamentContext";
import type { StandingRow } from "@/types/gala";

export default function StandingsTable() {
  const { state, calcStandings } = useTournament();
  const { groups, fixtures, cfg } = state;

  if (!fixtures.length) {
    return (
      <p className="text-[#3a5568] text-sm text-center py-6">
        Generate fixtures first.
      </p>
    );
  }

  const fmt = getFormat(cfg.teams);
  let teamIdx = 0;

  const fixtureGroups = fmt.groups.map((count, fgi) => {
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      if (teamIdx < groups.length) labels.push(groups[teamIdx++].label);
    }
    return { label: String.fromCharCode(88 + fgi), labels };
  });

  return (
    <div className="space-y-5">
      {fixtureGroups.map((fg) => {
        const rows: StandingRow[] = calcStandings(fg.labels, fixtures);

        return (
          <div key={fg.label}>
            <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold mb-2">
              Fixture Group {fg.label}
            </p>

            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0a1018] text-[11px] uppercase tracking-wider text-[#8aaabb]">
                  <th className="text-left px-2 py-2">#</th>
                  <th className="text-left px-2 py-2">Team</th>
                  <th className="px-2 py-2">P</th>
                  <th className="px-2 py-2">W</th>
                  <th className="px-2 py-2">D</th>
                  <th className="px-2 py-2">L</th>
                  <th className="px-2 py-2">GD</th>
                  <th className="px-2 py-2 text-[#ffc53d]">Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const g        = groups.find((g) => g.label === r.label);
                  const qualifies = i < 2;

                  return (
                    <tr
                      key={r.label}
                      className={`border-b border-[#1e2e40] ${
                        qualifies ? "bg-[#0a1e10]" : "hover:bg-[#0f1822]"
                      }`}
                    >
                      <td className="px-2 py-2 text-[#3a5568] text-xs">{i + 1}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: g?.color ?? "#8aaabb" }}
                          />
                          <span className="font-semibold">Team {r.label}</span>
                          {qualifies && (
                            <span className="text-[10px] bg-[#0a3018] text-[#c6f135] font-bold px-1.5 py-0.5 rounded-full">
                              Q
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center text-[#8aaabb]">{r.P}</td>
                      <td className="px-2 py-2 text-center text-[#8aaabb]">{r.W}</td>
                      <td className="px-2 py-2 text-center text-[#8aaabb]">{r.D}</td>
                      <td className="px-2 py-2 text-center text-[#8aaabb]">{r.L}</td>
                      <td className="px-2 py-2 text-center text-[#8aaabb]">
                        {r.GF - r.GA >= 0 ? "+" : ""}
                        {r.GF - r.GA}
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-[#ffc53d]">
                        {r.Pts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
