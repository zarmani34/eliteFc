// app/admin/setup/page.tsx
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getActiveTournament } from "@/lib/tournament.server";
import AdminNav from "@/components/admin/AdminNav";
import SetupClient from "@/components/admin/SetupClient";

export default async function SetupPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin");

  const active = await getActiveTournament();

  return (
    <>
      <AdminNav />
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-28 sm:pb-8">
        <h1 className="text-2xl font-black tracking-widest text-[#c6f135] uppercase mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
          Setup
        </h1>
        <p className="text-[#8aaabb] text-sm mb-8">Create a new tournament edition and manage player registrations.</p>
        <SetupClient initialTournament={active} />
      </div>
    </>
  );
}
