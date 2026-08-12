import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be at most 24 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, _ and -"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { username, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email: normalizedEmail }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Username or email is already taken" },
      { status: 409 }
    );
  }

  const passwordHash = hashPassword(password);
  await prisma.user.create({
    data: {
      username,
      email: normalizedEmail,
      passwordHash,
      role: "PENDING",
    },
  });

  return NextResponse.json(
    { message: "Account created. Waiting for an administrator to approve it." },
    { status: 201 }
  );
}