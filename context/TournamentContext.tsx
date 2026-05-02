"use client";
// context/TournamentContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type {
  TournamentState,
  TournamentContextValue,
  TournamentFormat,
  TournamentConfig,
  Group,
  Fixture,
  FixtureStage,
  StandingRow,
} from "@/types/gala";

// ── Constants ──────────────────────────────────────────────
export const GROUP_COLORS: string[] = [
  "#f87171", // red
  "#60a5fa", // blue
  "#4ade80", // green
  "#facc15", // yellow
  "#c084fc", // purple
  "#fb923c", // orange
  "#34d399", // teal
  "#f472b6", // pink
];

export function getFormat(n: number): TournamentFormat {
  const formats: Record<number, TournamentFormat> = {
    5: { groups: [5],   ko: "final", desc: "1 group of 5. Top 2 → Final." },
    6: { groups: [3,3], ko: "semis", desc: "2 groups of 3. Cross-semis + Final + 3rd place." },
    7: { groups: [4,3], ko: "semis", desc: "Groups of 4 & 3. Cross-semis + Final + 3rd place." },
    8: { groups: [4,4], ko: "semis", desc: "2 groups of 4. Semis + Final + 3rd place." },
  };
  return formats[n] ?? formats[6];
}

// ── Helpers ────────────────────────────────────────────────
function defaultState(): TournamentState {
  return {
    cfg: { month: "", teams: 6, ppt: 8 },
    groups: [],
    fixtures: [],
    knockout: [],
  };
}

let _fxId = 0;

function mkFx(
  home: string,
  away: string,
  stage: FixtureStage,
  group: string
): Fixture {
  return { id: _fxId++, home, away, stage, group, hg: "", ag: "", played: false };
}

// ── Context ────────────────────────────────────────────────
const TournamentContext = createContext<TournamentContextValue | null>(null);

interface TournamentProviderProps {
  children: ReactNode;
}

