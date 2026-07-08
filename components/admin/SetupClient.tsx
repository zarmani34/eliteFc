"use client";
// components/admin/SetupClient.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/shared/StatusBadge";
import type { ActiveTournament } from "@/types/tournament";

interface SetupClientProps {
  initialTournament: ActiveTournament | null;
}

export default function SetupClient({ initialTournament }: SetupClientProps) {
  const router = useRouter();
  const [tournament] = useState<ActiveTournament | null>(initialTournament);

  const [form, setForm] = useState({ name: "", month: "", teams: "6", ppt: "8" });
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");
  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    previousStatus: string;
  }>({ show: false, previousStatus: "" });

  const [newPlayer, setNewPlayer]       = useState("");
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError]   = useState("");

  // Show create form when there's no tournament OR the current one is completed
  const showCreateForm = !tournament || tournament.status === "completed";

  async function handleCreate(force = false) {
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/tournament/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, force }),
      });
      const data = await res.json();

      if (res.status === 409 && data.error === "CONFIRM_REQUIRED") {
        setConfirmState({ show: true, previousStatus: data.previousStatus });
        return;
      }
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleConfirmOverwrite() {
    setConfirmState({ show: false, previousStatus: "" });
    await handleCreate(true);
  }

  async function toggleRegistration(open: boolean) {
    await fetch("/api/tournament/setup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open }),
    });
    router.refresh();
  }

  async function addPlayer() {
    const name = newPlayer.trim();
    if (!name) return;
    setPlayerLoading(true);
    setPlayerError("");
    try {
      const res = await fetch("/api/tournament/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewPlayer("");
      router.refresh();
    } catch (err: unknown) {
      setPlayerError(err instanceof Error ? err.message : "Failed to add player");
    } finally {
      setPlayerLoading(false);
    }
  }

  async function removePlayer(name: string) {
    await fetch("/api/tournament/players", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    router.refresh();
  }

  // ── CREATE FORM ───────────────────────────────────────────
  if (showCreateForm) {
    return (
      <>
        {confirmState.show && (
          <ConfirmOverwriteModal
            previousStatus={confirmState.previousStatus}
            onConfirm={handleConfirmOverwrite}
            onCancel={() => setConfirmState({ show: false, previousStatus: "" })}
          />
        )}

        {tournament?.status === "completed" && (
          <div className="bg-[#0a1e10] border border-emerald-800/40 rounded-2xl p-5 mb-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-emerald-400 text-sm font-semibold">
                🏆 {tournament.name} is completed and archived.
              </p>
              <p className="text-[#8aaabb] text-xs mt-0.5">
                Start a new month below.
              </p>
            </div>
            <StatusBadge status={tournament.status} />
          </div>
        )}

        <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#8aaabb] mb-5">
            {tournament?.status === "completed" ? "New Month" : "Create Tournament"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {[
              { label: "Tournament Name", key: "name", placeholder: "e.g. June 2025 Gala", type: "text" },
              { label: "Month",           key: "month", placeholder: "e.g. June 2025",      type: "text" },
              { label: "Number of Teams (5–8)", key: "teams", placeholder: "6", type: "number" },
              { label: "Players per Team",      key: "ppt",   placeholder: "8", type: "number" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="block text-[11px] uppercase tracking-wider text-[#8aaabb] mb-1.5 font-semibold">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#c6f135] transition-colors"
                />
              </div>
            ))}
          </div>
          {createError && (
            <p className="text-red-400 text-xs mb-3">{createError}</p>
          )}
          <button
            onClick={() => handleCreate(false)}
            disabled={creating || !form.name || !form.month}
            className="bg-[#c6f135] text-[#060a02] font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#d8ff40] transition-colors disabled:opacity-40"
          >
            {creating ? "Creating…" : "Create Tournament"}
          </button>
        </div>
      </>
    );
  }

  // ── ACTIVE TOURNAMENT ─────────────────────────────────────
  const needed = tournament.teams * tournament.ppt;

  return (
    <>
      {confirmState.show && (
        <ConfirmOverwriteModal
          previousStatus={confirmState.previousStatus}
          onConfirm={handleConfirmOverwrite}
          onCancel={() => setConfirmState({ show: false, previousStatus: "" })}
        />
      )}

      <div className="space-y-5">
        {/* Tournament info card */}
        <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-[#ddeeff]">{tournament.name}</h2>
              <p className="text-[#8aaabb] text-sm">
                {tournament.month} · {tournament.teams} teams · {tournament.ppt} per team
              </p>
            </div>
            <StatusBadge status={tournament.status} />
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            {tournament.registrationOpen ? (
              <button
                onClick={() => toggleRegistration(false)}
                className="bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Close Registration
              </button>
            ) : tournament.status === "registration" ? (
              <button
                onClick={() => toggleRegistration(true)}
                className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors"
              >
                Re-open Registration
              </button>
            ) : null}
          </div>
        </div>

        {/* Player registration card */}
        <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-[#ddeeff]">Player Registration</p>
            <span className="text-sm text-[#8aaabb]">
              <span className="text-[#c6f135] font-bold">{tournament.players.length}</span>/{needed}
            </span>
          </div>

          <div className="bg-[#1e2e40] rounded-full h-2 overflow-hidden mb-4">
            <div
              className="h-full bg-[#c6f135] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (tournament.players.length / needed) * 100)}%` }}
            />
          </div>

          {tournament.status === "registration" && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                placeholder="Add player name…"
                className="flex-1 bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#c6f135] transition-colors"
              />
              <button
                onClick={addPlayer}
                disabled={playerLoading}
                className="bg-[#c6f135] text-[#060a02] font-bold text-sm px-5 rounded-lg hover:bg-[#d8ff40] transition-colors disabled:opacity-50 shrink-0"
              >
                Add
              </button>
            </div>
          )}

          {playerError && <p className="text-red-400 text-xs mb-3">{playerError}</p>}

          <div className="flex flex-wrap gap-2">
            {tournament.players.map((p) => (
              <div
                key={p}
                className="flex items-center gap-1.5 bg-[#0a1018] border border-[#243650] text-[#ddeeff] text-sm px-3 py-1.5 rounded-full group"
              >
                <span>{p}</span>
                <button
                  onClick={() => removePlayer(p)}
                  className="text-[#3a5568] hover:text-red-400 text-base leading-none opacity-0 group-hover:opacity-100 transition-all"
                >
                  ×
                </button>
              </div>
            ))}
            {tournament.players.length === 0 && (
              <p className="text-[#3a5568] text-sm">No players yet.</p>
            )}
          </div>
        </div>

        {/* Ready for draw */}
        {tournament.players.length >= needed && tournament.status === "registration" && (
          <div className="bg-[#0a1e10] border border-emerald-800/40 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-emerald-400 text-sm font-semibold">
              All {needed} players registered. Ready for the draw!
            </p>
            <a
              href="/admin/draw"
              className="bg-[#c6f135] text-[#060a02] font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#d8ff40] transition-colors shrink-0"
            >
              Go to Draw →
            </a>
          </div>
        )}
      </div>
    </>
  );
}

// ── Confirmation Modal ────────────────────────────────────

function ConfirmOverwriteModal({
  previousStatus,
  onConfirm,
  onCancel,
}: {
  previousStatus: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isOngoing = previousStatus === "ongoing";
  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#131d28] border border-[#243650] rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-[#ffc53d] font-black tracking-widest text-lg uppercase mb-3">
          Tournament In Progress
        </h3>
        <p className="text-[#8aaabb] text-sm mb-2 leading-relaxed">
          The current tournament is still{" "}
          <span className="text-[#ddeeff] font-semibold">
            {isOngoing ? "ongoing (matches being played)" : "in the draw stage"}
          </span>.
        </p>
        <p className="text-[#8aaabb] text-sm mb-5 leading-relaxed">
          Creating a new tournament will{" "}
          <span className="text-[#ffc53d] font-semibold">
            auto-archive the current one as-is
          </span>{" "}
          without a champion or awards. Continue?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#ffc53d] text-[#0a0600] font-bold text-sm py-2.5 rounded-lg hover:bg-[#ffd060] transition-colors"
          >
            Yes, archive & create new
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-[#243650] text-[#8aaabb] font-semibold text-sm py-2.5 rounded-lg hover:border-[#c6f135] hover:text-[#c6f135] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}