// types/tournament.ts

export type TournamentStatus =
  | "registration"
  | "drawn"
  | "ongoing"
  | "completed";

export type FixtureStage = "group" | "semi" | "third" | "final";

export interface Group {
  label: string;
  color: string;
  slots: (string | null)[];
}

export interface Fixture {
  id: number;
  home: string;
  away: string;
  stage: FixtureStage;
  group: string; // fixture group label e.g. "X", "Y"
  round: number; // which round this match belongs to (1, 2, 3…)
  hg: number | "";
  ag: number | "";
  played: boolean;
}

// A single round containing multiple matches
export interface Round {
  round: number;
  fixtures: Fixture[];
}

export interface Award {
  label: string;
  player: string;
}

export interface StandingRow {
  label: string;
  P: number;
  W: number;
  D: number;
  L: number;
  GF: number;
  GA: number;
  Pts: number;
}

export interface TournamentRecord {
  champion: string;
  awards: Award[];
  standings: StandingRow[];
  completedAt: string;
}

export interface ActiveTournament {
  id: string;
  name: string;
  month: string;
  teams: number;
  ppt: number;
  status: TournamentStatus;
  registrationOpen: boolean;
  players: string[];
  groups: Group[];
  fixtures: Fixture[];
  knockout: Fixture[];
  liveMatchId: number | null;
  createdAt: string;
  updatedAt: string;
  // types/tournament.ts — add these fields to ActiveTournament
  liveHg?: number;
  liveAg?: number;
}

export interface ArchivedTournament {
  id: string;
  name: string;
  month: string;
  players: string[];
  groups: Group[];
  fixtures: Fixture[];
  knockout: Fixture[];
  record: TournamentRecord;
  archivedAt: string;
}

export interface PublicTournamentView {
  active: ActiveTournament | null;
  previous: ArchivedTournament[];
}

export type FormatKo = "final" | "semis";

export interface TournamentFormat {
  groups: number[];
  ko: FormatKo;
  desc: string;
}

export type TeamColorMap = Record<string, string>;
