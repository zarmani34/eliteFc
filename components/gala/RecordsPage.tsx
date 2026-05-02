"use client";
// components/gala/RecordsPage.tsx
import { useEffect, useState } from "react";
import { fetchRecords } from "@/lib/firebase";
import type { MonthRecord } from "@/types/gala";

interface RecordsPageProps {
  newRecord?: MonthRecord | null;
}

export default function RecordsPage({ newRecord }: RecordsPageProps) {
  const [records, setRecords] = useState<MonthRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchRecords()
      .then(setRecords)
      .catch((err) => {
        console.error("Failed to load records:", err);
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Prepend a newly saved record immediately without re-fetching
  useEffect(() => {
    if (newRecord) {
      setRecords((prev) => [newRecord, ...prev]);
    }
  }, [newRecord]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#3a5568] text-sm p-8">
        Loading records…
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <h1
        className="text-[#c6f135] font-bold tracking-widest text-lg uppercase mb-5"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        Records — All-time History
      </h1>

      {records.length === 0 ? (
        <p className="text-[#3a5568] text-sm text-center py-16">
          No saved months yet.
        </p>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {records.map((r, i) => (
            <RecordCard key={r.id ?? i} record={r} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-component ──────────────────────────────────────────
interface RecordCardProps {
  record: MonthRecord;
}

function RecordCard({ record }: RecordCardProps) {
  return (
    <div className="bg-[#131d28] border border-[#1e2e40] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a1e10] to-[#0c1525] border-b border-[#1e2e40] px-5 py-4">
        <p
          className="text-[#c6f135] font-bold tracking-widest text-base uppercase"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          🏆 {record.month}
        </p>
        <p className="text-[11px] text-[#8aaabb] mt-0.5">{record.date}</p>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-1">
        <p className="text-sm mb-3">
          Champion:{" "}
          <span className="font-bold text-[#ffc53d]">{record.champion}</span>
        </p>

        {record.awards?.map((a, i) => (
          <p key={i} className="text-sm text-[#4ade80]">
            🏅 <span className="font-semibold text-[#ddeeff]">{a.label}:</span> {a.player}
          </p>
        ))}

        {record.standings?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#1e2e40]">
            <p className="text-[10px] uppercase tracking-widest text-[#3a5568] font-bold mb-2">
              Top Standings
            </p>
            {record.standings.map((s, i) => (
              <p
                key={i}
                className={`text-sm py-0.5 ${
                  i === 0 ? "text-[#ffc53d] font-bold" : "text-[#8aaabb]"
                }`}
              >
                {i + 1}. Team {s.label} — {s.Pts}pts
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
