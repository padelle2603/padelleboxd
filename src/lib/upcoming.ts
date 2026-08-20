import { cache } from "react";
import { isActiveUser, type CurrentUser } from "@/lib/auth";
import { getWatchData } from "@/lib/watch-data";
import {
  getTvDetails,
  getSeasonEpisodes,
  posterUrl,
  daysUntil,
  type TmdbEpisode,
} from "@/lib/tmdb";

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

    const results = await Promise.all(
      tracked.map(async (t) => {
        try {
          const tv = await getTvDetails(t.seriesId);
          if (!tv) return null;

          const next = tv.next_episode_to_air;
          const last = tv.last_episode_to_air;
          if (!next && !last) return null;

          const seasonNums = new Set<number>();
          if (next?.season_number != null) {
            seasonNums.add(next.season_number);
            seasonNums.add(next.season_number + 1);
          } else if (last?.season_number != null) {
            seasonNums.add(last.season_number + 1);
          }

          const candidates = (
            await Promise.all(
              [...seasonNums].map(async (n) => {
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
              if (watchedEpisodeKeys.has(`${t.seriesId}:${ep.season_number}:${ep.episode_number}`)) {
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

export async function getUpcomingForUser(
  user: CurrentUser | null | undefined
): Promise<UpcomingCard[]> {
  if (!user || !isActiveUser(user)) return [];
  return getUpcomingForUserId(user.id);
}