export function TournamentProvider({ children }: TournamentProviderProps) {
  const [state, setState] = useState<TournamentState>(defaultState);

  // Immutable state helper — deep clones before mutating
  const patch = useCallback(
    (fn: (s: TournamentState) => TournamentState) =>
      setState((prev) => fn(structuredClone(prev))),
    []
  );

  // ── Config ──────────────────────────────────────────────
  const setConfig = useCallback(
    (key: keyof TournamentConfig, value: string | number) => {
      patch((s) => { s.cfg[key] = value as never; return s; });
    },
    [patch]
  );

  const applyConfig = useCallback(
    (teams: number, ppt: number) => {
      patch((s) => {
        s.cfg.teams = teams;
        s.cfg.ppt   = ppt;
        const existing = s.groups;

        s.groups = Array.from({ length: teams }, (_, i): Group => {
          const prev  = existing[i];
          const slots = Array<string | null>(ppt).fill(null);
          if (prev) {
            prev.slots.slice(0, ppt).forEach((name, si) => { slots[si] = name; });
          }
          return {
            label: String.fromCharCode(65 + i),
            color: GROUP_COLORS[i],
            slots,
          };
        });

        // Clear fixtures when config changes
        s.fixtures  = [];
        s.knockout  = [];
        _fxId       = 0;
        return s;
      });
    },
    [patch]
  );

  // ── Players ─────────────────────────────────────────────
  const addPlayer = useCallback(
    (name: string) => {
      patch((s) => {
        const allNames = s.groups.flatMap((g) => g.slots.filter(Boolean)) as string[];
        if (allNames.includes(name)) return s;

        const available = s.groups.filter((g) => g.slots.some((x) => x === null));
        if (!available.length) return s;

        // Bias toward groups with the most empty slots so teams fill evenly
        const maxEmpty = Math.max(
          ...available.map((g) => g.slots.filter((x) => x === null).length)
        );
        const candidates = available.filter(
          (g) => g.slots.filter((x) => x === null).length === maxEmpty
        );
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        const si     = target.slots.indexOf(null);
        target.slots[si] = name;
        return s;
      });
    },
    [patch]
  );

  const removePlayer = useCallback(
    (groupIdx: number, slotIdx: number) => {
      patch((s) => {
        s.groups[groupIdx].slots[slotIdx] = null;
        // Compact: move nulls to the end so slots stay filled from the top
        const names = s.groups[groupIdx].slots.filter(Boolean) as string[];
        const ppt   = s.cfg.ppt;
        s.groups[groupIdx].slots = [
          ...names,
          ...Array<null>(ppt - names.length).fill(null),
        ];
        return s;
      });
    },
    [patch]
  );

  // ── Fixtures ─────────────────────────────────────────────
  const generateFixtures = useCallback(() => {
    patch((s) => {
      _fxId      = 0;
      s.fixtures = [];
      s.knockout = [];

      const fmt = getFormat(s.cfg.teams);
      let teamIdx = 0;

      fmt.groups.forEach((count, fgi) => {
        const teamLabels: string[] = [];
        for (let i = 0; i < count; i++) {
          if (teamIdx < s.groups.length) teamLabels.push(s.groups[teamIdx++].label);
        }
        // Round-robin within the fixture group
        for (let i = 0; i < teamLabels.length; i++) {
          for (let j = i + 1; j < teamLabels.length; j++) {
            s.fixtures.push(
              mkFx(
                `Team ${teamLabels[i]}`,
                `Team ${teamLabels[j]}`,
                "group",
                String.fromCharCode(88 + fgi) // X, Y, Z
              )
            );
          }
        }
      });

      // Seed knockout placeholders
      if (fmt.ko === "final") {
        s.knockout.push(mkFx("TBD 1st", "TBD 2nd", "final", "F"));
      } else {
        s.knockout.push(mkFx("TBD 1A", "TBD 2B", "semi",  "SF1"));
        s.knockout.push(mkFx("TBD 1B", "TBD 2A", "semi",  "SF2"));
        s.knockout.push(mkFx("TBD",    "TBD",     "third", "3RD"));
        s.knockout.push(mkFx("TBD",    "TBD",     "final", "F"));
      }
      return s;
    });
  }, [patch]);

  // ── Scores ───────────────────────────────────────────────
  const saveScore = useCallback(
    (id: number, hg: string | number, ag: string | number) => {
      patch((s) => {
        const fx = [...s.fixtures, ...s.knockout].find((f) => f.id === id);
        if (!fx) return s;
        fx.hg     = parseInt(String(hg));
        fx.ag     = parseInt(String(ag));
        fx.played = true;
        return s;
      });
    },
    [patch]
  );

  const resetScores = useCallback(() => {
    patch((s) => {
      [...s.fixtures, ...s.knockout].forEach((f) => {
        f.hg     = "";
        f.ag     = "";
        f.played = false;
      });
      return s;
    });
  }, [patch]);

  // ── Reset all ────────────────────────────────────────────
  const resetAll = useCallback(() => {
    _fxId = 0;
    setState(defaultState());
  }, []);

  // ── Standings (pure helper, no mutation) ─────────────────
  const calcStandings = useCallback(
    (teamLabels: string[], fixtures: Fixture[]): StandingRow[] => {
      const table: Record<string, StandingRow> = {};
      teamLabels.forEach((l) => {
        table[l] = { label: l, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 };
      });

      fixtures
        .filter((f) => f.played && f.stage === "group")
        .forEach((f) => {
          const hl = f.home.replace("Team ", "");
          const al = f.away.replace("Team ", "");
          const h  = table[hl];
          const a  = table[al];
          if (!h || !a) return;

          const hg = Number(f.hg);
          const ag = Number(f.ag);

          h.P++; a.P++;
          h.GF += hg; h.GA += ag;
          a.GF += ag; a.GA += hg;

          if (hg > ag)      { h.W++; h.Pts += 3; a.L++; }
          else if (hg < ag) { a.W++; a.Pts += 3; h.L++; }
          else              { h.D++; a.D++; h.Pts++; a.Pts++; }
        });

      return Object.values(table).sort(
        (a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA)
      );
    },
    []
  );

  const value: TournamentContextValue = {
    state,
    setConfig,
    applyConfig,
    addPlayer,
    removePlayer,
    generateFixtures,
    saveScore,
    resetScores,
    resetAll,
    calcStandings,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament(): TournamentContextValue {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournament must be used inside <TournamentProvider>");
  return ctx;
}
