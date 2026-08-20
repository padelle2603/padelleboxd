import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "pb_session";
const MAX_AGE = 60 * 60 * 24 * 30;
const DEV_FALLBACK_SECRET = "padelleboxd-dev-secret";
const MIN_SECRET_LENGTH = 16;

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === "change-me-to-a-long-random-string") {
      throw new Error(
        "SESSION_SECRET is not configured. Set a long random value before starting in production."
      );
    }
    if (secret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `SESSION_SECRET is too short (${secret.length} chars). Use at least ${MIN_SECRET_LENGTH} random characters.`
      );
    }
    return new TextEncoder().encode(secret);
  }

  return new TextEncoder().encode(secret || DEV_FALLBACK_SECRET);
}

export async function createSessionToken(user: {
  id: string;
  username: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ username: user.username, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

export async function getRequestToken(): Promise<string | null> {
  const h = await headers();
  const auth = h.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    return token || null;
  }
  return null;
}

export const getCurrentUser = cache(async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? (await getRequestToken());
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  return await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, username: true, role: true },
  });
});

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function isActiveUser(user: CurrentUser | null): boolean {
  return user?.role === "APPROVED" || user?.role === "ADMIN";
}

export function adminAllowedIps(): string[] {
  return (process.env.ADMIN_ALLOWED_IPS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function requestIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return h.get("x-real-ip")?.trim() ?? null;
}

export async function isAdminRequestAllowed(
  role: string | undefined | null
): Promise<boolean> {
  if (role !== "ADMIN") return false;
  const ips = adminAllowedIps();
  if (ips.length === 0) return true;
  const ip = await requestIp();
  return ip !== null && ips.includes(ip);
}

export type AuthResult<T> = { ok: true; user: T } | { ok: false; response: NextResponse };

export async function requireActiveUser(): Promise<AuthResult<CurrentUser>> {
  const user = await getCurrentUser();
  if (!isActiveUser(user)) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, user: user! };
}

export async function requireAdmin(): Promise<AuthResult<CurrentUser>> {
  const user = await getCurrentUser();
  if (!(await isAdminRequestAllowed(user?.role))) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, user: user! };
}