// lib/tournament.server.ts
// Admin SDK only — used by server components and API routes.
// Never import this in a client component.

import { adminDb } from './firebase-admin';
import type {
  ActiveTournament,
  ArchivedTournament,
  Group,
  Fixture,
  TournamentRecord,
} from '@/types/tournament';

function now() {
  return new Date().toISOString();
}

// ── READS ─────────────────────────────────────────────────

export async function getActiveTournament(): Promise<ActiveTournament | null> {
  const snap = await adminDb.doc('tournaments/active').get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as ActiveTournament;
}

export async function getPreviousTournaments(count = 3): Promise<ArchivedTournament[]> {
  const snap = await adminDb
    .collection('tournaments_archive')
    .orderBy('archivedAt', 'desc')
    .limit(count)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ArchivedTournament));
}

// ── TOURNAMENT SETUP ──────────────────────────────────────

export async function createTournament(
  name: string, month: string, teams: number, ppt: number
): Promise<void> {
  await adminDb.doc('tournaments/active').set({
    name, month, teams, ppt,
    status: 'registration',
    registrationOpen: true,
    players: [],
    groups: [],
    fixtures: [],
    knockout: [],
    liveMatchId: null,
    createdAt: now(),
    updatedAt: now(),
  });
}

export async function closeRegistration(): Promise<void> {
  await adminDb.doc('tournaments/active').update({
    registrationOpen: false,
    updatedAt: now(),
  });
}

export async function openRegistration(): Promise<void> {
  await adminDb.doc('tournaments/active').update({
    registrationOpen: true,
    updatedAt: now(),
  });
}

// ── PLAYERS ───────────────────────────────────────────────

export async function addPlayer(playerName: string): Promise<void> {
  const snap = await adminDb.doc('tournaments/active').get();
  if (!snap.exists) throw new Error('No active tournament');
  const active = snap.data() as ActiveTournament;
  if (!active.registrationOpen) throw new Error('Registration is closed');
  if (active.players.includes(playerName)) throw new Error('Player already registered');
  await adminDb.doc('tournaments/active').update({
    players: [...active.players, playerName],
    updatedAt: now(),
  });
}

export async function removePlayer(playerName: string): Promise<void> {
  const snap = await adminDb.doc('tournaments/active').get();
  if (!snap.exists) throw new Error('No active tournament');
  const active = snap.data() as ActiveTournament;
  await adminDb.doc('tournaments/active').update({
    players: active.players.filter((p: string) => p !== playerName),
    updatedAt: now(),
  });
}

// ── DRAW ──────────────────────────────────────────────────

export async function saveDraw(groups: Group[]): Promise<void> {
  await adminDb.doc('tournaments/active').update({
    groups,
    status: 'drawn',
    registrationOpen: false,
    updatedAt: now(),
  });
}

// ── FIXTURES ──────────────────────────────────────────────

export async function saveFixtures(
  fixtures: Fixture[],
  knockout: Fixture[]
): Promise<void> {
  await adminDb.doc('tournaments/active').update({
    fixtures,
    knockout,
    status: 'ongoing',
    updatedAt: now(),
  });
}

export async function updateFixtureScore(
  fixtureId: number,
  hg: number,
  ag: number,
  isKnockout: boolean
): Promise<void> {
  const snap = await adminDb.doc('tournaments/active').get();
  if (!snap.exists) throw new Error('No active tournament');
  const active = snap.data() as ActiveTournament;

  const list = isKnockout ? [...active.knockout] : [...active.fixtures];
  const idx  = list.findIndex((f: Fixture) => f.id === fixtureId);
  if (idx === -1) throw new Error('Fixture not found');

  list[idx] = { ...list[idx], hg, ag, played: true };

  await adminDb.doc('tournaments/active').update({
    [isKnockout ? 'knockout' : 'fixtures']: list,
    updatedAt: now(),
  });
}

// ── LIVE MATCH CONTROL ────────────────────────────────────

/**
 * Set a fixture as the currently live match.
 * Pass null to clear (no match live).
 */// Add these to lib/tournament.server.ts

export async function setLiveMatch(fixtureId: number | null): Promise<void> {
  await adminDb.doc('tournaments/active').update({
    liveMatchId: fixtureId ?? null,
    liveHg: 0,
    liveAg: 0,
    updatedAt: now(),
  });
}

export async function endLiveMatch(
  fixtureId: number, hg: number, ag: number, isKnockout: boolean
): Promise<void> {
  const snap = await adminDb.doc('tournaments/active').get();
  if (!snap.exists) throw new Error('No active tournament');

  const active = snap.data() as ActiveTournament;
  const list = isKnockout ? [...active.knockout] : [...active.fixtures];
  const idx = list.findIndex((f: Fixture) => f.id === fixtureId);
  if (idx === -1) throw new Error('Fixture not found');

  list[idx] = { ...list[idx], hg, ag, played: true };

  await adminDb.doc('tournaments/active').update({
    [isKnockout ? 'knockout' : 'fixtures']: list,
    liveMatchId: null,  // clear live match
    liveHg: 0,
    liveAg: 0,
    updatedAt: now(),
  });
}

export async function updateLiveScore(hg: number, ag: number): Promise<void> {
  await adminDb.doc('tournaments/active').update({
    liveHg: hg,
    liveAg: ag,
    updatedAt: now(),
  });
}

// ── COMPLETE MONTH ────────────────────────────────────────

export async function completeMonth(record: TournamentRecord): Promise<void> {
  const snap = await adminDb.doc('tournaments/active').get();
  if (!snap.exists) throw new Error('No active tournament');
  const active = snap.data() as ActiveTournament;

  await adminDb.collection('tournaments_archive').add({
    name: active.name,
    month: active.month,
    players: active.players,
    groups: active.groups,
    fixtures: active.fixtures,
    knockout: active.knockout,
    record,
    archivedAt: now(),
  });

  await adminDb.doc('tournaments/active').update({
    status: 'completed',
    liveMatchId: null,
    updatedAt: now(),
  });
}
