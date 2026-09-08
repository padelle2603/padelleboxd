import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseJsonBody, jsonError } from "@/lib/http";
import { hashPassword } from "@/lib/password";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be at most 24 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, _ and -"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const body = await parseJsonBody(req, registerSchema);
  if (!body.ok) return body.response;

  const { username, password } = body.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return jsonError("Username is already taken", 409);
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: "PENDING",
    },
  });

  return NextResponse.json(
    { message: "Account created. Waiting for an administrator to approve it." },
    { status: 201 }
  );
}
