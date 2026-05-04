// lib/format.ts
// Pure functions — no Firebase, no React.
// Safe to import anywhere including client components.

import type {
  TournamentFormat,
  Group,
  Fixture,
  FixtureStage,
  StandingRow,
  Round,
} from "@/types/tournament";

export const GROUP_COLORS: string[] = [
  "#f87171", "#60a5fa", "#4ade80", "#facc15",
  "#c084fc", "#fb923c", "#34d399", "#f472b6",
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

// ── DRAW ──────────────────────────────────────────────────

export function generateDraw(
  players: string[],
  teams: number,
  ppt: number
): Group[] {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  return Array.from({ length: teams }, (_, i): Group => {
    const chunk = shuffled.slice(i * ppt, (i + 1) * ppt);
    return {
      label: String.fromCharCode(65 + i),
      color: GROUP_COLORS[i],
      slots: [
        ...chunk,
        ...Array<null>(Math.max(0, ppt - chunk.length)).fill(null),
      ],
    };
  });
}

// ── CIRCLE-METHOD ROUND-ROBIN ─────────────────────────────
// Produces rounds where every team plays exactly once per round.
// For N teams (N even):   N-1 rounds, N/2 matches per round.
// For N teams (N odd):    N  rounds,  floor(N/2) matches per round (one BYE per round).
//
// Algorithm: pin team[0], rotate the rest clockwise each round.
// Pairs: team[0] vs team[N-1], team[1] vs team[N-2], etc.

function circleRoundRobin(teamLabels: string[]): Array<Array<[string, string]>> {
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
      // Skip BYE matches
      if (home !== "BYE" && away !== "BYE") {
        roundMatches.push([home, away]);
      }
    }

    result.push(roundMatches);
    // Rotate: move last element of rotating to front
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
  return {
    id: _fxId++,
    home,
    away,
    stage,
    group,
    round,
    hg: "",
    ag: "",
    played: false,
  };
}

export function generateFixtures(
  groups: Group[],
  teams: number
): { fixtures: Fixture[]; knockout: Fixture[]; rounds: Round[] } {
  _fxId = 0;
  const allFixtures: Fixture[] = [];
  const fmt = getFormat(teams);

  // Split teams into fixture groups per format (e.g. [4,4] → two groups of 4)
  let teamIdx = 0;
  fmt.groups.forEach((count, fgi) => {
    const groupLabel = String.fromCharCode(88 + fgi); // "X", "Y"
    const teamLabels: string[] = [];

    for (let i = 0; i < count; i++) {
      if (teamIdx < groups.length) {
        teamLabels.push(`Team ${groups[teamIdx++].label}`);
      }
    }

    // Generate round-robin rounds for this fixture group
    const roundPairings = circleRoundRobin(teamLabels);
    roundPairings.forEach((matches, ri) => {
      matches.forEach(([home, away]) => {
        allFixtures.push(mkFx(home, away, "group", groupLabel, ri + 1));
      });
    });
  });

  // Interleave rounds across fixture groups so schedule alternates
  // e.g. Round 1 of Group X, Round 1 of Group Y, Round 2 of Group X…
  // Build round objects grouped by round number
  const maxRound = Math.max(...allFixtures.map((f) => f.round), 0);
  const rounds: Round[] = [];
  for (let r = 1; r <= maxRound; r++) {
    const roundFixtures = allFixtures.filter((f) => f.round === r);
    if (roundFixtures.length > 0) {
      rounds.push({ round: r, fixtures: roundFixtures });
    }
  }

  // Seed knockout placeholders
  const knockout: Fixture[] = [];
  const koRoundStart = maxRound + 1;

  if (fmt.ko === "final") {
    knockout.push(mkFx("TBD 1st", "TBD 2nd", "final", "F", koRoundStart));
  } else {
    knockout.push(mkFx("TBD 1A", "TBD 2B", "semi",  "SF1", koRoundStart));
    knockout.push(mkFx("TBD 1B", "TBD 2A", "semi",  "SF2", koRoundStart));
    knockout.push(mkFx("TBD",    "TBD",     "third", "3RD", koRoundStart + 1));
    knockout.push(mkFx("TBD",    "TBD",     "final", "F",   koRoundStart + 1));
  }

  return { fixtures: allFixtures, knockout, rounds };
}

// ── GROUP ROUNDS (for display) ────────────────────────────
// Takes flat fixtures array and returns them grouped by round.

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
}

// ── KNOCKOUT SEEDING ──────────────────────────────────────

export function seedKnockout(
  knockout: Fixture[],
  groups: Group[],
  fixtures: Fixture[],
  teams: number
): Fixture[] {
  const fmt    = getFormat(teams);
  const seeded = knockout.map((f) => ({ ...f }));

  let teamIdx = 0;
  const fGroups = fmt.groups.map((count) => {
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      if (teamIdx < groups.length) labels.push(groups[teamIdx++].label);
    }
    return calcStandings(labels, fixtures);
  });

  if (fmt.ko === "final") {
    const fin = seeded.find((f) => f.stage === "final");
    if (fin) {
      fin.home = `Team ${fGroups[0]?.[0]?.label ?? "1st"}`;
      fin.away = `Team ${fGroups[0]?.[1]?.label ?? "2nd"}`;
    }
  } else {
    const sf1 = seeded.find((f) => f.group === "SF1");
    const sf2 = seeded.find((f) => f.group === "SF2");
    if (sf1) {
      sf1.home = `Team ${fGroups[0]?.[0]?.label ?? "1A"}`;
      sf1.away = `Team ${fGroups[1]?.[1]?.label ?? "2B"}`;
    }
    if (sf2) {
      sf2.home = `Team ${fGroups[1]?.[0]?.label ?? "1B"}`;
      sf2.away = `Team ${fGroups[0]?.[1]?.label ?? "2A"}`;
    }
    if (sf1?.played && sf2?.played) {
      const w1 = Number(sf1.hg) > Number(sf1.ag) ? sf1.home : sf1.away;
      const w2 = Number(sf2.hg) > Number(sf2.ag) ? sf2.home : sf2.away;
      const l1 = Number(sf1.hg) > Number(sf1.ag) ? sf1.away : sf1.home;
      const l2 = Number(sf2.hg) > Number(sf2.ag) ? sf2.away : sf2.home;
      const fin = seeded.find((f) => f.group === "F");
      const trd = seeded.find((f) => f.group === "3RD");
      if (fin) { fin.home = w1; fin.away = w2; }
      if (trd) { trd.home = l1; trd.away = l2; }
    }
  }

  return seeded;
}