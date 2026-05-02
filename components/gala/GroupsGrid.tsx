"use client";
// components/gala/GroupsGrid.tsx
import { useTournament } from "@/context/TournamentContext";
import GroupCard from "./GroupCard";

interface GroupsGridProps {
  onGoToFixtures: () => void;
}

export default function GroupsGrid({ onGoToFixtures }: GroupsGridProps) {
  const { state } = useTournament();
  const { groups, cfg } = state;

  const totalPlayers = groups.flatMap((g) => g.slots.filter(Boolean)).length;
  const needed       = cfg.teams * cfg.ppt;
  const isFull       = totalPlayers >= needed;

  if (!groups.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#3a5568] text-sm p-8">
        Configure settings in the panel to get started.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5">

      {/* Canvas Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1
            className="text-[#c6f135] font-bold tracking-widest text-lg uppercase"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {cfg.month || "Tournament Setup"}
          </h1>
          <p className="text-sm text-[#8aaabb] mt-0.5">
            {totalPlayers} of {needed} players assigned
          </p>
        </div>

        {isFull && (
          <button
            onClick={onGoToFixtures}
            className="bg-[#ffc53d] text-[#0a0600] font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-[#ffd060] transition-colors"
          >
            Generate Fixtures →
          </button>
        )}
      </div>

      {/* Groups Grid */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
      >
        {groups.map((group, gi) => (
          <GroupCard
            key={group.label}
            group={group}
            groupIdx={gi}
          />
        ))}
      </div>

      {!isFull && (
        <p className="text-center text-[#3a5568] text-xs mt-6">
          Add {needed - totalPlayers} more player{needed - totalPlayers !== 1 ? "s" : ""} to unlock fixtures
        </p>
      )}
    </div>
  );
}
