// app/api/tournament/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createTournament, closeRegistration, openRegistration } from '@/lib/tournament.server';
import { DEFAULT_TEAM_NAMES } from '@/lib/format';

export async function POST(req: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, month, teams, ppt, teamNames, force } = await req.json();
    if (!name || !month || !teams || !ppt)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const n = Number(teams);

    // Use provided names or fall back to defaults, sliced to team count
    const resolvedNames: string[] = Array.from({ length: n }, (_, i) =>
      (teamNames?.[i] as string | undefined)?.trim() ||
      DEFAULT_TEAM_NAMES[i] ||
      `Team ${i + 1}`
    );

    const result = await createTournament(
      String(name), String(month), n, Number(ppt),
      resolvedNames, Boolean(force)
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create tournament';
    if (message.startsWith('CONFIRM_REQUIRED:')) {
      return NextResponse.json(
        { error: 'CONFIRM_REQUIRED', previousStatus: message.split(':')[1] },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { open } = await req.json();
    open ? await openRegistration() : await closeRegistration();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}