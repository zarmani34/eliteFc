// app/api/tournament/draw/route.ts
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { generateDraw } from "@/lib/format";
import { getActiveTournament, saveDraw } from "@/lib/tournament.server";

export async function POST() {
  const authed = await isAdminAuthenticated();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const active = await getActiveTournament();
    if (!active) return NextResponse.json({ error: "No active tournament" }, { status: 404 });

    const needed = active.teams * active.ppt;
    if (active.players.length < needed) {
      return NextResponse.json(
        { error: `Need ${needed} players, only ${active.players.length} registered` },
        { status: 400 }
      );
    }

    const groups = generateDraw(active.players, active.teams, active.ppt);
    await saveDraw(groups);
    return NextResponse.json({ success: true, groups });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Draw failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
