"use client";
// components/admin/AdminNav.tsx
import Link from "next/link";
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

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  return (
    <header className="sticky top-0 z-30 h-[58px] bg-[#06080b]/90 backdrop-blur-md border-b border-[#1e2e40] flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-black tracking-[4px] text-[#c6f135] text-sm uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>
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
  );
}
