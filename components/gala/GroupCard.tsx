"use client";
// components/gala/GroupCard.tsx
import { useEffect, useRef } from "react";
import { useTournament } from "@/context/TournamentContext";
import type { Group } from "@/types/gala";

interface GroupCardProps {
  group: Group;
  groupIdx: number;
  highlightSlot?: number | null;
}

export default function GroupCard({ group, groupIdx, highlightSlot }: GroupCardProps) {
  const { removePlayer } = useTournament();
  const slotRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Pop-in animation for the most recently filled slot
  useEffect(() => {
    if (highlightSlot == null) return;
    const el = slotRefs.current[highlightSlot];
    if (!el) return;
    el.classList.add("scale-95", "opacity-0");
    requestAnimationFrame(() => {
      el.classList.remove("scale-95", "opacity-0");
      el.classList.add("transition-all", "duration-300");
    });
  }, [highlightSlot, group.slots]);

  const filled = group.slots.filter(Boolean).length;
  const total  = group.slots.length;
  const isFull = filled === total;

  return (
    <div
      className="rounded-xl overflow-hidden border border-[#1e2e40] bg-[#131d28] transition-shadow hover:shadow-lg"
      style={{ boxShadow: isFull ? `0 0 0 1px ${group.color}55` : undefined }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center justify-between border-b-2"
        style={{ background: `${group.color}14`, borderBottomColor: group.color }}
      >
        <span
          className="font-bold tracking-widest text-sm uppercase"
          style={{ color: group.color }}
        >
          Team {group.label}
        </span>
        <span className="text-[11px] text-[#8aaabb]">
          {filled}/{total}
        </span>
      </div>

      {/* Slots */}
      <div>
        {group.slots.map((name, si) => (
          <div
            key={si}
            ref={(el) => { slotRefs.current[si] = el; }}
            className="flex items-center gap-2 px-4 py-2 min-h-[38px] border-b border-[#ffffff08] last:border-0 group/slot"
          >
            <span className="text-[11px] text-[#3a5568] font-semibold w-5 shrink-0">
              {si + 1}
            </span>

            {name ? (
              <>
                <span
                  className="flex-1 text-sm font-semibold truncate"
                  style={{ color: group.color }}
                >
                  {name}
                </span>
                <button
                  onClick={() => removePlayer(groupIdx, si)}
                  className="text-[#3a5568] hover:text-[#ff5263] text-base leading-none opacity-0 group-hover/slot:opacity-100 transition-all"
                  title="Remove player"
                >
                  ×
                </button>
              </>
            ) : (
              <span className="text-xs text-[#3a5568] italic flex-1">— empty —</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
