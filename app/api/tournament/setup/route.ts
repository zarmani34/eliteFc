// app/api/tournament/setup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  createTournament,
  closeRegistration,
  openRegistration,
} from "@/lib/tournament.server";

// POST — create a new tournament (admin only)
export async function POST(req: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, month, teams, ppt } = await req.json();
    if (!name || !month || !teams || !ppt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    await createTournament(name, month, Number(teams), Number(ppt));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create tournament";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH — toggle registration open/closed (admin only)
export async function PATCH(req: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { open } = await req.json();
    if (open) {
      await openRegistration();
    } else {
      await closeRegistration();
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update registration";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
