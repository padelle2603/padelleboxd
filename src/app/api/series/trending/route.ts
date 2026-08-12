import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trendingTv, posterUrl } from "@/lib/tmdb";

export async function GET() {
  const [trending, stats] = await Promise.all([
    trendingTv(),
    prisma.$transaction([
      prisma.user.count({ where: { role: { in: ["APPROVED", "ADMIN"] } } }),
      prisma.userSeries.count(),
      prisma.series.count(),
    ]),
  ]);

  return NextResponse.json({
    results: trending.map((tv) => ({
      tmdbId: tv.id,
      name: tv.name,
      overview: tv.overview,
      firstAirDate: tv.first_air_date,
      posterUrl: posterUrl(tv.poster_path),
      tmdbRating: tv.vote_average,
    })),
    stats: { members: stats[0], trackedSeries: stats[1], catalogSeries: stats[2] },
  });
}