"use client";
// components/admin/LiveMatchControl.tsx
import { useState } from "react";
import type { Fixture } from "@/types/tournament";

interface LiveMatchControlProps {
  fixture: Fixture;
  isLive: boolean;
  isKnockout: boolean;
  colorMap: Record<string, string>;
  onRefresh: () => void; // callback instead of router.refresh()
}

export default function LiveMatchControl({
  fixture,
  isLive,
  isKnockout,
  colorMap,
  onRefresh,
}: LiveMatchControlProps) {
  const [hg, setHg]           = useState<string>("");
  const [ag, setAg]           = useState<string>("");
  const [loading, setLoading] = useState(false);

  const hColor = colorMap[fixture.home] ?? "#8aaabb";
  const aColor = colorMap[fixture.away] ?? "#8aaabb";

  async function handleSetLive() {
    setLoading(true);
    await fetch("/api/tournament/live", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set", fixtureId: fixture.id }),
    });
    setLoading(false);
    onRefresh();
  }

  async function handleEndMatch() {
    if (hg === "" || ag === "") return;
    setLoading(true);
    await fetch("/api/tournament/live", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "end",
        fixtureId: fixture.id,
        hg: Number(hg),
        ag: Number(ag),
        isKnockout,
      }),
    });
    setLoading(false);
    setHg("");
    setAg("");
    onRefresh();
  }

  async function handleClearLive() {
    setLoading(true);
    await fetch("/api/tournament/live", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear" }),
    });
    setLoading(false);
    onRefresh();
  }

  // ── Completed ──
  if (fixture.played) {
    return (
      <div className="flex items-center gap-3 bg-[#0f1822] border border-[#1e2e40] rounded-xl px-4 py-3 mb-1.5 opacity-75">
        <span className="flex-1 text-sm font-semibold truncate" style={{ color: hColor }}>
          {fixture.home}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-lg font-black text-white">{fixture.hg}</span>
          <span className="text-[#3a5568] font-bold mx-1">—</span>
          <span className="text-lg font-black text-white">{fixture.ag}</span>
        </div>
        <span className="flex-1 text-sm font-semibold truncate text-right" style={{ color: aColor }}>
          {fixture.away}
        </span>
        <span className="text-[#c6f135] text-xs ml-2 shrink-0">✓</span>
      </div>
    );
  }

  // ── Live now ──
  // ── Live now ──
if (isLive) {
  return (
    <div className="bg-[#131d28] border-2 border-red-500/60 rounded-xl px-4 py-3 mb-1.5">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest">
          Live Now
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex-1 text-sm font-bold truncate" style={{ color: hColor }}>
          {fixture.home}
        </span>

        {/* Score inputs + +/- buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Home score */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const next = Math.max(0, Number(hg) - 1);
                setHg(String(next));
                fetch("/api/tournament/live", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "update", hg: next, ag: Number(ag) }),
                });
              }}
              className="w-6 h-6 rounded bg-[#1e2e40] text-[#8aaabb] font-bold text-sm hover:bg-[#243650] transition-colors"
            >−</button>
            <span className="w-8 text-center text-lg font-black text-white">
              {hg === "" ? "0" : hg}
            </span>
            <button
              onClick={() => {
                const next = Number(hg) + 1;
                setHg(String(next));
                fetch("/api/tournament/live", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "update", hg: next, ag: Number(ag) }),
                });
              }}
              className="w-6 h-6 rounded bg-[#1e2e40] text-[#c6f135] font-bold text-sm hover:bg-[#243650] transition-colors"
            >+</button>
          </div>

          <span className="text-[#8aaabb] font-bold">:</span>

          {/* Away score */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const next = Math.max(0, Number(ag) - 1);
                setAg(String(next));
                fetch("/api/tournament/live", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "update", hg: Number(hg), ag: next }),
                });
              }}
              className="w-6 h-6 rounded bg-[#1e2e40] text-[#8aaabb] font-bold text-sm hover:bg-[#243650] transition-colors"
            >−</button>
            <span className="w-8 text-center text-lg font-black text-white">
              {ag === "" ? "0" : ag}
            </span>
            <button
              onClick={() => {
                const next = Number(ag) + 1;
                setAg(String(next));
                fetch("/api/tournament/live", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "update", hg: Number(hg), ag: next }),
                });
              }}
              className="w-6 h-6 rounded bg-[#1e2e40] text-[#c6f135] font-bold text-sm hover:bg-[#243650] transition-colors"
            >+</button>
          </div>
        </div>

        <span className="flex-1 text-sm font-bold truncate text-right" style={{ color: aColor }}>
          {fixture.away}
        </span>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleEndMatch}
          disabled={loading}
          className="flex-1 bg-[#c6f135] text-[#060a02] font-bold text-xs py-2 rounded-lg hover:bg-[#d8ff40] transition-colors disabled:opacity-40"
        >
          {loading ? "Saving…" : "✓ End Match & Save Score"}
        </button>
        <button
          onClick={handleClearLive}
          disabled={loading}
          className="bg-transparent border border-[#243650] text-[#8aaabb] font-semibold text-xs px-3 py-2 rounded-lg hover:border-red-400 hover:text-red-400 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

  // ── Upcoming ──
  return (
    <div className="flex items-center gap-3 bg-[#0d1520] border border-[#1e2e40] border-dashed rounded-xl px-4 py-3 mb-1.5 group">
      <span className="flex-1 text-sm font-semibold truncate" style={{ color: hColor }}>
        {fixture.home}
      </span>
      <span className="text-[#3a5568] text-xs font-bold shrink-0">vs</span>
      <span className="flex-1 text-sm font-semibold truncate text-right" style={{ color: aColor }}>
        {fixture.away}
      </span>
      <button
        onClick={handleSetLive}
        disabled={loading}
        className="bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
      >
        {loading ? "…" : "▶ Set Live"}
      </button>
    </div>
  );
}