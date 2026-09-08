import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { getUserSeriesOr404 } from "@/lib/series-entries";
import { notifyWatchChanged } from "@/lib/revalidate";

type Ctx = RouteContext<
  "/api/me/series/[tmdbId]/seasons/[seasonNumber]/episodes/[episodeNumber]"
>;

export const PATCH = withUser(async (req, ctx: Ctx, user) => {
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
    return jsonError("Invalid series, season or episode number");
  }

  const body = await req.json().catch(() => null);
  const watched = body?.watched === true || body?.watched === false ? body.watched : null;
  if (watched === null) {
    return jsonError("Invalid input");
  }
  const seasonEpisodeCount =
    typeof body?.seasonEpisodeCount === "number" && Number.isInteger(body.seasonEpisodeCount)
      ? body.seasonEpisodeCount
      : null;

  const found = await getUserSeriesOr404(user.id, seriesId);
  if (!found.ok) return found.response;

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
    notifyWatchChanged(user, seriesId);
    return NextResponse.json({ watched: true });
  }

  await prisma.episodeWatch.deleteMany({
    where: { userId: user.id, seriesId, seasonNumber: season, episodeNumber: episode },
  });
  await prisma.seasonWatch.deleteMany({
    where: { userId: user.id, seriesId, seasonNumber: season },
  });
  notifyWatchChanged(user, seriesId);
  return NextResponse.json({ watched: false });
});
