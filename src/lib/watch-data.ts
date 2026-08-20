import { cache } from "react";
import { prisma } from "@/lib/db";

export type TrackedSeries = {
  seriesId: number;
  name: string;
  posterPath: string | null;
};

export type WatchData = {
  tracked: TrackedSeries[];
  watchedSeasons: Set<string>;
  watchedEpisodes: Map<string, Set<number>>;
  watchedEpisodeKeys: Set<string>;
};

export const getWatchData = cache(async function getWatchData(userId: string): Promise<WatchData> {
  const [tracked, seasonWatches, episodeWatches] = await Promise.all([
    prisma.userSeries.findMany({
      where: { userId, status: { in: ["WATCHED", "WATCHING"] } },
      select: {
        seriesId: true,
        series: { select: { name: true, posterPath: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.seasonWatch.findMany({
      where: { userId },
      select: { seriesId: true, seasonNumber: true },
    }),
    prisma.episodeWatch.findMany({
      where: { userId },
      select: { seriesId: true, seasonNumber: true, episodeNumber: true },
    }),
  ]);

  const watchedSeasons = new Set(
    seasonWatches.map((w) => `${w.seriesId}:${w.seasonNumber}`)
  );
  const watchedEpisodes = new Map<string, Set<number>>();
  const watchedEpisodeKeys = new Set<string>();
  for (const w of episodeWatches) {
    const key = `${w.seriesId}:${w.seasonNumber}`;
    const set = watchedEpisodes.get(key) ?? new Set<number>();
    set.add(w.episodeNumber);
    watchedEpisodes.set(key, set);
    watchedEpisodeKeys.add(`${key}:${w.episodeNumber}`);
  }

  return {
    tracked: tracked.map((t) => ({
      seriesId: t.seriesId,
      name: t.series.name,
      posterPath: t.series.posterPath,
    })),
    watchedSeasons,
    watchedEpisodes,
    watchedEpisodeKeys,
  };
});