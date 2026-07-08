"use client";
// components/shared/StandingsTable.tsx
import { calcStandings, getFormat } from "@/lib/format";
import type { Group, Fixture } from "@/types/tournament";

interface StandingsTableProps {
  groups: Group[];
  fixtures: Fixture[];
  teams: number;
}

export default function StandingsTable({ groups, fixtures, teams }: StandingsTableProps) {
  const fmt = getFormat(teams);
  let teamIdx = 0;

  const fixtureGroups = fmt.groups.map((count, fgi) => {
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      if (teamIdx < groups.length) labels.push(groups[teamIdx++].label);
    }
    return { label: String.fromCharCode(88 + fgi), labels };
  });

  return (
    <div className="space-y-6">
      {fixtureGroups.map((fg) => {
        const rows = calcStandings(fg.labels, fixtures);
        return (
          <div key={fg.label}>
            <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold mb-2">
              Group {fg.label}
            </p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0a1018] text-[11px] uppercase tracking-wider text-[#8aaabb]">
                  {["#","Team","P","W","D","L","GD","Pts"].map((h) => (
                    <th key={h} className={`px-2 py-2 ${h === "#" || h === "Team" ? "text-left" : "text-center"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const g = groups.find((g) => g.label === r.label);
                  return (
                    <tr
                      key={r.label}
                      className={`border-b border-[#1e2e40] ${i < 2 ? "bg-[#0a1e10]" : "hover:bg-[#0f1822]"}`}
                    >
                      <td className="px-2 py-2 text-[#3a5568] text-xs">{i + 1}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g?.color ?? "#8aaabb" }} />
                          <span className="font-semibold" style={{ color: g?.color ?? "#8aaabb" }}>{r.label}</span>
                          {i < 2 && (
                            <span className="text-[10px] bg-[#0a3018] text-[#c6f135] font-bold px-1.5 py-0.5 rounded-full">Q</span>
                          )}
                        </div>
                      </td>
                      {[r.P, r.W, r.D, r.L].map((v, vi) => (
                        <td key={vi} className="px-2 py-2 text-center text-[#8aaabb]">{v}</td>
                      ))}
                      <td className="px-2 py-2 text-center text-[#8aaabb]">
                        {r.GF - r.GA >= 0 ? "+" : ""}{r.GF - r.GA}
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-[#ffc53d]">{r.Pts}</td>
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