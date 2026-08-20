import { cache } from "react";
import type { CurrentUser } from "@/lib/auth";
import { getWatchData } from "@/lib/watch-data";
import {
  getTvDetails,
  getSeasonEpisodes,
  posterUrl,
  daysUntil,
  type TmdbEpisode,
} from "@/lib/tmdb";

const MAX_UNRELEASED_AHEAD_DAYS = 7;

export type ContinueWatchingEntry = {
  tmdbId: number;
  name: string;
  posterUrl: string | null;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate: string | null;
  seasonEpisodeCount: number;
  seasonProgress: number;
};

const getContinueWatchingForUserId = cache(async (userId: string) => {
    const { tracked, watchedSeasons, watchedEpisodes } = await getWatchData(userId);

    if (tracked.length === 0) return [];

    const results = await Promise.all(
      tracked.map(async (entry) => {
        try {
          const tv = await getTvDetails(entry.seriesId);
          if (!tv?.seasons) return null;

          const seasons = tv.seasons
            .filter((s) => s.season_number > 0 && (s.episode_count ?? 0) > 0)
            .sort((a, b) => a.season_number - b.season_number);

          const candidateSeasons = seasons.filter((s) => {
            const seasonKey = `${entry.seriesId}:${s.season_number}`;
            if (watchedSeasons.has(seasonKey)) return false;
            const watchedSet = watchedEpisodes.get(seasonKey) ?? new Set<number>();
            return watchedSet.size < (s.episode_count ?? 0);
          });

          const episodesBySeason = await Promise.all(
            candidateSeasons.map(async (s) => {
              try {
                return { season: s, episodes: await getSeasonEpisodes(entry.seriesId, s.season_number) };
              } catch {
                return { season: s, episodes: [] as TmdbEpisode[] };
              }
            })
          );

          for (const { season, episodes } of episodesBySeason) {
            const seasonKey = `${entry.seriesId}:${season.season_number}`;
            const watchedSet = watchedEpisodes.get(seasonKey) ?? new Set<number>();
            const next = episodes
              .slice()
              .sort((a, b) => a.episode_number - b.episode_number)
              .find((e) => !watchedSet.has(e.episode_number));
            if (!next) continue;

            const releaseDays = daysUntil(next.air_date);
            if (releaseDays !== null && releaseDays > MAX_UNRELEASED_AHEAD_DAYS) continue;

            return {
              tmdbId: entry.seriesId,
              name: entry.name,
              posterUrl: posterUrl(entry.posterPath),
              seasonNumber: season.season_number,
              episodeNumber: next.episode_number,
              episodeName: next.name,
              airDate: next.air_date,
              seasonEpisodeCount: season.episode_count,
              seasonProgress: watchedSet.size,
            } satisfies ContinueWatchingEntry;
          }
          return null;
        } catch {
          return null;
        }
      })
    );

    return results.filter((r): r is ContinueWatchingEntry => r !== null);
});

export async function getContinueWatching(
  user: CurrentUser
): Promise<ContinueWatchingEntry[]> {
  return getContinueWatchingForUserId(user.id);
}