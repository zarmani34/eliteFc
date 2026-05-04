// app/admin/fixtures/page.tsx
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getActiveTournament } from "@/lib/tournament.server";
import AdminNav from "@/components/admin/AdminNav";
import FixturesClient from "@/components/admin/FixturesClient";

export default async function FixturesPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin");

  const active = await getActiveTournament();
  if (!active) redirect("/admin/setup");

  return (
    <>
      <AdminNav />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-black tracking-widest text-[#c6f135] uppercase mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
          Fixtures
        </h1>
        <p className="text-[#8aaabb] text-sm mb-8">Generate matches and enter scores.</p>
        <FixturesClient tournament={active} />
      </div>
    </>
  );
}
