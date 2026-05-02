"use client";
// components/gala/ConfigPanel.tsx
import { useState } from "react";
import { useTournament, getFormat } from "@/context/TournamentContext";

interface ConfigPanelProps {
  onGoToFixtures: () => void;
}

export default function ConfigPanel({ onGoToFixtures }: ConfigPanelProps) {
  const { state, setConfig, applyConfig, addPlayer, resetAll } = useTournament();
  const { cfg, groups } = state;

  const [playerName, setPlayerName] = useState<string>("");
  const [error, setError]           = useState<string>("");

  const totalPlayers = groups.flatMap((g) => g.slots.filter(Boolean)).length;
  const needed       = cfg.teams * cfg.ppt;
  const pct          = needed > 0 ? Math.min(100, Math.round((totalPlayers / needed) * 100)) : 0;
  const isFull       = totalPlayers >= needed;
  const fmt          = getFormat(cfg.teams);

  function handleAddPlayer(): void {
    const name = playerName.trim();
    if (!name) return;

    const all = groups.flatMap((g) => g.slots.filter(Boolean)) as string[];
    if (all.includes(name)) {
      setError(`"${name}" is already in the pool.`);
      setTimeout(() => setError(""), 2500);
      setPlayerName("");
      return;
    }
    if (isFull) {
      setError("All slots are full!");
      setTimeout(() => setError(""), 2500);
      return;
    }

    addPlayer(name);
    setPlayerName("");
    setError("");
  }

  function handleTeamsChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const val = Math.min(8, Math.max(5, parseInt(e.target.value) || 6));
    applyConfig(val, cfg.ppt);
  }

  function handlePptChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const val = Math.min(11, Math.max(2, parseInt(e.target.value) || 8));
    applyConfig(cfg.teams, val);
  }

  return (
    <aside className="w-[300px] shrink-0 bg-[#0f1620] border-l border-[#1e2e40] sticky top-0 h-[calc(100vh-58px)] overflow-y-auto flex flex-col gap-5 p-5">

      {/* ── Tournament Config ── */}
      <section className="border-b border-[#1e2e40] pb-5">
        <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold mb-3">
          Tournament Config
        </p>

        <div className="mb-3">
          <label className="block text-[11px] uppercase tracking-wider text-[#8aaabb] mb-1 font-semibold">
            Edition / Month Name
          </label>
          <input
            type="text"
            value={cfg.month}
            onChange={(e) => setConfig("month", e.target.value)}
            placeholder="e.g. May 2025 Gala"
            className="w-full bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#c6f135] transition-colors"
          />
        </div>

        <div className="mb-3">
          <label className="block text-[11px] uppercase tracking-wider text-[#8aaabb] mb-1 font-semibold">
            Number of Teams (5–8)
          </label>
          <input
            type="number"
            value={cfg.teams}
            min={5}
            max={8}
            onChange={handleTeamsChange}
            className="w-full bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#c6f135] transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#8aaabb] mb-1 font-semibold">
            Players per Team
          </label>
          <input
            type="number"
            value={cfg.ppt}
            min={2}
            max={11}
            onChange={handlePptChange}
            className="w-full bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#c6f135] transition-colors"
          />
        </div>
      </section>

      {/* ── Add Player ── */}
      <section className="border-b border-[#1e2e40] pb-5">
        <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold mb-3">
          Add Player
        </p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
            placeholder="Player name…"
            className="flex-1 bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#c6f135] transition-colors"
          />
          <button
            onClick={handleAddPlayer}
            className="bg-[#c6f135] text-[#060a02] font-bold text-sm px-4 rounded-lg hover:bg-[#d8ff40] transition-colors shrink-0"
          >
            Add
          </button>
        </div>

        {error && <p className="text-[#ffc53d] text-xs mb-2">{error}</p>}

        {/* Progress bar */}
        <div className="bg-[#1e2e40] rounded-full h-1.5 overflow-hidden mb-1.5">
          <div
            className="h-full bg-[#c6f135] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#8aaabb]">
          <span>{totalPlayers} players added</span>
          <span>Need {needed}</span>
        </div>
      </section>

      {/* ── Format Preview ── */}
      <section className="border-b border-[#1e2e40] pb-5">
        <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold mb-2">
          Format
        </p>
        <p className="text-sm text-[#8aaabb] leading-relaxed">
          <span className="text-[#c6f135] font-semibold">
            {cfg.teams} teams × {cfg.ppt} players
          </span>
          <br />
          {fmt.desc}
        </p>
      </section>

      {/* ── Actions ── */}
      <section className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-widest text-[#8aaabb] font-semibold mb-1">
          Actions
        </p>
        <button
          onClick={onGoToFixtures}
          disabled={!isFull}
          className="w-full bg-[#ffc53d] text-[#0a0600] font-bold text-sm py-2.5 rounded-lg hover:bg-[#ffd060] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate Fixtures →
        </button>
        <button
          onClick={() => { if (confirm("Reset everything?")) resetAll(); }}
          className="w-full bg-transparent border border-[#243650] text-[#8aaabb] font-semibold text-sm py-2.5 rounded-lg hover:border-[#c6f135] hover:text-[#c6f135] transition-colors"
        >
          ↺ Reset All
        </button>
      </section>

    </aside>
  );
}
