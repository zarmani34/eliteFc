"use client";
// components/public/sections.tsx
// All public-facing landing page sections.

import { useState } from "react";
import StatusBadge from "@/components/shared/StatusBadge";
import GroupCard from "@/components/shared/GroupCard";
import StandingsTable from "@/components/shared/StandingsTable";
import type { ActiveTournament, ArchivedTournament } from "@/types/tournament";

// ── HERO ─────────────────────────────────────────────────

export function HeroSection({ tournament }: { tournament: ActiveTournament }) {
  return (
    <section className="relative py-20 px-6 text-center overflow-hidden">
      {/* Pitch glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(198,241,53,0.06),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <p className="text-[11px] uppercase tracking-[4px] text-[#8aaabb] mb-3 font-semibold">
          Elite Fc Monthly Gala Match
        </p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
          {tournament.name}
        </h1>
        <p className="text-[#8aaabb] text-lg mb-5">{tournament.month}</p>
        <StatusBadge status={tournament.status} />
        <div className="mt-6 flex justify-center gap-6 text-sm text-[#8aaabb]">
          <span><strong className="text-[#c6f135]">{tournament.players.length}</strong> Players</span>
          <span><strong className="text-[#c6f135]">{tournament.teams}</strong> Teams</span>
          <span><strong className="text-[#c6f135]">{tournament.ppt}</strong> per Team</span>
        </div>
      </div>
    </section>
  );
}

// ── REGISTER ─────────────────────────────────────────────

export function RegisterSection({ tournament }: { tournament: ActiveTournament }) {
  const [name, setName]       = useState("");
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!tournament.registrationOpen) return null;

  async function handleRegister() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/tournament/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus("success");
      setMessage(`✅ ${trimmed} registered! Your name will appear below.`);
      setName("");
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Registration failed");
      setTimeout(() => setStatus("idle"), 4000);
    }
  }

  return (
    <section className="py-10 px-6 max-w-lg mx-auto">
      <h2 className="text-center text-sm uppercase tracking-widest text-[#8aaabb] font-semibold mb-4">
        Register to Play
      </h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          placeholder="Enter your name…"
          className="flex-1 bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c6f135] transition-colors"
        />
        <button
          onClick={handleRegister}
          disabled={status === "loading"}
          className="bg-[#c6f135] text-[#060a02] font-bold text-sm px-6 rounded-lg hover:bg-[#d8ff40] transition-colors disabled:opacity-50 shrink-0"
        >
          {status === "loading" ? "…" : "Join"}
        </button>
      </div>
      {status !== "idle" && (
        <p className={`text-sm mt-3 text-center ${status === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message}
        </p>
      )}
    </section>
  );
}

// ── PLAYERS ──────────────────────────────────────────────

export function PlayersSection({ players }: { players: string[] }) {
  return (
    <section className="py-10 px-6 max-w-4xl mx-auto">
      <h2 className="text-sm uppercase tracking-widest text-[#8aaabb] font-semibold mb-5 text-center">
        Registered Players — <span className="text-[#c6f135]">{players.length}</span>
      </h2>
      {players.length === 0 ? (
        <p className="text-center text-[#3a5568] text-sm">No players registered yet.</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {players.map((p, i) => (
            <span
              key={i}
              className="bg-[#131d28] border border-[#1e2e40] text-[#ddeeff] text-sm font-medium px-4 py-2 rounded-full"
            >
              {p}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

// ── GROUP TABLES ─────────────────────────────────────────

export function GroupTablesSection({ tournament }: { tournament: ActiveTournament }) {
  const { groups, teams, ppt, status } = tournament;

  // Before draw: show empty shells
  const displayGroups = groups.length > 0
    ? groups
    : Array.from({ length: teams }, (_, i) => ({
        label: String.fromCharCode(65 + i),
        color: ["#f87171","#60a5fa","#4ade80","#facc15","#c084fc","#fb923c","#34d399","#f472b6"][i],
        slots: Array<null>(ppt).fill(null),
      }));

  return (
    <section className="py-10 px-6 max-w-5xl mx-auto">
      <h2 className="text-sm uppercase tracking-widest text-[#8aaabb] font-semibold mb-1 text-center">
        Group Tables
      </h2>
      <p className="text-center text-[#3a5568] text-xs mb-6">
        {status === "registration" || status === "drawn" && groups.length === 0
          ? "Teams will be assigned after the draw."
          : status === "drawn"
          ? "Draw complete — teams assigned!"
          : ""}
      </p>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        {displayGroups.map((g) => (
          <GroupCard key={g.label} group={g} showEmpty />
        ))}
      </div>
    </section>
  );
}

// ── STANDINGS ────────────────────────────────────────────

export function StandingsSection({ tournament }: { tournament: ActiveTournament }) {
  if (tournament.status !== "ongoing" && tournament.status !== "completed") return null;
  if (!tournament.fixtures.length) return null;

  return (
    <section className="py-10 px-6 max-w-3xl mx-auto">
      <h2 className="text-sm uppercase tracking-widest text-[#8aaabb] font-semibold mb-5 text-center">
        Live Standings
      </h2>
      <StandingsTable
        groups={tournament.groups}
        fixtures={tournament.fixtures}
        teams={tournament.teams}
      />
    </section>
  );
}

// ── PREVIOUS MONTHS ──────────────────────────────────────

export function PreviousMonthsSection({ previous }: { previous: ArchivedTournament[] }) {
  if (!previous.length) return null;

  return (
    <section className="py-10 px-6 max-w-5xl mx-auto">
      <h2 className="text-sm uppercase tracking-widest text-[#8aaabb] font-semibold mb-6 text-center">
        Previous Months
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {previous.map((t) => (
          <div key={t.id} className="bg-[#131d28] border border-[#1e2e40] rounded-xl overflow-hidden">
            <div className="bg-gradient-to-br from-[#0a1e10] to-[#0c1525] border-b border-[#1e2e40] px-5 py-4">
              <p className="text-[#c6f135] font-bold tracking-widest text-sm uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>
                🏆 {t.name}
              </p>
              <p className="text-[11px] text-[#8aaabb] mt-0.5">{t.month}</p>
            </div>
            <div className="px-5 py-4 space-y-1">
              <p className="text-sm mb-2">
                Champion: <strong className="text-[#ffc53d]">{t.record.champion}</strong>
              </p>
              {t.record.awards.map((a, i) => (
                <p key={i} className="text-xs text-[#4ade80]">
                  🏅 <span className="font-semibold text-[#ddeeff]">{a.label}:</span> {a.player}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
