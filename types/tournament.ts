// types/tournament.ts

export type TournamentStatus =
  | "registration"
  | "drawn"
  | "ongoing"
  | "completed";

export type FixtureStage = "group" | "semi" | "third" | "final";

export interface Group {
  label: string;  // club name e.g. "Valencia"
  color: string;
  slots: (string | null)[];
}

export interface Fixture {
  id: number;
  home: string;
  away: string;
  stage: FixtureStage;
  group: string;
  round: number;
  hg: number | "";
  ag: number | "";
  penalties?: { home: number; away: number } | null;
  played: boolean;
}

export interface Round {
  round: number;
  fixtures: Fixture[];
}

export interface LiveScore {
  hg: number;
  ag: number;
  isPenalties?: boolean;
  penalties?: { home: number; away: number } | null;
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
  teamNames: string[];   // club names set at creation, e.g. ["Valencia","Everton",...]
  groups: Group[];
  fixtures: Fixture[];
  knockout: Fixture[];
  liveMatchId: number | null;
  liveScore: LiveScore | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArchivedTournament {
  id: string;
  name: string;
  month: string;
  players: string[];
  teamNames: string[];
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