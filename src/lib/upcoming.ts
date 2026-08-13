import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { isActiveUser, type CurrentUser } from "@/lib/auth";
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
const MAX_JUST_AIRED_DAYS = 7;
const REVALIDATE = 1800;

function inWindow(d: number | null): boolean {
  return d !== null && d <= MAX_AHEAD_DAYS && d >= -MAX_JUST_AIRED_DAYS;
}

const getUpcomingForUserId = unstable_cache(
  async (userId: string) => {
    const [tracked, episodeWatches] = await Promise.all([
      prisma.userSeries.findMany({
        where: { userId, status: { in: ["WATCHED", "PLANNED"] } },
        include: { series: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.episodeWatch.findMany({ where: { userId } }),
    ]);

    const watchedEpisodes = new Set(
      episodeWatches.map((w) => `${w.seriesId}:${w.seasonNumber}:${w.episodeNumber}`)
    );

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

          const candidates: TmdbEpisode[] = [];
          for (const n of seasonNums) {
            try {
              candidates.push(...(await getSeasonEpisodes(t.seriesId, n)));
            } catch {
              // ignore seasons that fail to load
            }
          }

          const nextUp = candidates
            .filter((ep) => {
              if (!ep.air_date) return false;
              const d = daysUntil(ep.air_date);
              if (!inWindow(d)) return false;
              if (watchedEpisodes.has(`${t.seriesId}:${ep.season_number}:${ep.episode_number}`)) {
                return false;
              }
              return true;
            })
            .sort((a, b) => (a.air_date! < b.air_date! ? -1 : 1))
            .slice(0, 1)[0];

          if (!nextUp || !nextUp.air_date) return null;

          return {
            tmdbId: t.seriesId,
            name: t.series.name,
            posterUrl: posterUrl(t.series.posterPath),
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
  },
  [],
  { revalidate: REVALIDATE }
);

export async function getUpcomingForUser(
  user: CurrentUser | null | undefined
): Promise<UpcomingCard[]> {
  if (!user || !isActiveUser(user)) return [];
  return getUpcomingForUserId(user.id);
}