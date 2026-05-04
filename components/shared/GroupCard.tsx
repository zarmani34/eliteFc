"use client";
// components/shared/GroupCard.tsx
import type { Group } from "@/types/tournament";

interface GroupCardProps {
  group: Group;
  showEmpty?: boolean; // show empty slots as placeholders
}

export default function GroupCard({ group, showEmpty = true }: GroupCardProps) {
  const filled = group.slots.filter(Boolean).length;
  const total  = group.slots.length;

  return (
    <div
      className="rounded-xl overflow-hidden border border-[#1e2e40] bg-[#131d28]"
      style={{ boxShadow: filled === total ? `0 0 0 1px ${group.color}44` : undefined }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center justify-between border-b-2"
        style={{ background: `${group.color}14`, borderBottomColor: group.color }}
      >
        <span className="font-bold tracking-widest text-sm uppercase" style={{ color: group.color }}>
          Team {group.label}
        </span>
        <span className="text-[11px] text-[#8aaabb]">{filled}/{total}</span>
      </div>

      {/* Slots */}
      <div>
        {group.slots.map((name, si) => (
          <div
            key={si}
            className="flex items-center gap-2 px-4 py-2 min-h-[36px] border-b border-[#ffffff06] last:border-0"
          >
            <span className="text-[11px] text-[#3a5568] font-semibold w-5 shrink-0">{si + 1}</span>
            {name ? (
              <span className="text-sm font-semibold truncate" style={{ color: group.color }}>
                {name}
              </span>
            ) : showEmpty ? (
              <span className="text-xs text-[#3a5568] italic">— waiting —</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
