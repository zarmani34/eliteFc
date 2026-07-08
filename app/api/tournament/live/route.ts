// app/api/tournament/live/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { setLiveMatch, endLiveMatch, updateLiveScore } from '@/lib/tournament.server';
import type { LiveScore } from '@/types/tournament';

export async function PATCH(req: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    // { action: "set", fixtureId: number }
    if (body.action === 'set') {
      if (body.fixtureId === undefined)
        return NextResponse.json({ error: 'fixtureId required' }, { status: 400 });
      await setLiveMatch(body.fixtureId);
      return NextResponse.json({ success: true });
    }

    // { action: "clear" }
    if (body.action === 'clear') {
      await setLiveMatch(null);
      return NextResponse.json({ success: true });
    }

    // { action: "score", hg, ag, isPenalties?, penalties? }
    if (body.action === 'score') {
      const { hg, ag, isPenalties, penalties } = body;
      if (hg === undefined || ag === undefined)
        return NextResponse.json({ error: 'hg and ag required' }, { status: 400 });
      const score: LiveScore = {
        hg: Number(hg),
        ag: Number(ag),
        isPenalties: Boolean(isPenalties),
        penalties: penalties ?? null,
      };
      await updateLiveScore(score);
      return NextResponse.json({ success: true });
    }

    // { action: "end", fixtureId, hg, ag, isKnockout, penalties? }
    if (body.action === 'end') {
      const { fixtureId, hg, ag, isKnockout, penalties } = body;
      if (fixtureId === undefined || hg === undefined || ag === undefined)
        return NextResponse.json({ error: 'fixtureId, hg and ag required' }, { status: 400 });
      await endLiveMatch(
        Number(fixtureId),
        Number(hg),
        Number(ag),
        Boolean(isKnockout),
        penalties ?? null
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}