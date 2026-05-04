"use client";
import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import {
  HeroSection,
  RegisterSection,
  PlayersSection,
  GroupTablesSection,
  StandingsSection,
  PreviousMonthsSection,
} from "./sections";
import type { ActiveTournament, ArchivedTournament } from "@/types/tournament";

export default function LiveTournament({
  initial,
  previous,
}: {
  initial: ActiveTournament;
  previous: ArchivedTournament[];
}) {
  const [tournament, setTournament] = useState<ActiveTournament>(initial);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(getDb(), "tournaments", "active"),
      (snap) => {
        if (snap.exists()) {
          setTournament({ id: snap.id, ...snap.data() } as ActiveTournament);
        }
      }
    );
    return () => unsub();
  }, []);

  return (
    <div className="divide-y divide-[#1e2e40]/50">
      <HeroSection tournament={tournament} />
      <RegisterSection tournament={tournament} />
      <PlayersSection players={tournament.players} />
      <GroupTablesSection tournament={tournament} />
      <StandingsSection tournament={tournament} />
      <PreviousMonthsSection previous={previous} />
    </div>
  );
}