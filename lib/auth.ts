// lib/auth.ts
// Simple password-based admin auth using an httpOnly cookie.
// The password lives in ADMIN_PASSWORD env variable.

import { cookies } from "next/headers";

const COOKIE_NAME = "gala_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export function getAdminPassword(): string {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) throw new Error("ADMIN_PASSWORD env variable is not set");
  return pwd;
}

export function checkPassword(input: string): boolean {
  return input === getAdminPassword();
}

export async function setAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return session?.value === "authenticated";
}
