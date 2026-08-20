import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const actionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT", "PROMOTE"]),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const onlyPending = req.nextUrl.searchParams.get("pending") === "true";
  const users = await prisma.user.findMany({
    where: onlyPending ? { role: "PENDING" } : {},
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.user;

  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { userId, action } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, role: true, createdAt: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (action === "PROMOTE" && target.role === "ADMIN") {
    return NextResponse.json({ error: "User is already an admin" }, { status: 400 });
  }

  if (action !== "PROMOTE" && target.role === "ADMIN") {
    if (target.id === admin.id) {
      return NextResponse.json(
        { error: "You cannot change your own admin role." },
        { status: 400 }
      );
    }
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot demote the last remaining admin." },
        { status: 400 }
      );
    }
  }

  const role = action === "PROMOTE" ? "ADMIN" : action === "APPROVE" ? "APPROVED" : "REJECTED";
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, username: true, role: true, createdAt: true },
  });

  revalidatePath("/admin");
  revalidatePath(`/u/${updated.username}`);
  return NextResponse.json({ user: updated });
}
