// app/live/page.tsx
// Server component shell — renders the LiveSession client component
// which subscribes to Firestore in real time.

import LiveSession from "@/components/public/LiveSession";
import { getActiveTournament } from "@/lib/tournament.server";

export default async function LivePage() {
  // Load initial data server-side for fast first paint
  const initial = await getActiveTournament();

  return (
    <main className="min-h-screen bg-[#06080b] text-[#ddeeff]">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(198,241,53,0.05) 0%, transparent 60%),
            repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(198,241,53,0.012) 80px, rgba(198,241,53,0.012) 81px),
            repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(198,241,53,0.008) 80px, rgba(198,241,53,0.008) 81px)
          `,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-[#1e2e40] bg-[#06080b]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="font-black tracking-[4px] text-[#c6f135] text-sm uppercase"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                FC Gala
              </a>
              <span className="text-[#3a5568] text-xs">·</span>
              <span className="text-[#8aaabb] text-xs font-semibold uppercase tracking-wider">
                Live Session
              </span>
            </div>
            {/* Live pulse indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                Live
              </span>
            </div>
          </div>
        </header>

        <LiveSession initial={initial} />
      </div>
    </main>
  );
}