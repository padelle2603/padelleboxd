import type { PosterCardSeries } from "@/components/series/PosterCard";
import { posterUrl } from "@/lib/tmdb";
import type { SeriesStatus } from "@/lib/constants";

export function tmdbTvToCard(tv: {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string | null;
  vote_average: number;
}): PosterCardSeries {
  return {
    tmdbId: tv.id,
    name: tv.name,
    posterUrl: posterUrl(tv.poster_path),
    firstAirDate: tv.first_air_date,
    tmdbRating: tv.vote_average,
  };
}

export function seriesRowToCard(series: {
  tmdbId: number;
  name: string;
  posterPath: string | null;
  firstAirDate: string | null;
  tmdbRating: number | null;
  status?: SeriesStatus;
  rating?: number | null;
}): PosterCardSeries {
  return {
    tmdbId: series.tmdbId,
    name: series.name,
    posterUrl: posterUrl(series.posterPath),
    firstAirDate: series.firstAirDate,
    tmdbRating: series.tmdbRating,
    status: series.status,
    rating: series.rating,
  };
}
