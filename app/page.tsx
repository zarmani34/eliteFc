// app/page.tsx
import LiveTournament from "@/components/public/LiveTournament";
import { PreviousMonthsSection } from "@/components/public/sections";
import { getActiveTournament, getPreviousTournaments } from "@/lib/tournament.server";
import Link from "next/link";

export const revalidate = 60;

export default async function LandingPage() {
  const [active, previous] = await Promise.all([
    getActiveTournament(),
    getPreviousTournaments(3),
  ]);

  if (!active) {
    return (
      <main className="min-h-screen bg-[#06080b] flex flex-col items-center justify-center text-center px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(198,241,53,0.04),transparent)] pointer-events-none" />
        <h1 className="text-3xl font-black text-[#c6f135] tracking-widest uppercase mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
          ELITE FC Gala
        </h1>
        <p className="text-[#8aaabb] text-sm">No active tournament. Check back soon.</p>
        {previous.length > 0 && (
          <div className="mt-12 w-full max-w-4xl">
            <PreviousMonthsSection previous={previous} />
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06080b] text-[#ddeeff]">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(198,241,53,0.012) 80px, rgba(198,241,53,0.012) 81px),
            repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(198,241,53,0.008) 80px, rgba(198,241,53,0.008) 81px)
          `,
        }}
      />

      <div className="relative z-10">
        <header className="border-b border-[#1e2e40] bg-[#06080b]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <span className="font-black tracking-[4px] text-[#c6f135] text-base uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>
              ELITEFC
            </span>
            <div className="flex items-center space-x-6">
              <Link href="/admin" className="text-[#8aaabb] hover:text-[#c6f135] text-xs font-semibold transition-colors uppercase tracking-wider">
                Admin →
              </Link>

              <Link href="/live" className="text-[#8aaabb] hover:text-[#c6f135] text-xs font-semibold transition-colors uppercase tracking-wider">
                Live Match
              </Link>
            </div>

          </div>
        </header>

        {/* LiveTournament handles all sections + real-time updates */}
        <LiveTournament initial={active} previous={previous} />

        <footer className="text-center py-8 text-[#3a5568] text-xs border-t border-[#1e2e40]">
          ELITE FC Gala Tournament Manager
        </footer>
      </div>
    </main>
  );
}