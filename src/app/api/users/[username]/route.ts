import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { posterUrl } from "@/lib/tmdb";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/users/[username]">) {
  const { username } = await ctx.params;

  const [user, seasonWatches, episodeWatches] = await Promise.all([
    prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        list: {
          include: { series: true },
          orderBy: { updatedAt: "desc" },
        },
      },
    }),
    prisma.seasonWatch.findMany({
      where: { user: { username } },
      select: { seriesId: true, seasonNumber: true },
    }),
    prisma.episodeWatch.findMany({
      where: { user: { username } },
      select: { seriesId: true, seasonNumber: true, episodeNumber: true },
    }),
  ]);

  if (!user || user.role === "PENDING" || user.role === "REJECTED") {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const seasonsBySeries = new Map<number, number[]>();
  for (const w of seasonWatches) {
    const list = seasonsBySeries.get(w.seriesId) ?? [];
    list.push(w.seasonNumber);
    seasonsBySeries.set(w.seriesId, list);
  }

  const episodesBySeries = new Map<number, string[]>();
  for (const w of episodeWatches) {
    const list = episodesBySeries.get(w.seriesId) ?? [];
    list.push(`${w.seasonNumber}:${w.episodeNumber}`);
    episodesBySeries.set(w.seriesId, list);
  }

  const entries = user.list.map((e) => ({
    status: e.status,
    rating: e.rating,
    updatedAt: e.updatedAt,
    watchedSeasons: (seasonsBySeries.get(e.seriesId) ?? []).sort((a, b) => a - b),
    watchedEpisodes: (episodesBySeries.get(e.seriesId) ?? []).sort((a, b) => {
      const [as, ae] = a.split(":").map(Number);
      const [bs, be] = b.split(":").map(Number);
      return as - bs || ae - be;
    }),
    series: {
      tmdbId: e.series.tmdbId,
      name: e.series.name,
      posterUrl: posterUrl(e.series.posterPath),
      firstAirDate: e.series.firstAirDate,
      tmdbRating: e.series.tmdbRating,
    },
  }));

  return NextResponse.json({
    username: user.username,
    createdAt: user.createdAt,
    counts: {
      WATCHED: entries.filter((e) => e.status === "WATCHED").length,
      WATCHING: entries.filter((e) => e.status === "WATCHING").length,
      ABANDONED: entries.filter((e) => e.status === "ABANDONED").length,
      ON_HOLD: entries.filter((e) => e.status === "ON_HOLD").length,
      PLANNED: entries.filter((e) => e.status === "PLANNED").length,
    },
    entries,
  });
}