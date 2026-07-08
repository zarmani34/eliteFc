// lib/tournament.server.ts
import { adminDb } from './firebase-admin';
import type {
  ActiveTournament,
  ArchivedTournament,
  Group,
  Fixture,
  TournamentRecord,
  LiveScore,
} from '@/types/tournament';

function now() {
  return new Date().toISOString();
}

// ── Safe cast helper ──────────────────────────────────────
// Prevents "conversion may be a mistake" TS errors when
// spreading Firestore data that may have missing fields.

function toActiveTournament(data: FirebaseFirestore.DocumentData, id: string): ActiveTournament {
  return {
    id,
    name: "",
    month: "",
    teams: 6,
    ppt: 8,
    status: "registration",
    registrationOpen: true,
    players: [],
    groups: [],
    fixtures: [],
    knockout: [],
    liveMatchId: null,
    liveScore: null,
    createdAt: "",
    updatedAt: "",
    ...data,
  } as ActiveTournament;
}

// ── READS ─────────────────────────────────────────────────

export async function getActiveTournament(): Promise<ActiveTournament | null> {
  const snap = await adminDb.doc('tournaments/active').get();
  if (!snap.exists) return null;
  return toActiveTournament(snap.data()!, snap.id);
}

export async function getPreviousTournaments(count = 3): Promise<ArchivedTournament[]> {
  const snap = await adminDb
    .collection('tournaments_archive')
    .orderBy('archivedAt', 'desc')
    .limit(count)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ArchivedTournament));
}

// ── ARCHIVE HELPER ────────────────────────────────────────

async function archiveCurrentTournament(active: ActiveTournament): Promise<void> {
  if (active.status === 'registration' && active.players.length === 0) return;
  await adminDb.collection('tournaments_archive').add({
    name: active.name,
    month: active.month,
    players: active.players,
    groups: active.groups ?? [],
    fixtures: active.fixtures ?? [],
    knockout: active.knockout ?? [],
    record: {
      champion: 'Archived without completion',
      awards: [],
      standings: [],
      completedAt: now(),
    },
    archivedAt: now(),
  });
}

// ── TOURNAMENT SETUP ──────────────────────────────────────

export async function createTournament(
  name: string,
  month: string,
  teams: number,
  ppt: number,
  forceArchive = false
): Promise<{ archived: boolean; previousStatus: string | null }> {
  const existing = await getActiveTournament();
  let archived = false;

  if (existing) {
    const { status } = existing;
    if ((status === 'ongoing' || status === 'drawn') && !forceArchive) {
      throw new Error(`CONFIRM_REQUIRED:${status}`);
    }
    await archiveCurrentTournament(existing);
    archived = true;
  }

  await adminDb.doc('tournaments/active').set({
    name, month, teams, ppt,
    status: 'registration',
    registrationOpen: true,
    players: [],
    groups: [],
    fixtures: [],
    knockout: [],
    liveMatchId: null,
    liveScore: null,
    createdAt: now(),
    updatedAt: now(),
  });

  return { archived, previousStatus: existing?.status ?? null };
}

export async function closeRegistration(): Promise<void> {
  await adminDb.doc('tournaments/active').update({ registrationOpen: false, updatedAt: now() });
}

export async function openRegistration(): Promise<void> {
  await adminDb.doc('tournaments/active').update({ registrationOpen: true, updatedAt: now() });
}

// ── PLAYERS ───────────────────────────────────────────────

export async function addPlayer(playerName: string): Promise<void> {
  const snap = await adminDb.doc('tournaments/active').get();
  if (!snap.exists) throw new Error('No active tournament');
  const active = toActiveTournament(snap.data()!, snap.id);
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
  const active = toActiveTournament(snap.data()!, snap.id);
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

export async function saveFixtures(fixtures: Fixture[], knockout: Fixture[]): Promise<void> {
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
  isKnockout: boolean,
  penalties?: { home: number; away: number } | null
): Promise<void> {
  const snap = await adminDb.doc('tournaments/active').get();
  if (!snap.exists) throw new Error('No active tournament');
  const active = toActiveTournament(snap.data()!, snap.id);
  const list = isKnockout ? [...active.knockout] : [...active.fixtures];
  const idx  = list.findIndex((f: Fixture) => f.id === fixtureId);
  if (idx === -1) throw new Error('Fixture not found');
  list[idx] = {
    ...list[idx],
    hg,
    ag,
    penalties: penalties ?? null,
    played: true,
  };
  await adminDb.doc('tournaments/active').update({
    [isKnockout ? 'knockout' : 'fixtures']: list,
    updatedAt: now(),
  });
}

// ── LIVE MATCH ────────────────────────────────────────────

export async function setLiveMatch(fixtureId: number | null): Promise<void> {
  await adminDb.doc('tournaments/active').update({
    liveMatchId: fixtureId,
    liveScore: fixtureId !== null ? { hg: 0, ag: 0, isPenalties: false, penalties: null } : null,
    updatedAt: now(),
  });
}

export async function updateLiveScore(score: LiveScore): Promise<void> {
  await adminDb.doc('tournaments/active').update({
    liveScore: score,
    updatedAt: now(),
  });
}

export async function endLiveMatch(
  fixtureId: number,
  hg: number,
  ag: number,
  isKnockout: boolean,
  penalties?: { home: number; away: number } | null
): Promise<void> {
  const snap = await adminDb.doc('tournaments/active').get();
  if (!snap.exists) throw new Error('No active tournament');
  const active = toActiveTournament(snap.data()!, snap.id);
  const list = isKnockout ? [...active.knockout] : [...active.fixtures];
  const idx  = list.findIndex((f: Fixture) => f.id === fixtureId);
  if (idx === -1) throw new Error('Fixture not found');
  list[idx] = {
    ...list[idx],
    hg,
    ag,
    penalties: penalties ?? null,
    played: true,
  };
  await adminDb.doc('tournaments/active').update({
    [isKnockout ? 'knockout' : 'fixtures']: list,
    liveMatchId: null,
    liveScore: null,
    updatedAt: now(),
  });
}

// ── COMPLETE MONTH ────────────────────────────────────────

export async function completeMonth(record: TournamentRecord): Promise<void> {
  const snap = await adminDb.doc('tournaments/active').get();
  if (!snap.exists) throw new Error('No active tournament');
  const active = toActiveTournament(snap.data()!, snap.id);
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
    liveScore: null,
    updatedAt: now(),
  });
}