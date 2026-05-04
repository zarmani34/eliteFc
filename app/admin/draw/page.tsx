// app/admin/draw/page.tsx
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";
import DrawClient from "@/components/admin/DrawClient";
import { getActiveTournament } from "@/lib/tournament.server";

export default async function DrawPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin");

  const active = await getActiveTournament();
  if (!active) redirect("/admin/setup");

  return (
    <>
      <AdminNav />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-black tracking-widest text-[#c6f135] uppercase mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
          Team Draw
        </h1>
        <p className="text-[#8aaabb] text-sm mb-8">Randomly assign players to teams.</p>
        <DrawClient tournament={active} />
      </div>
    </>
  );
}
