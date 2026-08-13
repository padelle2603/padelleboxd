import { cache } from "react";
import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth";
import { getTvDetails, getSeasonEpisodes, posterUrl } from "@/lib/tmdb";

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
    const [entries, seasonWatches, episodeWatches] = await Promise.all([
      prisma.userSeries.findMany({
        where: { userId, status: { in: ["WATCHED", "WATCHING"] } },
        include: { series: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.seasonWatch.findMany({ where: { userId } }),
      prisma.episodeWatch.findMany({ where: { userId } }),
    ]);

    if (entries.length === 0) return [];

    const watchedSeasons = new Set(
      seasonWatches.map((w) => `${w.seriesId}:${w.seasonNumber}`)
    );
    const watchedEpisodesBySeason = new Map<string, Set<number>>();
    for (const w of episodeWatches) {
      const key = `${w.seriesId}:${w.seasonNumber}`;
      const set = watchedEpisodesBySeason.get(key) ?? new Set<number>();
      set.add(w.episodeNumber);
      watchedEpisodesBySeason.set(key, set);
    }

    const results = await Promise.all(
      entries.map(async (entry) => {
        try {
          const tv = await getTvDetails(entry.seriesId);
          if (!tv?.seasons) return null;

          const seasons = tv.seasons
            .filter((s) => s.season_number > 0 && (s.episode_count ?? 0) > 0)
            .sort((a, b) => a.season_number - b.season_number);

          for (const season of seasons) {
            const seasonKey = `${entry.seriesId}:${season.season_number}`;
            if (watchedSeasons.has(seasonKey)) continue;

            const watchedSet = watchedEpisodesBySeason.get(seasonKey) ?? new Set<number>();
            if (watchedSet.size >= season.episode_count) continue;

            const eps = await getSeasonEpisodes(entry.seriesId, season.season_number);
            const next = eps
              .slice()
              .sort((a, b) => a.episode_number - b.episode_number)
              .find((e) => !watchedSet.has(e.episode_number));
            if (!next) continue;

            return {
              tmdbId: entry.seriesId,
              name: entry.series.name,
              posterUrl: posterUrl(entry.series.posterPath),
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