import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireActiveUser } from "@/lib/auth";

type Ctx = {
  params: Promise<{
    tmdbId: string;
    seasonNumber: string;
    episodeNumber: string;
  }>;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const { tmdbId, seasonNumber, episodeNumber } = await ctx.params;
  const seriesId = Number(tmdbId);
  const season = Number(seasonNumber);
  const episode = Number(episodeNumber);
  if (
    !Number.isInteger(seriesId) ||
    !Number.isInteger(season) ||
    season < 0 ||
    !Number.isInteger(episode) ||
    episode < 1
  ) {
    return NextResponse.json({ error: "Invalid series, season or episode number" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const watched = body?.watched === true || body?.watched === false ? body.watched : null;
  if (watched === null) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const seasonEpisodeCount =
    typeof body?.seasonEpisodeCount === "number" && Number.isInteger(body.seasonEpisodeCount)
      ? body.seasonEpisodeCount
      : null;

  const existing = await prisma.userSeries.findUnique({
    where: { userId_seriesId: { userId: user.id, seriesId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Series is not in your list" }, { status: 404 });
  }

  if (watched) {
    await prisma.episodeWatch.upsert({
      where: {
        userId_seriesId_seasonNumber_episodeNumber: {
          userId: user.id,
          seriesId,
          seasonNumber: season,
          episodeNumber: episode,
        },
      },
      update: {},
      create: { userId: user.id, seriesId, seasonNumber: season, episodeNumber: episode },
    });

    if (seasonEpisodeCount != null && episode >= seasonEpisodeCount) {
      await prisma.seasonWatch.upsert({
        where: {
          userId_seriesId_seasonNumber: { userId: user.id, seriesId, seasonNumber: season },
        },
        update: {},
        create: { userId: user.id, seriesId, seasonNumber: season },
      });
    }
    return NextResponse.json({ watched: true });
  }

  await prisma.episodeWatch.deleteMany({
    where: { userId: user.id, seriesId, seasonNumber: season, episodeNumber: episode },
  });
  await prisma.seasonWatch.deleteMany({
    where: { userId: user.id, seriesId, seasonNumber: season },
  });
  return NextResponse.json({ watched: false });
}