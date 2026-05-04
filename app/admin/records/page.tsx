// app/admin/records/page.tsx
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getPreviousTournaments } from "@/lib/tournament.server";
import AdminNav from "@/components/admin/AdminNav";

export default async function RecordsPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin");

  const records = await getPreviousTournaments(20);

  return (
    <>
      <AdminNav />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-black tracking-widest text-[#c6f135] uppercase mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
          Records
        </h1>
        <p className="text-[#8aaabb] text-sm mb-8">All completed tournament months.</p>

        {records.length === 0 ? (
          <p className="text-[#3a5568] text-center py-16">No completed months yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((r) => (
              <div key={r.id} className="bg-[#131d28] border border-[#1e2e40] rounded-xl overflow-hidden">
                <div className="bg-linear-to-br from-[#0a1e10] to-[#0c1525] border-b border-[#1e2e40] px-5 py-4">
                  <p className="text-[#c6f135] font-black tracking-widest text-sm uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>
                    🏆 {r.name}
                  </p>
                  <p className="text-[11px] text-[#8aaabb] mt-0.5">{r.month}</p>
                </div>
                <div className="px-5 py-4 space-y-1.5">
                  <p className="text-sm">
                    Champion: <strong className="text-[#ffc53d]">{r.record.champion}</strong>
                  </p>
                  {r.record.awards.map((a, i) => (
                    <p key={i} className="text-xs text-[#4ade80]">
                      🏅 <span className="font-semibold text-[#ddeeff]">{a.label}:</span> {a.player}
                    </p>
                  ))}
                  <div className="pt-2 border-t border-[#1e2e40] mt-2">
                    <p className="text-[10px] uppercase tracking-widest text-[#3a5568] font-bold mb-1.5">Top Standings</p>
                    {r.record.standings.slice(0, 3).map((s, i) => (
                      <p key={i} className={`text-xs py-0.5 ${i === 0 ? "text-[#ffc53d] font-bold" : "text-[#8aaabb]"}`}>
                        {i + 1}. Team {s.label} — {s.Pts}pts
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
