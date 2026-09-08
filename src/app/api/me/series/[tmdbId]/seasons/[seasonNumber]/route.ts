import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withUser } from "@/lib/auth";
import { getSeasonEpisodes } from "@/lib/tmdb";
import { jsonError } from "@/lib/http";
import { getUserSeriesOr404 } from "@/lib/series-entries";
import { notifyWatchChanged } from "@/lib/revalidate";

type Ctx = RouteContext<"/api/me/series/[tmdbId]/seasons/[seasonNumber]">;

export const PATCH = withUser(async (req, ctx: Ctx, user) => {
  const { tmdbId, seasonNumber } = await ctx.params;
  const seriesId = Number(tmdbId);
  const season = Number(seasonNumber);
  if (!Number.isInteger(seriesId) || !Number.isInteger(season) || season < 0) {
    return jsonError("Invalid series id or season number");
  }

  const body = await req.json().catch(() => null);
  const watched = body?.watched === true || body?.watched === false ? body.watched : null;
  if (watched === null) {
    return jsonError("Invalid input");
  }

  const found = await getUserSeriesOr404(user.id, seriesId);
  if (!found.ok) return found.response;

  if (watched) {
    const entry = await prisma.seasonWatch.upsert({
      where: {
        userId_seriesId_seasonNumber: { userId: user.id, seriesId, seasonNumber: season },
      },
      update: {},
      create: { userId: user.id, seriesId, seasonNumber: season },
    });

    let episodesWatched = 0;
    try {
      const episodes = await getSeasonEpisodes(seriesId, season);
      if (episodes.length > 0) {
        await prisma.episodeWatch.createMany({
          data: episodes.map((ep) => ({
            userId: user.id,
            seriesId,
            seasonNumber: season,
            episodeNumber: ep.episode_number,
          })),
          skipDuplicates: true,
        });
        episodesWatched = episodes.length;
      }
    } catch {
      // best effort: even if TMDB is unreachable the season is marked watched
    }

    notifyWatchChanged(user, seriesId);

    return NextResponse.json({
      entry,
      episodesWatched,
    });
  }

  await prisma.seasonWatch.deleteMany({
    where: { userId: user.id, seriesId, seasonNumber: season },
  });
  await prisma.episodeWatch.deleteMany({
    where: { userId: user.id, seriesId, seasonNumber: season },
  });
  notifyWatchChanged(user, seriesId);
  return NextResponse.json({ unwatched: true });
});
