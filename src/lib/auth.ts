import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "pb_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET ?? "padelleboxd-dev-secret";
  return new TextEncoder().encode(secret);
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

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? (await getRequestToken());
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  return await prisma.user.findUnique({ where: { id: session.sub } });
}

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