// app/api/tournament/scores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getActiveTournament, saveFixtures, updateFixtureScore } from "@/lib/tournament.server";
import { generateFixtures } from "@/lib/format";

// POST — generate fixtures (admin only)
export async function POST() {
  const authed = await isAdminAuthenticated();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const active = await getActiveTournament();
    if (!active) return NextResponse.json({ error: "No active tournament" }, { status: 404 });
    if (active.status !== "drawn") {
      return NextResponse.json({ error: "Draw must be completed first" }, { status: 400 });
    }

    const { fixtures, knockout } = generateFixtures(active.groups, active.teams);
    await saveFixtures(fixtures, knockout);
    return NextResponse.json({ success: true, fixtures, knockout });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate fixtures";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH — update a single fixture score (admin only)
export async function PATCH(req: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { fixtureId, hg, ag, isKnockout } = await req.json();
    if (fixtureId === undefined || hg === undefined || ag === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    await updateFixtureScore(fixtureId, Number(hg), Number(ag), Boolean(isKnockout));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save score";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}