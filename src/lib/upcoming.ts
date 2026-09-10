import { cache } from "react";
import { isActiveUser, type CurrentUser } from "@/lib/auth";
import { getWatchData, episodeKey } from "@/lib/watch-data";
import { createTtlCache } from "@/lib/ttl-cache";
import {
  getTvDetailsBatch,
  getSeasonEpisodes,
  posterUrl,
  daysUntil,
  type TmdbEpisode,
} from "@/lib/tmdb";
import { candidateSeasonNumbers } from "@/lib/planning";

export type UpcomingCard = {
  tmdbId: number;
  name: string;
  posterUrl: string | null;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate: string;
  daysUntil: number;
};

const MAX_AHEAD_DAYS = 30;

function inWindow(d: number | null): boolean {
  return d !== null && d >= 0 && d <= MAX_AHEAD_DAYS;
}

const getUpcomingForUserId = cache(async (userId: string) => {
  const { tracked, watchedEpisodeKeys } = await getWatchData(userId);

  const details = await getTvDetailsBatch(tracked.map((t) => t.seriesId));

  const results = await Promise.all(
    tracked.map(async (t) => {
      try {
        const tv = details.get(t.seriesId) ?? null;
        if (!tv) return null;

        // Fast path: next_episode_to_air directly, when it's upcoming and unwatched.
        const next = tv.next_episode_to_air;
        if (next?.air_date) {
          const d = daysUntil(next.air_date);
          if (
            inWindow(d) &&
            !watchedEpisodeKeys.has(
              episodeKey(t.seriesId, next.season_number, next.episode_number)
            )
          ) {
            return {
              tmdbId: t.seriesId,
              name: t.name,
              posterUrl: posterUrl(t.posterPath),
              seasonNumber: next.season_number,
              episodeNumber: next.episode_number,
              episodeName: next.name,
              airDate: next.air_date,
              daysUntil: d!,
            } satisfies UpcomingCard;
          }
        }

        // Fallback: scan candidate seasons (ended/hiatus shows) for the first
        // upcoming, unwatched episode.
        const seasonNums = candidateSeasonNumbers(tv);

        const candidates = (
          await Promise.all(
            seasonNums.map(async (n) => {
              try {
                return await getSeasonEpisodes(t.seriesId, n);
              } catch {
                return [] as TmdbEpisode[];
              }
            })
          )
        ).flat();

        const nextUp = candidates
          .filter((ep) => {
            if (!ep.air_date) return false;
            const d = daysUntil(ep.air_date);
            if (!inWindow(d)) return false;
            if (
              watchedEpisodeKeys.has(
                episodeKey(t.seriesId, ep.season_number, ep.episode_number)
              )
            ) {
              return false;
            }
            return true;
          })
          .sort((a, b) => (a.air_date! < b.air_date! ? -1 : 1))
          .slice(0, 1)[0];

        if (!nextUp || !nextUp.air_date) return null;

        return {
          tmdbId: t.seriesId,
          name: t.name,
          posterUrl: posterUrl(t.posterPath),
          seasonNumber: nextUp.season_number,
          episodeNumber: nextUp.episode_number,
          episodeName: nextUp.name,
          airDate: nextUp.air_date,
          daysUntil: daysUntil(nextUp.air_date)!,
        } satisfies UpcomingCard;
      } catch {
        return null;
      }
    })
  );

  return results
    .filter((r): r is UpcomingCard => r !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil);
});

const RESULT_TTL_MS = 60 * 1000;
const resultCache = createTtlCache<UpcomingCard[]>(RESULT_TTL_MS);

export function invalidateUpcoming(userId: string): void {
  resultCache.invalidate(userId);
}

export async function getUpcomingForUser(
  user: CurrentUser | null | undefined
): Promise<UpcomingCard[]> {
  if (!user || !isActiveUser(user)) return [];
  const cached = resultCache.get(user.id);
  if (cached) return cached;
  const entries = await getUpcomingForUserId(user.id);
  resultCache.set(user.id, entries);
  return entries;
}
