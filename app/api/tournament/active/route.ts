// app/api/tournament/active/route.ts
import { NextResponse } from "next/server";
import { getActiveTournament, getPreviousTournaments } from "@/lib/tournament.server";

export async function GET() {
  try {
    const [active, previous] = await Promise.all([
      getActiveTournament(),
      getPreviousTournaments(3),
    ]);
    return NextResponse.json({ active, previous });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch tournament" }, { status: 500 });
  }
}
