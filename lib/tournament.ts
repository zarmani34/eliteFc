// lib/tournament.ts
// All Firestore operations for the tournament.
// Active tournament always lives at doc: tournaments/active
// Archived months live at: tournaments/{autoId}

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type {
  ActiveTournament,
  ArchivedTournament,
  Group,
  Fixture,
  Award,
  StandingRow,
  TournamentRecord,
} from "@/types/tournament";

const ACTIVE_REF = () => doc(getDb(), "tournaments", "active");
const ARCHIVE_REF = () => collection(getDb(), "tournaments_archive");

// ── Helpers ───────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

// ── READ ─────────────────────────────────────────────────

export async function getActiveTournament(): Promise<ActiveTournament | null> {
  const snap = await getDoc(ACTIVE_REF());
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ActiveTournament;
}

export async function getPreviousTournaments(count = 3): Promise<ArchivedTournament[]> {
  const q = query(ARCHIVE_REF(), orderBy("archivedAt", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ArchivedTournament));
}

// ── CREATE ────────────────────────────────────────────────

export async function createTournament(
  name: string,
  month: string,
  teams: number,
  ppt: number
): Promise<void> {
  const tournament: Omit<ActiveTournament, "id"> = {
    name,
    month,
    teams,
    ppt,
    status: "registration",
    registrationOpen: true,
    players: [],
    groups: [],
    fixtures: [],
    knockout: [],
    liveMatchId: null,
    liveScore: null,
    createdAt: now(),
    updatedAt: now(),
  };
  await setDoc(ACTIVE_REF(), tournament);
}

// ── PLAYERS ───────────────────────────────────────────────

export async function addPlayer(playerName: string): Promise<void> {
  const active = await getActiveTournament();
  if (!active) throw new Error("No active tournament");
  if (!active.registrationOpen) throw new Error("Registration is closed");
  if (active.players.includes(playerName)) throw new Error("Player already registered");

  const updated = [...active.players, playerName];
  await updateDoc(ACTIVE_REF(), {
    players: updated,
    updatedAt: now(),
  });
}

export async function removePlayer(playerName: string): Promise<void> {
  const active = await getActiveTournament();
  if (!active) throw new Error("No active tournament");

  const updated = active.players.filter((p) => p !== playerName);
  await updateDoc(ACTIVE_REF(), {
    players: updated,
    updatedAt: now(),
  });
}

export async function closeRegistration(): Promise<void> {
  await updateDoc(ACTIVE_REF(), {
    registrationOpen: false,
    updatedAt: now(),
  });
}

export async function openRegistration(): Promise<void> {
  await updateDoc(ACTIVE_REF(), {
    registrationOpen: true,
    updatedAt: now(),
  });
}

// ── DRAW ─────────────────────────────────────────────────

export async function saveDraw(groups: Group[]): Promise<void> {
  await updateDoc(ACTIVE_REF(), {
    groups,
    status: "drawn",
    registrationOpen: false,
    updatedAt: now(),
  });
}

// ── FIXTURES ─────────────────────────────────────────────

export async function saveFixtures(
  fixtures: Fixture[],
  knockout: Fixture[]
): Promise<void> {
  await updateDoc(ACTIVE_REF(), {
    fixtures,
    knockout,
    status: "ongoing",
    updatedAt: now(),
  });
}

export async function updateFixtureScore(
  fixtureId: number,
  hg: number,
  ag: number,
  isKnockout: boolean
): Promise<void> {
  const active = await getActiveTournament();
  if (!active) throw new Error("No active tournament");

  const list = isKnockout ? [...active.knockout] : [...active.fixtures];
  const idx = list.findIndex((f) => f.id === fixtureId);
  if (idx === -1) throw new Error("Fixture not found");

  list[idx] = { ...list[idx], hg, ag, played: true };

  const field = isKnockout ? "knockout" : "fixtures";
  await updateDoc(ACTIVE_REF(), {
    [field]: list,
    updatedAt: now(),
  });
}

// ── COMPLETE MONTH ────────────────────────────────────────

export async function completeMonth(record: TournamentRecord): Promise<void> {
  const active = await getActiveTournament();
  if (!active) throw new Error("No active tournament");

  // Save to archive
  const archived: Omit<ArchivedTournament, "id"> = {
    name: active.name,
    month: active.month,
    players: active.players,
    groups: active.groups,
    fixtures: active.fixtures,
    knockout: active.knockout,
    record,
    archivedAt: now(),
  };
  await addDoc(ARCHIVE_REF(), archived);

  // Mark active as completed (keep it visible until new month is created)
  await updateDoc(ACTIVE_REF(), {
    status: "completed",
    updatedAt: now(),
  });
}
