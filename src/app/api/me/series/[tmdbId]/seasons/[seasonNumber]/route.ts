import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isActiveUser } from "@/lib/auth";

type Ctx = { params: Promise<{ tmdbId: string; seasonNumber: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!isActiveUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tmdbId, seasonNumber } = await ctx.params;
  const seriesId = Number(tmdbId);
  const season = Number(seasonNumber);
  if (!Number.isInteger(seriesId) || !Number.isInteger(season) || season < 0) {
    return NextResponse.json({ error: "Invalid series id or season number" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const watched = body?.watched === true || body?.watched === false ? body.watched : null;
  if (watched === null) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.userSeries.findUnique({
    where: { userId_seriesId: { userId: user!.id, seriesId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Series is not in your list" }, { status: 404 });
  }

  if (watched) {
    const entry = await prisma.seasonWatch.upsert({
      where: {
        userId_seriesId_seasonNumber: { userId: user!.id, seriesId, seasonNumber: season },
      },
      update: {},
      create: { userId: user!.id, seriesId, seasonNumber: season },
    });
    return NextResponse.json({ entry });
  }

  await prisma.seasonWatch.deleteMany({
    where: { userId: user!.id, seriesId, seasonNumber: season },
  });
  return NextResponse.json({ unwatched: true });
}