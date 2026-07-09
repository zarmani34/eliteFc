"use client";
// components/admin/LiveMatchControl.tsx
import { useState } from "react";
import type { Fixture, LiveScore } from "@/types/tournament";

interface LiveMatchControlProps {
  fixture: Fixture;
  isLive: boolean;
  isKnockout: boolean;
  colorMap: Record<string, string>;
  liveScore: LiveScore | null;
  onRefresh: () => void;
}

export default function LiveMatchControl({
  fixture,
  isLive,
  isKnockout,
  colorMap,
  liveScore,
  onRefresh,
}: LiveMatchControlProps) {
  const [finalHg, setFinalHg]     = useState("");
  const [finalAg, setFinalAg]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [showPens, setShowPens]   = useState(false);
  const [penHome, setPenHome]     = useState("");
  const [penAway, setPenAway]     = useState("");

  const hColor = colorMap[fixture.home] ?? "#8aaabb";
  const aColor = colorMap[fixture.away] ?? "#8aaabb";

  async function post(body: object) {
    setLoading(true);
    try {
      await fetch("/api/tournament/live", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleSetLive() {
    await post({ action: "set", fixtureId: fixture.id });
  }

  async function handleClearLive() {
    await post({ action: "clear" });
  }

  async function handleScoreUpdate(newHg: number, newAg: number) {
    const score: LiveScore = {
      hg: newHg,
      ag: newAg,
      isPenalties: liveScore?.isPenalties ?? false,
      penalties: liveScore?.penalties ?? null,
    };
    await post({ action: "score", ...score });
  }

  async function handleTogglePenalties() {
    const entering = !(liveScore?.isPenalties ?? false);
    const score: LiveScore = {
      hg: liveScore?.hg ?? 0,
      ag: liveScore?.ag ?? 0,
      isPenalties: entering,
      penalties: entering ? { home: 0, away: 0 } : null,
    };
    await post({ action: "score", ...score });
    setShowPens(entering);
  }

  async function handlePenScoreUpdate(newHome: number, newAway: number) {
    const score: LiveScore = {
      hg: liveScore?.hg ?? 0,
      ag: liveScore?.ag ?? 0,
      isPenalties: true,
      penalties: { home: newHome, away: newAway },
    };
    await post({ action: "score", ...score });
  }

  async function handleEndMatch() {
    if (finalHg === "" || finalAg === "") return;
    const penalties =
      showPens && penHome !== "" && penAway !== ""
        ? { home: Number(penHome), away: Number(penAway) }
        : null;
    await post({
      action: "end",
      fixtureId: fixture.id,
      hg: Number(finalHg),
      ag: Number(finalAg),
      isKnockout,
      penalties,
    });
    setFinalHg(""); setFinalAg("");
    setPenHome(""); setPenAway("");
    setShowPens(false);
  }

  // ── COMPLETED ─────────────────────────────────────────
  if (fixture.played) {
    const hasPens = fixture.penalties != null;
    return (
      <div className="flex items-center gap-2 bg-[#0f1822] border border-[#1e2e40] rounded-xl px-3 py-2.5 mb-1.5 opacity-75">
        <span className="flex-1 text-xs font-semibold truncate" style={{ color: hColor }}>
          {fixture.home}
        </span>
        <div className="flex flex-col items-center shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-black text-white">{fixture.hg}</span>
            <span className="text-[#3a5568] font-bold text-xs mx-0.5">—</span>
            <span className="text-sm font-black text-white">{fixture.ag}</span>
          </div>
          {hasPens && (
            <span className="text-[9px] text-[#ffc53d] font-bold">
              ({fixture.penalties!.home}–{fixture.penalties!.away}) pens
            </span>
          )}
        </div>
        <span className="flex-1 text-xs font-semibold truncate text-right" style={{ color: aColor }}>
          {fixture.away}
        </span>
        <span className="text-[#c6f135] text-xs ml-1 shrink-0">✓</span>
      </div>
    );
  }

  // ── LIVE NOW ───────────────────────────────────────────
  if (isLive) {
    const currentHg  = liveScore?.hg ?? 0;
    const currentAg  = liveScore?.ag ?? 0;
    const isPens     = liveScore?.isPenalties ?? false;
    const pensHome   = liveScore?.penalties?.home ?? 0;
    const pensAway   = liveScore?.penalties?.away ?? 0;

    return (
      <div className="bg-[#131d28] border-2 border-red-500/60 rounded-xl p-4 mb-1.5">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest">
              {isPens ? "Penalties" : "Live"}
            </span>
          </div>
          <button onClick={handleClearLive} disabled={loading}
            className="text-[#3a5568] hover:text-red-400 text-[10px] transition-colors">
            Clear
          </button>
        </div>

        {/* Score ticker */}
        <div className="flex items-center justify-between gap-1 mb-3">
          {/* Home */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold truncate mb-1.5" style={{ color: hColor }}>
              {fixture.home}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => handleScoreUpdate(Math.max(0, currentHg - 1), currentAg)}
                disabled={loading || currentHg === 0}
                className="w-9 h-9 rounded-lg bg-[#1e2e40] active:bg-[#243650] text-[#ddeeff] font-bold text-xl flex items-center justify-center disabled:opacity-30 touch-manipulation">
                −
              </button>
              <span className="text-2xl font-black text-white w-8 text-center tabular-nums">
                {currentHg}
              </span>
              <button onClick={() => handleScoreUpdate(currentHg + 1, currentAg)}
                disabled={loading}
                className="w-9 h-9 rounded-lg bg-[#c6f135] active:bg-[#d8ff40] text-[#060a02] font-bold text-xl flex items-center justify-center disabled:opacity-50 touch-manipulation">
                +
              </button>
            </div>
          </div>

          <span className="text-[#3a5568] font-bold text-lg shrink-0 mx-1">:</span>

          {/* Away */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold truncate mb-1.5 text-right" style={{ color: aColor }}>
              {fixture.away}
            </p>
            <div className="flex items-center gap-1 justify-end">
              <button onClick={() => handleScoreUpdate(currentHg, Math.max(0, currentAg - 1))}
                disabled={loading || currentAg === 0}
                className="w-9 h-9 rounded-lg bg-[#1e2e40] active:bg-[#243650] text-[#ddeeff] font-bold text-xl flex items-center justify-center disabled:opacity-30 touch-manipulation">
                −
              </button>
              <span className="text-2xl font-black text-white w-8 text-center tabular-nums">
                {currentAg}
              </span>
              <button onClick={() => handleScoreUpdate(currentHg, currentAg + 1)}
                disabled={loading}
                className="w-9 h-9 rounded-lg bg-[#c6f135] active:bg-[#d8ff40] text-[#060a02] font-bold text-xl flex items-center justify-center disabled:opacity-50 touch-manipulation">
                +
              </button>
            </div>
          </div>
        </div>

        {/* Penalty shootout section — knockout only */}
        {isKnockout && (
          <div className="mb-3">
            <button onClick={handleTogglePenalties} disabled={loading}
              className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition-colors border ${
                isPens
                  ? "bg-[#ffc53d]/20 border-[#ffc53d]/40 text-[#ffc53d]"
                  : "bg-transparent border-[#1e2e40] text-[#3a5568] hover:border-[#ffc53d]/40 hover:text-[#ffc53d]"
              }`}>
              {isPens ? "⚽ Penalties in progress" : "+ Penalty Shootout"}
            </button>

            {isPens && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1">
                  <p className="text-[9px] text-[#8aaabb] mb-1 truncate">{fixture.home}</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handlePenScoreUpdate(Math.max(0, pensHome - 1), pensAway)}
                      disabled={loading || pensHome === 0}
                      className="w-8 h-8 rounded-lg bg-[#1e2e40] text-[#ddeeff] font-bold flex items-center justify-center text-lg disabled:opacity-30 touch-manipulation">
                      −
                    </button>
                    <span className="text-lg font-black text-[#ffc53d] w-7 text-center">{pensHome}</span>
                    <button onClick={() => handlePenScoreUpdate(pensHome + 1, pensAway)}
                      disabled={loading}
                      className="w-8 h-8 rounded-lg bg-[#ffc53d]/30 text-[#ffc53d] font-bold flex items-center justify-center text-lg disabled:opacity-50 touch-manipulation">
                      +
                    </button>
                  </div>
                </div>
                <span className="text-[#3a5568] font-bold shrink-0">–</span>
                <div className="flex-1">
                  <p className="text-[9px] text-[#8aaabb] mb-1 text-right truncate">{fixture.away}</p>
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => handlePenScoreUpdate(pensHome, Math.max(0, pensAway - 1))}
                      disabled={loading || pensAway === 0}
                      className="w-8 h-8 rounded-lg bg-[#1e2e40] text-[#ddeeff] font-bold flex items-center justify-center text-lg disabled:opacity-30 touch-manipulation">
                      −
                    </button>
                    <span className="text-lg font-black text-[#ffc53d] w-7 text-center">{pensAway}</span>
                    <button onClick={() => handlePenScoreUpdate(pensHome, pensAway + 1)}
                      disabled={loading}
                      className="w-8 h-8 rounded-lg bg-[#ffc53d]/30 text-[#ffc53d] font-bold flex items-center justify-center text-lg disabled:opacity-50 touch-manipulation">
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* End match */}
        <div className="border-t border-[#1e2e40] pt-3">
          <p className="text-[10px] uppercase tracking-widest text-[#3a5568] font-bold mb-2">
            Final score to end match
          </p>
          <div className="flex items-center gap-2">
            <input type="number" value={finalHg} min={0}
              onChange={(e) => setFinalHg(e.target.value)}
              placeholder={String(currentHg)}
              className="w-14 text-center bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg py-2 text-sm outline-none focus:border-[#c6f135] transition-colors"
            />
            <span className="text-[#8aaabb] font-bold shrink-0">:</span>
            <input type="number" value={finalAg} min={0}
              onChange={(e) => setFinalAg(e.target.value)}
              placeholder={String(currentAg)}
              className="w-14 text-center bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg py-2 text-sm outline-none focus:border-[#c6f135] transition-colors"
            />
            <button onClick={handleEndMatch}
              disabled={loading || finalHg === "" || finalAg === ""}
              className="cursor-pointer flex-1 bg-[#c6f135] text-[#060a02] font-bold text-xs py-2.5 rounded-lg hover:bg-[#d8ff40] active:bg-[#c6f135] transition-colors disabled:opacity-40 touch-manipulation">
              {loading ? "…" : "✓ End Match"}
            </button>
          </div>

          {/* Penalty final scores */}
          {isKnockout && (showPens || isPens) && (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-[10px] text-[#ffc53d] font-bold shrink-0">Pens:</p>
              <input type="number" value={penHome} min={0}
                onChange={(e) => setPenHome(e.target.value)}
                placeholder={String(pensHome)}
                className="w-12 text-center bg-[#0a1018] border border-[#ffc53d]/30 text-[#ffc53d] rounded-lg py-1.5 text-xs outline-none focus:border-[#ffc53d]"
              />
              <span className="text-[#3a5568] font-bold text-xs shrink-0">–</span>
              <input type="number" value={penAway} min={0}
                onChange={(e) => setPenAway(e.target.value)}
                placeholder={String(pensAway)}
                className="w-12 text-center bg-[#0a1018] border border-[#ffc53d]/30 text-[#ffc53d] rounded-lg py-1.5 text-xs outline-none focus:border-[#ffc53d]"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── UPCOMING ───────────────────────────────────────────
  return (
    <div className="flex items-center gap-2 bg-[#0d1520] border border-[#1e2e40] border-dashed rounded-xl px-3 py-3 mb-1.5 group/row">
      <span className="flex-1 text-xs font-semibold truncate" style={{ color: hColor }}>
        {fixture.home}
      </span>
      <span className="text-[#3a5568] text-[10px] font-bold shrink-0">vs</span>
      <span className="flex-1 text-xs font-semibold truncate text-right" style={{ color: aColor }}>
        {fixture.away}
      </span>
      <button onClick={handleSetLive} disabled={loading}
        className="bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-red-500/30 active:bg-red-500/40 transition-colors shrink-0 opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 touch-manipulation"
        style={{ opacity: undefined }}
        onTouchStart={(e) => e.currentTarget.style.opacity = "1"}
      >
        {loading ? "…" : "▶ Live"}
      </button>
    </div>
  );
}