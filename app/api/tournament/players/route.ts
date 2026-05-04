// app/api/tournament/players/route.ts
import { NextRequest, NextResponse } from "next/server";
import { addPlayer, removePlayer } from "@/lib/tournament.server";
import { isAdminAuthenticated } from "@/lib/auth";

// POST — add a player (public if registration is open, admin always)
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    await addPlayer(name.trim());
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add player";
    const status = message === "Registration is closed" ? 403
      : message === "Player already registered" ? 409
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE — remove a player (admin only)
export async function DELETE(req: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    await removePlayer(name.trim());
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to remove player";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
