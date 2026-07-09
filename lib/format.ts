// lib/format.ts
// Pure functions — no Firebase, no React. Safe to import anywhere.

import type {
  TournamentFormat,
  Group,
  Fixture,
  FixtureStage,
  StandingRow,
  Round,
} from "@/types/tournament";

// ── Default club names (pre-filled, admin can edit) ───────
export const DEFAULT_TEAM_NAMES: string[] = [
  "Valencia",
  "Everton",
  "Sunderland",
  "Roma",
  "Como",
  "Napoli",
  "Fiorentina",
  "Atalanta",
];

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

// ── FORMAT CONFIG ─────────────────────────────────────────
// 5 teams: 2 random group matches, top 4 → semis, final
// 6–8 teams: standard group stage + knockout

export function getFormat(n: number): TournamentFormat {
  const formats: Record<number, TournamentFormat> = {
    5: {
      groups: [5],
      ko: "semis",
      desc: "5 matches total — each team plays exactly 2 group games. Top 4 → Semis (1v4, 2v3) + Final + 3rd place.",
    },
    6: {
      groups: [3, 3],
      ko: "semis",
      desc: "2 groups of 3. Cross-semis + Final + 3rd place.",
    },
    7: {
      groups: [4, 3],
      ko: "semis",
      desc: "Groups of 4 & 3. Cross-semis + Final + 3rd place.",
    },
    8: {
      groups: [4, 4],
      ko: "semis",
      desc: "2 groups of 4. Semis + Final + 3rd place.",
    },
  };
  return formats[n] ?? formats[6];
}

// ── DRAW ──────────────────────────────────────────────────
// Uses teamNames stored in Firestore (set at tournament creation).

export function generateDraw(
  players: string[],
  teams: number,
  ppt: number,
  teamNames: string[]
): Group[] {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  return Array.from({ length: teams }, (_, i): Group => {
    const chunk = shuffled.slice(i * ppt, (i + 1) * ppt);
    return {
      label: teamNames[i] ?? DEFAULT_TEAM_NAMES[i] ?? `Team ${i + 1}`,
      color: GROUP_COLORS[i],
      slots: [
        ...chunk,
        ...Array<null>(Math.max(0, ppt - chunk.length)).fill(null),
      ],
    };
  });
}

// ── CIRCLE-METHOD ROUND-ROBIN ─────────────────────────────
// Produces rounds where every team plays once per round.

function circleRoundRobin(
  teamLabels: string[]
): Array<Array<[string, string]>> {
  const teams = [...teamLabels];
  const hasBye = teams.length % 2 !== 0;
  if (hasBye) teams.push("BYE");

  const n      = teams.length;
  const rounds = n - 1;
  const result: Array<Array<[string, string]>> = [];
  const rotating = teams.slice(1);

  for (let r = 0; r < rounds; r++) {
    const current = [teams[0], ...rotating];
    const roundMatches: Array<[string, string]> = [];
    for (let i = 0; i < n / 2; i++) {
      const home = current[i];
      const away = current[n - 1 - i];
      if (home !== "BYE" && away !== "BYE") {
        roundMatches.push([home, away]);
      }
    }
    result.push(roundMatches);
    rotating.unshift(rotating.pop()!);
  }
  return result;
}

// ── FIXTURE GENERATION ────────────────────────────────────

let _fxId = 0;

function mkFx(
  home: string,
  away: string,
  stage: FixtureStage,
  group: string,
  round: number
): Fixture {
  return { id: _fxId++, home, away, stage, group, round, hg: "", ag: "", played: false };
}

export function generateFixtures(
  groups: Group[],
  teams: number
): { fixtures: Fixture[]; knockout: Fixture[] } {
  _fxId = 0;
  const allFixtures: Fixture[] = [];
  const fmt = getFormat(teams);

  if (teams === 5) {
    // 5-team format — exactly 5 matches, each team plays exactly 2 games.
    // Pattern: [0]v[1], [2]v[3], [4]v[0], [1]v[2], [3]v[4]
    // This is a known balanced 5-team schedule (no team plays consecutively).
    // Top 4 by points → Semis. 5th place is eliminated.
    const t = groups.map(g => g.label);
    const pairs: [string, string][] = [
      [t[0], t[1]], // Match 1
      [t[2], t[3]], // Match 2  ← t[4] sits out round 1
      [t[4], t[0]], // Match 3  ← t[1] sits out round... (no explicit rounds, sequential)
      [t[1], t[2]], // Match 4
      [t[3], t[4]], // Match 5
    ];
    pairs.forEach((pair, i) => {
      allFixtures.push(mkFx(pair[0], pair[1], "group", "X", i + 1));
    });
    // Result: each team plays exactly 2 matches ✓
    // Valencia: M1, M3 | Everton: M1, M4 | Sunderland: M2, M4
    // Roma: M2, M5     | Como: M3, M5
  } else {
    // Standard group-stage round-robin for 6–8 teams
    let teamIdx = 0;
    fmt.groups.forEach((count, fgi) => {
      const groupLabel = String.fromCharCode(88 + fgi); // X, Y
      const teamLabels: string[] = [];
      for (let i = 0; i < count; i++) {
        if (teamIdx < groups.length) teamLabels.push(groups[teamIdx++].label);
      }
      const roundPairings = circleRoundRobin(teamLabels);
      roundPairings.forEach((matches, ri) => {
        matches.forEach(([home, away]) => {
          allFixtures.push(mkFx(home, away, "group", groupLabel, ri + 1));
        });
      });
    });
  }

  const maxRound = Math.max(...allFixtures.map((f) => f.round), 0);
  const koStart  = maxRound + 1;

  // All formats get semis + final + 3rd place
  // Penalties available in ALL knockout matches
  const knockout: Fixture[] = [
    mkFx("TBD 1st", "TBD 4th", "semi",  "SF1", koStart),
    mkFx("TBD 2nd", "TBD 3rd", "semi",  "SF2", koStart),
    mkFx("TBD",     "TBD",     "third", "3RD", koStart + 1),
    mkFx("TBD",     "TBD",     "final", "F",   koStart + 1),
  ];

  return { fixtures: allFixtures, knockout };
}

