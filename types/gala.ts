// types/gala.ts
// ─────────────────────────────────────────────
// Shared TypeScript types for the FC Gala tournament app
// ─────────────────────────────────────────────

export type Group = {
  label: string;
  color: string;
  slots: (string | null)[];
};

export type FixtureStage = "group" | "semi" | "third" | "final";

export type Fixture = {
  id: number;
  home: string;
  away: string;
  stage: FixtureStage;
  group: string;
  hg: number | "";
  ag: number | "";
  played: boolean;
};

export type TournamentConfig = {
  month: string;
  teams: number;
  ppt: number;
};

export type StandingRow = {
  label: string;
  P: number;
  W: number;
  D: number;
  L: number;
  GF: number;
  GA: number;
  Pts: number;
};

export type Award = {
  label: string;
  player: string;
};

export type MonthRecord = {
  id?: string;
  month: string;
  champion: string;
  awards: Award[];
  standings: StandingRow[];
  date: string;
  createdAt?: unknown; // Firestore serverTimestamp
};

export type FormatKo = "final" | "semis";

export type TournamentFormat = {
  groups: number[];
  ko: FormatKo;
  desc: string;
};

export type TournamentState = {
  cfg: TournamentConfig;
  groups: Group[];
  fixtures: Fixture[];
  knockout: Fixture[];
};

export type TeamColorMap = Record<string, string>;

export type TournamentContextValue = {
  state: TournamentState;
  setConfig: (key: keyof TournamentConfig, value: string | number) => void;
  applyConfig: (teams: number, ppt: number) => void;
  addPlayer: (name: string) => void;
  removePlayer: (groupIdx: number, slotIdx: number) => void;
  generateFixtures: () => void;
  saveScore: (id: number, hg: string | number, ag: string | number) => void;
  resetScores: () => void;
  resetAll: () => void;
  calcStandings: (teamLabels: string[], fixtures: Fixture[]) => StandingRow[];
};
