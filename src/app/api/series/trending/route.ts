import { NextResponse } from "next/server";
import { trendingTv, posterUrl } from "@/lib/tmdb";
import { getSiteStats } from "@/lib/stats";

export async function GET() {
  const [trending, stats] = await Promise.all([trendingTv(), getSiteStats()]);

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