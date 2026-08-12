import { prisma } from "@/lib/db";
import { isActiveUser, type CurrentUser } from "@/lib/auth";
import { getTvDetails, posterUrl, daysUntil } from "@/lib/tmdb";

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

export async function getUpcomingForUser(user: CurrentUser | null | undefined): Promise<UpcomingCard[]> {
  if (!user || !isActiveUser(user)) return [];

  const [tracked, watched] = await Promise.all([
    prisma.userSeries.findMany({
      where: { userId: user.id, status: { not: "ABANDONED" } },
      include: { series: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.seasonWatch.findMany({ where: { userId: user.id } }),
  ]);

  const watchedKey = new Set(watched.map((w) => `${w.seriesId}:${w.seasonNumber}`));

  const results = await Promise.all(
    tracked.map(async (t) => {
      try {
        const tv = await getTvDetails(t.seriesId);
        const ep = tv && tv.next_episode_to_air;
        if (!tv || !ep || !ep.air_date) return null;
        const d = daysUntil(ep.air_date);
        if (d === null) return null;
        if (d > MAX_AHEAD_DAYS || d < -MAX_JUST_AIRED_DAYS) return null;
        if (watchedKey.has(`${t.seriesId}:${ep.season_number}`)) return null;
        return {
          tmdbId: t.seriesId,
          name: t.series.name,
          posterUrl: posterUrl(t.series.posterPath),
          seasonNumber: ep.season_number,
          episodeNumber: ep.episode_number,
          episodeName: ep.name,
          airDate: ep.air_date,
          daysUntil: d,
        } as UpcomingCard;
      } catch {
        return null;
      }
    })
  );

  return results
    .filter((r): r is UpcomingCard => r !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}