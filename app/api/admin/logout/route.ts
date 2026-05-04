// app/api/admin/logout/route.ts
import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/auth";

export async function POST() {
  await clearAdminCookie();
  return NextResponse.json({ success: true });
}
