import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isActiveUser } from "@/lib/auth";
import { getSeasonEpisodes, stillUrl } from "@/lib/tmdb";

type Ctx = { params: Promise<{ tmdbId: string; seasonNumber: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { tmdbId, seasonNumber } = await ctx.params;
  const seriesId = Number(tmdbId);
  const season = Number(seasonNumber);
  if (!Number.isInteger(seriesId) || !Number.isInteger(season) || season < 0) {
    return NextResponse.json({ error: "Invalid series id or season number" }, { status: 400 });
  }

  const episodes = await getSeasonEpisodes(seriesId, season).catch(() => null);
  if (!episodes) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }

  const user = await getCurrentUser();
  const myWatchedEpisodes = user && isActiveUser(user)
    ? (
        await prisma.episodeWatch.findMany({
          where: { userId: user.id, seriesId: seriesId, seasonNumber: season },
          select: { episodeNumber: true },
        })
      ).map((w) => w.episodeNumber)
    : [];

  return NextResponse.json({
    seasonNumber: season,
    episodes: episodes.map((e) => ({
      id: e.id,
      name: e.name,
      overview: e.overview,
      seasonNumber: e.season_number,
      episodeNumber: e.episode_number,
      airDate: e.air_date,
      stillUrl: stillUrl(e.still_path),
    })),
    myWatchedEpisodes,
  });
}