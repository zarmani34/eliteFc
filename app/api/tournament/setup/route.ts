// app/api/tournament/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import {
  createTournament,
  closeRegistration,
  openRegistration,
} from '@/lib/tournament.server';

// POST — create a new tournament (admin only)
// Body: { name, month, teams, ppt, force?: boolean }
// If force is omitted and an in-progress tournament exists,
// returns 409 with { error: "CONFIRM_REQUIRED", status: "ongoing"|"drawn" }
// so the client can show a warning and resubmit with force: true.
export async function POST(req: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, month, teams, ppt, force } = await req.json();
    if (!name || !month || !teams || !ppt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createTournament(
      String(name),
      String(month),
      Number(teams),
      Number(ppt),
      Boolean(force)
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to create tournament';

    // CONFIRM_REQUIRED — in-progress tournament found, need user confirmation
    if (message.startsWith('CONFIRM_REQUIRED:')) {
      const previousStatus = message.split(':')[1];
      return NextResponse.json(
        { error: 'CONFIRM_REQUIRED', previousStatus },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH — toggle registration open/closed (admin only)
export async function PATCH(req: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { open } = await req.json();
    if (open) {
      await openRegistration();
    } else {
      await closeRegistration();
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to update registration';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}