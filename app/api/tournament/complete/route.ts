// app/api/tournament/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { completeMonth } from "@/lib/tournament.server";
import type { TournamentRecord } from "@/types/tournament";

export async function POST(req: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const record: TournamentRecord = {
      champion: body.champion,
      awards: body.awards ?? [],
      standings: body.standings ?? [],
      completedAt: new Date().toISOString(),
    };

    if (!record.champion) {
      return NextResponse.json({ error: "Champion is required" }, { status: 400 });
    }

    await completeMonth(record);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to complete month";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
