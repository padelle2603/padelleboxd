import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isActiveUser as requireUser } from "@/lib/auth";

const STATUSES = ["WATCHED", "WATCHING", "ABANDONED", "ON_HOLD", "PLANNED"] as const;

const updateSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    rating: z.number().int().min(1).max(10).nullable().optional(),
  })
  .refine((d) => d.status || d.rating !== undefined, "Nothing to update");

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/me/series/[tmdbId]">) {
  const user = await getCurrentUser();
  if (!requireUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tmdbId } = await ctx.params;
  const seriesId = Number(tmdbId);
  if (!Number.isInteger(seriesId)) {
    return NextResponse.json({ error: "Invalid series id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { status, rating } = parsed.data;

  const existing = await prisma.userSeries.findUnique({
    where: { userId_seriesId: { userId: user!.id, seriesId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Series is not in your list" }, { status: 404 });
  }

  const finalStatus = status ?? existing.status;
  const finalRating = status
    ? status === "PLANNED"
      ? null
      : (rating ?? existing.rating)
    : rating;

  if (finalRating != null && finalStatus === "PLANNED") {
    return NextResponse.json(
      { error: "You cannot rate a series in your planned list." },
      { status: 400 }
    );
  }

  const entry = await prisma.userSeries.update({
    where: { userId_seriesId: { userId: user!.id, seriesId } },
    data: { status: finalStatus, rating: finalRating },
  });

  return NextResponse.json({ entry });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/me/series/[tmdbId]">) {
  const user = await getCurrentUser();
  if (!requireUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tmdbId } = await ctx.params;
  const seriesId = Number(tmdbId);
  if (!Number.isInteger(seriesId)) {
    return NextResponse.json({ error: "Invalid series id" }, { status: 400 });
  }

  const existing = await prisma.userSeries.findUnique({
    where: { userId_seriesId: { userId: user!.id, seriesId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Series is not in your list" }, { status: 404 });
  }

  await prisma.userSeries.delete({
    where: { userId_seriesId: { userId: user!.id, seriesId } },
  });

  return NextResponse.json({ message: "Removed from your list" });
}