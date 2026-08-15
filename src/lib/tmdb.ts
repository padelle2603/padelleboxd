import "server-only";
import { cache } from "react";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

const API_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = process.env.TMDB_IMAGE_BASE_URL ?? "https://image.tmdb.org/t/p";

const apiKey = process.env.TMDB_API_KEY;

export const TMDB_CACHE_TTL_MS = 60 * 60 * 1000;
export const TMDB_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const cacheKey = (path: string) => `tmdb:${path}`;

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const entry = await prisma.tmdbCache.findUnique({ where: { key } });
    if (!entry) return null;
    if (Date.now() - entry.updatedAt.getTime() > TMDB_CACHE_TTL_MS) return null;
    return entry.payload as T;
  } catch {
    return null;
  }
}

async function cacheSet(key: string, payload: unknown): Promise<void> {
  try {
    await prisma.tmdbCache.upsert({
      where: { key },
      update: { payload: payload as Prisma.InputJsonValue, updatedAt: new Date() },
      create: { key, payload: payload as Prisma.InputJsonValue },
    });
  } catch {
    // cache write failures should never break the request
  }
}

export async function purgeTmdbCache(): Promise<number> {
  const cutoff = new Date(Date.now() - TMDB_CACHE_MAX_AGE_MS);
  const res = await prisma.tmdbCache.deleteMany({ where: { updatedAt: { lt: cutoff } } });
  return res.count;
}

export type TmdbSeason = {
  id: number;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  overview: string | null;
  poster_path: string | null;
};

export type TmdbEpisode = {
  id: number;
  name: string;
  overview: string | null;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  still_path: string | null;
  episode_type?: string;
};

export type TmdbTv = {
  id: number;
  name: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  vote_average: number;
  vote_count: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  genres?: { id: number; name: string }[];
  original_name?: string;
  seasons?: TmdbSeason[];
  next_episode_to_air?: TmdbEpisode | null;
  last_episode_to_air?: TmdbEpisode | null;
};

export function posterUrl(path: string | null, size = "w500"): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/w780${path}`;
}

function tmdbFetch(path: string, params: Record<string, string> = {}, cache: "revalidate" | "no-store" = "revalidate") {
  if (!apiKey) throw new Error("TMDB_API_KEY is not configured");
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return fetch(url, cache === "no-store" ? { cache: "no-store" } : { next: { revalidate: 3600 } });
}

export async function searchTv(query: string): Promise<TmdbTv[]> {
  const res = await tmdbFetch(
    "/search/tv",
    { query, include_adult: "false" },
    "no-store"
  );
  if (!res.ok) throw new Error(`TMDB search failed (${res.status})`);
  const data = (await res.json()) as { results: TmdbTv[] };
  return data.results ?? [];
}

export const trendingTv = cache(async function trendingTv(): Promise<TmdbTv[]> {
  const res = await tmdbFetch("/trending/tv/week");
  if (!res.ok) throw new Error(`TMDB trending failed (${res.status})`);
  const data = (await res.json()) as { results: TmdbTv[] };
  return (data.results ?? []).slice(0, 12);
});

export const getTvDetails = cache(async function getTvDetails(
  tmdbId: number
): Promise<TmdbTv | null> {
  const key = cacheKey(`/tv/${tmdbId}`);
  const cached = await cacheGet<TmdbTv>(key);
  if (cached) return cached;

  const res = await tmdbFetch(`/tv/${tmdbId}`, {}, "no-store");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`TMDB detail failed (${res.status})`);
  const data = (await res.json()) as TmdbTv;
  await cacheSet(key, data);
  return data;
});

export const getSeasonEpisodes = cache(async function getSeasonEpisodes(
  tmdbId: number,
  seasonNumber: number
): Promise<TmdbEpisode[]> {
  const key = cacheKey(`/tv/${tmdbId}/season/${seasonNumber}`);
  const cached = await cacheGet<TmdbEpisode[]>(key);
  if (cached) return cached;

  const res = await tmdbFetch(`/tv/${tmdbId}/season/${seasonNumber}`, {}, "no-store");
  if (!res.ok) throw new Error(`TMDB season fetch failed (${res.status})`);
  const data = (await res.json()) as { episodes?: TmdbEpisode[] };
  const episodes = data.episodes ?? [];
  await cacheSet(key, episodes);
  return episodes;
});

export function stillUrl(path: string | null, size = "w300"): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

export function todayDateStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86400000);
}

export async function getUpcomingEpisodes(tv: TmdbTv, max = 7): Promise<TmdbEpisode[]> {
  const today = todayDateStr();
  const seasonNums = new Set<number>();
  if (tv.next_episode_to_air?.season_number != null) {
    seasonNums.add(tv.next_episode_to_air.season_number);
    seasonNums.add(tv.next_episode_to_air.season_number + 1);
  } else if (tv.last_episode_to_air?.season_number != null) {
    seasonNums.add(tv.last_episode_to_air.season_number + 1);
  }
  const all: TmdbEpisode[] = [];
  for (const n of seasonNums) {
    try {
      const eps = await getSeasonEpisodes(tv.id, n);
      all.push(...eps);
    } catch {
      // ignore seasons that fail to load
    }
  }
  return all
    .filter((e) => e.air_date && e.air_date >= today)
    .sort((a, b) => (a.air_date! < b.air_date! ? -1 : 1))
    .slice(0, max);
}

export function tvToSeriesData(tv: TmdbTv): Prisma.SeriesUncheckedCreateInput {
  return {
    tmdbId: tv.id,
    name: tv.name,
    overview: tv.overview ?? null,
    posterPath: tv.poster_path,
    backdropPath: tv.backdrop_path,
    firstAirDate: tv.first_air_date,
    tmdbRating: tv.vote_average,
  };
}