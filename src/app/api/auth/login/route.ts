import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { hashPassword, verifyPassword, isLegacyHash } from "@/lib/password";

const loginSchema = z.object({
  identifier: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { identifier, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { username: identifier },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (isLegacyHash(user.passwordHash)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
  }

  if (user.role === "PENDING") {
    return NextResponse.json(
      { error: "Your account is still waiting for administrator approval." },
      { status: 403 }
    );
  }

  if (user.role === "REJECTED") {
    return NextResponse.json(
      { error: "Your account was not approved. Contact an administrator." },
      { status: 403 }
    );
  }

  const token = await createSessionToken(user);
  const response = NextResponse.json({
    user: { id: user.id, username: user.username, role: user.role },
    token,
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}