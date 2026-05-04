"use client";
// app/admin/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router                    = useRouter();
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  async function handleLogin() {
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("Invalid password");
      router.push("/admin/setup");
    } catch {
      setError("Incorrect password. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#06080b] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-[4px] text-[#c6f135] uppercase mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            Admin
          </h1>
          <p className="text-[#8aaabb] text-sm">FC Gala Tournament Manager</p>
        </div>

        <div className="bg-[#131d28] border border-[#1e2e40] rounded-2xl p-6">
          <div className="mb-4">
            <label className="block text-[11px] uppercase tracking-wider text-[#8aaabb] mb-2 font-semibold">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter admin password"
              className="w-full bg-[#0a1018] border border-[#243650] text-[#ddeeff] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c6f135] transition-colors"
              autoFocus
            />
          </div>

          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#c6f135] text-[#060a02] font-bold text-sm py-3 rounded-lg hover:bg-[#d8ff40] transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>

        <p className="text-center mt-4">
          <a href="/" className="text-[#8aaabb] hover:text-[#c6f135] text-xs transition-colors">
            ← Back to tournament
          </a>
        </p>
      </div>
    </div>
  );
}
