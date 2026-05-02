"use client";
// app/gala/page.tsx
import { useState } from "react";
import { TournamentProvider } from "@/context/TournamentContext";
import ConfigPanel from "@/components/gala/ConfigPanel";
import GroupsGrid from "@/components/gala/GroupsGrid";
import FixturesPage from "@/components/gala/FixturesPage";
import RecordsPage from "@/components/gala/RecordsPage";
import AwardModal from "@/components/gala/AwardModal";
import type { MonthRecord } from "@/types/gala";

type Tab = "setup" | "fixtures" | "records";

const TABS: Tab[] = ["setup", "fixtures", "records"];

export default function GalaPage() {
  return (
    <TournamentProvider>
      <GalaApp />
    </TournamentProvider>
  );
}

function GalaApp() {
  const [tab, setTab]           = useState<Tab>("setup");
  const [awardOpen, setAwardOpen] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<MonthRecord | null>(null);

  function goToFixtures(): void {
    setTab("fixtures");
  }

  function handleSaved(record: MonthRecord): void {
    setLastSaved(record);
    setTab("records");
  }

  return (
    <div className="min-h-screen bg-[#06080b] text-[#ddeeff] flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 h-[58px] bg-[#06080b]/90 backdrop-blur-md border-b border-[#1e2e40] flex items-center justify-between px-6 shrink-0">
        <div
          className="text-[#c6f135] font-bold tracking-[4px] text-lg uppercase"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          FC Gala
          <span className="text-[#8aaabb] font-normal text-[11px] tracking-widest ml-2 align-middle">
            Tournament
          </span>
        </div>

        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors ${
                tab === t
                  ? "bg-[#c6f135] text-[#0a0e04]"
                  : "text-[#8aaabb] hover:text-[#ddeeff] hover:bg-[#131d28]"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {tab === "setup" && (
          <>
            <GroupsGrid onGoToFixtures={goToFixtures} />
            <ConfigPanel onGoToFixtures={goToFixtures} />
          </>
        )}

        {tab === "fixtures" && (
          <FixturesPage onOpenAwardModal={() => setAwardOpen(true)} />
        )}

        {tab === "records" && (
          <RecordsPage newRecord={lastSaved} />
        )}

      </div>

      {/* ── Award Modal ── */}
      <AwardModal
        isOpen={awardOpen}
        onClose={() => setAwardOpen(false)}
        onSaved={handleSaved}
      />

    </div>
  );
}
