import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { parseJsonBody, jsonError } from "@/lib/http";
import { hashPassword, verifyPassword, isLegacyHash } from "@/lib/password";

const loginSchema = z.object({
  identifier: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

export async function POST(req: NextRequest) {
  const body = await parseJsonBody(req, loginSchema);
  if (!body.ok) return body.response;

  const { identifier, password } = body.data;
  const user = await prisma.user.findUnique({
    where: { username: identifier },
  });

  if (!user) {
    return jsonError("Invalid credentials", 401);
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return jsonError("Invalid credentials", 401);
  }

  if (isLegacyHash(user.passwordHash)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
  }

  if (user.role === "PENDING") {
    return jsonError("Your account is still waiting for administrator approval.", 403);
  }

  if (user.role === "REJECTED") {
    return jsonError("Your account was not approved. Contact an administrator.", 403);
  }

  const token = await createSessionToken(user);
  const response = NextResponse.json({
    user: { id: user.id, username: user.username, role: user.role },
    token,
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
