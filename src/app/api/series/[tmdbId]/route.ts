import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getTvDetails, posterUrl, backdropUrl } from "@/lib/tmdb";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/series/[tmdbId]">) {
  const { tmdbId } = await ctx.params;
  const id = Number(tmdbId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid series id" }, { status: 400 });
  }

  const [details, user, trackedBy] = await Promise.all([
    getTvDetails(id),
    getCurrentUser(),
    prisma.userSeries.findMany({
      where: { seriesId: id },
      include: { user: { select: { username: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  if (!details) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const myEntry = user ? trackedBy.find((t) => t.userId === user.id) ?? null : null;

  const myWatchedSeasons = user
    ? (
        await prisma.seasonWatch.findMany({
          where: { userId: user.id, seriesId: id },
          select: { seasonNumber: true },
        })
      ).map((w) => w.seasonNumber)
    : [];

  return NextResponse.json({
    details: {
      id: details.id,
      name: details.name,
      overview: details.overview,
      firstAirDate: details.first_air_date,
      posterUrl: posterUrl(details.poster_path, "w342"),
      backdropUrl: backdropUrl(details.backdrop_path),
      genres: details.genres ?? [],
      status: details.status,
      numberOfSeasons: details.number_of_seasons,
      numberOfEpisodes: details.number_of_episodes,
      tmdbRating: details.vote_average,
      tmdbVoteCount: details.vote_count,
      seasons:
        details.seasons?.map((s) => ({
          seasonNumber: s.season_number,
          episodeCount: s.episode_count,
          airDate: s.air_date,
          overview: s.overview,
        })) ?? [],
    },
    trackedCounts: {
      WATCHED: trackedBy.filter((t) => t.status === "WATCHED").length,
      WATCHING: trackedBy.filter((t) => t.status === "WATCHING").length,
      ABANDONED: trackedBy.filter((t) => t.status === "ABANDONED").length,
      ON_HOLD: trackedBy.filter((t) => t.status === "ON_HOLD").length,
      PLANNED: trackedBy.filter((t) => t.status === "PLANNED").length,
    },
    trackedBy: trackedBy.map((t) => ({
      username: t.user.username,
      status: t.status,
      rating: t.rating,
    })),
    myEntry: myEntry
      ? { status: myEntry.status, rating: myEntry.rating }
      : null,
    myWatchedSeasons,
  });
}