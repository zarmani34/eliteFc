"use client";
// components/admin/AdminNav.tsx
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin/setup",    label: "Setup" },
  { href: "/admin/draw",     label: "Draw" },
  { href: "/admin/fixtures", label: "Fixtures" },
  { href: "/admin/records",  label: "Records" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-[58px] bg-[#06080b]/90 backdrop-blur-md border-b border-[#1e2e40] flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-black md:tracking-[4px] text-[#c6f135] text-sm uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>
            ELITE FALCONS FC
          </Link>
          <span className="text-[#3a5568] text-xs">Admin</span>
          <nav className="hidden sm:flex gap-1">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  pathname === href
                    ? "bg-[#c6f135] text-[#0a0e04]"
                    : "text-[#8aaabb] hover:text-[#ddeeff] hover:bg-[#131d28]"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="text-[#8aaabb] hover:text-red-400 text-xs font-semibold transition-colors uppercase tracking-wider"
        >
          Logout
        </button>
      </header>

      <div className="sm:hidden fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
        <div className="relative w-full max-w-[340px]">
          {mobileOpen && (
            <div className="absolute bottom-[60px] left-0 right-0 rounded-2xl border border-[#1e2e40] bg-[#0b1118]/95 backdrop-blur-md p-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <nav className="grid grid-cols-2 gap-2">
                {LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                      pathname === href
                        ? "bg-[#c6f135] text-[#0a0e04]"
                        : "bg-[#131d28] text-[#8aaabb] hover:text-[#ddeeff]"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle admin navigation"
            className="w-full rounded-full bg-[#c6f135] text-[#0a0e04] py-3 text-xs font-black uppercase tracking-[0.18em] shadow-[0_12px_30px_rgba(198,241,53,0.35)]"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {mobileOpen ? "Close Menu" : "Admin Menu"}
          </button>
        </div>
      </div>
    </>
  );
}
