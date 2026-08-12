import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdminRequestAllowed } from "@/lib/auth";

const actionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT", "PROMOTE"]),
});

async function denyUnlessAdmin(): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  return (await isAdminRequestAllowed(user?.role))
    ? null
    : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET(req: NextRequest) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;

  const onlyPending = req.nextUrl.searchParams.get("pending") === "true";
  const users = await prisma.user.findMany({
    where: onlyPending ? { role: "PENDING" } : {},
    select: { id: true, username: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { userId, action } = parsed.data;

  if (action === "PROMOTE") {
    const target = await prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json({ user: target });
  }

  const role = action === "APPROVE" ? "APPROVED" : "REJECTED";
  const target = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, username: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user: target });
}