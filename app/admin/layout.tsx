// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { Syne, Outfit } from "next/font/google";
const syne = Syne({ subsets: ["latin"], weight: ["700","800"] });
const outfit = Outfit({ subsets: ["latin"], weight: ["300","400","500","600","700"] });
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The login page itself is at /admin — don't guard it
  // Guard is handled by checking auth on sub-routes (/admin/setup, etc.)
  // Layout wraps everything including login page, so we just render children.
  // Individual sub-pages check auth themselves via server-side redirect.
  return (
    <div className="min-h-screen bg-[#06080b] text-[#ddeeff]">
      {children}
    </div>
  );
}

// Helper used by all admin sub-pages to guard access
export async function requireAdmin() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin");
}
