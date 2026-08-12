import { NextRequest, NextResponse } from "next/server";
import { searchTv, posterUrl } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ results: [] });
  }
  const results = await searchTv(q);
  return NextResponse.json({
    results: results.map((tv) => ({
      id: tv.id,
      name: tv.name,
      overview: tv.overview,
      firstAirDate: tv.first_air_date,
      posterUrl: posterUrl(tv.poster_path),
      tmdbRating: tv.vote_average,
    })),
  });
}