// ── GROUP ROUNDS (for display) ────────────────────────────

export function groupByRound(fixtures: Fixture[]): Round[] {
  const map: Record<number, Fixture[]> = {};
  fixtures.forEach((f) => {
    if (!map[f.round]) map[f.round] = [];
    map[f.round].push(f);
  });
  return Object.entries(map)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([round, fxs]) => ({ round: Number(round), fixtures: fxs }));
}

// ── STANDINGS ─────────────────────────────────────────────

export function calcStandings(
  teamLabels: string[],
  fixtures: Fixture[]
): StandingRow[] {
  const table: Record<string, StandingRow> = {};
  teamLabels.forEach((l) => {
    table[l] = { label: l, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 };
  });

  fixtures
    .filter((f) => f.played && f.stage === "group")
    .forEach((f) => {
      const h = table[f.home];
      const a = table[f.away];
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
}

// ── KNOCKOUT SEEDING ──────────────────────────────────────
// Seeds knockout from live standings.
// For 5 teams: top 4 ranked teams → SF1: 1v4, SF2: 2v3
// For 6–8 teams: cross-semis from two fixture groups

export function seedKnockout(
  knockout: Fixture[],
  groups: Group[],
  fixtures: Fixture[],
  teams: number
): Fixture[] {
  const seeded = knockout.map((f) => ({ ...f }));

  if (teams === 5) {
    // All 5 teams in one pool — rank by points
    const allLabels = groups.map((g) => g.label);
    const ranked    = calcStandings(allLabels, fixtures);
    // Seed: 1st vs 4th, 2nd vs 3rd
    // 5th place team is still in ranked but misses out
    const sf1 = seeded.find((f) => f.group === "SF1");
    const sf2 = seeded.find((f) => f.group === "SF2");
    if (sf1) {
      sf1.home = ranked[0]?.label ?? "1st";
      sf1.away = ranked[3]?.label ?? "4th";
    }
    if (sf2) {
      sf2.home = ranked[1]?.label ?? "2nd";
      sf2.away = ranked[2]?.label ?? "3rd";
    }
  } else {
    // Standard cross-semis from two fixture groups
    const fmt = getFormat(teams);
    let teamIdx = 0;
    const fGroups = fmt.groups.map((count) => {
      const labels: string[] = [];
      for (let i = 0; i < count; i++) {
        if (teamIdx < groups.length) labels.push(groups[teamIdx++].label);
      }
      return calcStandings(labels, fixtures);
    });

    const sf1 = seeded.find((f) => f.group === "SF1");
    const sf2 = seeded.find((f) => f.group === "SF2");
    if (sf1) {
      sf1.home = fGroups[0]?.[0]?.label ?? "1A";
      sf1.away = fGroups[1]?.[1]?.label ?? "2B";
    }
    if (sf2) {
      sf2.home = fGroups[1]?.[0]?.label ?? "1B";
      sf2.away = fGroups[0]?.[1]?.label ?? "2A";
    }
  }

  // Seed final and 3rd place from semi results
  const sf1 = seeded.find((f) => f.group === "SF1");
  const sf2 = seeded.find((f) => f.group === "SF2");
  if (sf1?.played && sf2?.played) {
    const getWinner = (f: Fixture) => {
      if (Number(f.hg) > Number(f.ag)) return f.home;
      if (Number(f.ag) > Number(f.hg)) return f.away;
      // Drawn — check penalties
      if (f.penalties) {
        return f.penalties.home > f.penalties.away ? f.home : f.away;
      }
      return f.home; // fallback
    };
    const getLoser = (f: Fixture) => {
      const w = getWinner(f);
      return w === f.home ? f.away : f.home;
    };

    const fin = seeded.find((f) => f.group === "F");
    const trd = seeded.find((f) => f.group === "3RD");
    if (fin) { fin.home = getWinner(sf1); fin.away = getWinner(sf2); }
    if (trd) { trd.home = getLoser(sf1);  trd.away = getLoser(sf2);  }
  }

  return seeded;
}