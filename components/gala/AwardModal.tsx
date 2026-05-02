"use client";
// components/gala/AwardModal.tsx
import { useState, useEffect } from "react";
import { useTournament, getFormat } from "@/context/TournamentContext";
import { saveRecord } from "@/lib/firebase";
import type { Award, MonthRecord } from "@/types/gala";

interface AwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (record: MonthRecord) => void;
}

const DEFAULT_AWARDS: string[] = [
  "Player of the Tournament",
  "Top Scorer",
  "Best Goalkeeper",
  "Best Team",
];

export default function AwardModal({ isOpen, onClose, onSaved }: AwardModalProps) {
  const { state, calcStandings } = useTournament();
  const { knockout, groups, fixtures, cfg } = state;

  const [champion, setChampion] = useState<string>("");
  const [awards, setAwards]     = useState<Award[]>([]);
  const [saving, setSaving]     = useState<boolean>(false);

  // Auto-fill champion when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fin = knockout.find((f) => f.stage === "final" && f.played);
    let champ  = "TBD";
    if (fin) {
      champ =
        Number(fin.hg) > Number(fin.ag)
          ? fin.home
          : Number(fin.ag) > Number(fin.hg)
          ? fin.away
          : `${fin.home} / ${fin.away}`;
    }
    setChampion(champ);
    setAwards(DEFAULT_AWARDS.map((label) => ({ label, player: "" })));
  }, [isOpen, knockout]);

  function addAward(): void {
    setAwards((prev) => [...prev, { label: "", player: "" }]);
  }

  function updateAward(i: number, key: keyof Award, val: string): void {
    setAwards((prev) => prev.map((a, idx) => (idx === i ? { ...a, [key]: val } : a)));
  }

  function removeAward(i: number): void {
    setAwards((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      const fmt    = getFormat(cfg.teams);
      let tIdx     = 0;
      const standingsSnap = fmt.groups.flatMap((count) => {
        const labels: string[] = [];
        for (let i = 0; i < count; i++) {
          if (tIdx < groups.length) labels.push(groups[tIdx++].label);
        }
        return calcStandings(labels, fixtures).slice(0, 3);
      });

      const record: Omit<MonthRecord, "id" | "createdAt"> = {
        month:     cfg.month || "Unnamed Edition",
        champion,
        awards:    awards.filter((a) => a.label && a.player),
        standings: standingsSnap,
        date:      new Date().toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric",
        }),
      };

      await saveRecord(record);
      onSaved(record);
      onClose();
    } catch (err) {
      console.error("Failed to save record:", err);
      alert("Failed to save. Check your Firebase config.");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#131d28] border border-[#243650] rounded-2xl p-6 w-full max-w-lg max-h-[88vh] overflow-y-auto">

        <h3
          className="text-[#ffc53d] font-bold tracking-widest text-xl uppercase mb-5"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          🏆 Save Results
        </h3>

        {/* Champion */}
        <div className="mb-4">
          <label className="block text-[11px] uppercase tracking-wider text-[#8aaabb] mb-1 font-semibold">
            Champion
          </label>
          <input
            type="text"
            value={champion}
            onChange={(e) => setChampion(e.target.value)}
            className="w-full bg-[#0a1018] border border-[#243650] text-[#c6f135] font-bold rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#c6f135] transition-colors"
          />
        </div>

        {/* Awards */}
        <p className="text-[11px] uppercase tracking-wider text-[#8aaabb] font-semibold mb-3">
          Awards
        </p>
        <div className="space-y-2 mb-3">
          {awards.map((aw, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div>
                {i === 0 && (
                  <label className="block text-[10px] text-[#8aaabb] mb-1 uppercase tracking-wider">
                    Award
                  </label>
                )}
                <input
                  type="text"
                  value={aw.label}
                  onChange={(e) => updateAward(i, "label", e.target.value)}
                  placeholder="e.g. Top Scorer"
                  className="w-full bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c6f135] transition-colors"
                />
              </div>
              <div>
                {i === 0 && (
                  <label className="block text-[10px] text-[#8aaabb] mb-1 uppercase tracking-wider">
                    Player
                  </label>
                )}
                <input
                  type="text"
                  value={aw.player}
                  onChange={(e) => updateAward(i, "player", e.target.value)}
                  placeholder="Player name"
                  className="w-full bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c6f135] transition-colors"
                />
              </div>
              <button
                onClick={() => removeAward(i)}
                className="bg-[#ff5263]/20 text-[#ff5263] hover:bg-[#ff5263]/40 rounded-lg px-3 py-2 text-sm font-bold transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addAward}
          className="text-[#8aaabb] hover:text-[#c6f135] text-sm font-semibold border border-[#243650] hover:border-[#c6f135] rounded-lg px-3 py-1.5 transition-colors mb-5"
        >
          + Add Award
        </button>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#ffc53d] text-[#0a0600] font-bold text-sm py-2.5 rounded-lg hover:bg-[#ffd060] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save to Records"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-transparent border border-[#243650] text-[#8aaabb] font-semibold text-sm py-2.5 rounded-lg hover:border-[#c6f135] hover:text-[#c6f135] transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
