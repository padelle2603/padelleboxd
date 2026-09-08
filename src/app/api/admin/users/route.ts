import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { parseJsonBody, jsonError } from "@/lib/http";

const actionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT", "PROMOTE"]),
});

export const GET = withAdmin(async (req) => {
  const onlyPending = req.nextUrl.searchParams.get("pending") === "true";
  const users = await prisma.user.findMany({
    where: onlyPending ? { role: "PENDING" } : {},
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ users });
});

export const POST = withAdmin(async (req, _ctx, admin) => {
  const body = await parseJsonBody(req, actionSchema);
  if (!body.ok) return body.response;

  const { userId, action } = body.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, role: true, createdAt: true },
  });
  if (!target) {
    return jsonError("User not found", 404);
  }

  if (action === "PROMOTE" && target.role === "ADMIN") {
    return jsonError("User is already an admin");
  }

  if (action !== "PROMOTE" && target.role === "ADMIN") {
    if (target.id === admin.id) {
      return jsonError("You cannot change your own admin role.");
    }
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return jsonError("Cannot demote the last remaining admin.");
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
});
