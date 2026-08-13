import { prisma } from "@/lib/db";
import { requireActiveUser } from "@/lib/auth";

function csvCell(value: string | number | null): string {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function toCsv(rows: (string | number | null)[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export async function GET() {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const [entries, seasonWatches, episodeWatches] = await Promise.all([
    prisma.userSeries.findMany({
      where: { userId: user.id },
      include: { series: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.seasonWatch.findMany({
      where: { userId: user.id },
      select: { seriesId: true, seasonNumber: true },
    }),
    prisma.episodeWatch.findMany({
      where: { userId: user.id },
      select: { seriesId: true, seasonNumber: true, episodeNumber: true },
    }),
  ]);

  const watchedSeasonsBySeries = new Map<number, number[]>();
  for (const w of seasonWatches) {
    const list = watchedSeasonsBySeries.get(w.seriesId) ?? [];
    list.push(w.seasonNumber);
    watchedSeasonsBySeries.set(w.seriesId, list);
  }

  const watchedEpisodesBySeries = new Map<number, string[]>();
  for (const w of episodeWatches) {
    const list = watchedEpisodesBySeries.get(w.seriesId) ?? [];
    list.push(`${w.seasonNumber}:${w.episodeNumber}`);
    watchedEpisodesBySeries.set(w.seriesId, list);
  }

  const rows: (string | number | null)[][] = [
    ["tmdb_id", "title", "status", "rating", "watched_seasons", "watched_episodes", "added_at", "updated_at"],
    ...entries.map((e) => {
      const seasons = watchedSeasonsBySeries.get(e.seriesId) ?? [];
      const episodes = watchedEpisodesBySeries.get(e.seriesId) ?? [];
      return [
        e.series.tmdbId,
        e.series.name,
        e.status,
        e.rating,
        seasons.length > 0 ? seasons.sort((a, b) => a - b).join(";") : "",
        episodes.length > 0
          ? episodes.sort((a, b) => {
              const [as, ae] = a.split(":").map(Number);
              const [bs, be] = b.split(":").map(Number);
              return as - bs || ae - be;
            }).join(";")
          : "",
        e.createdAt.toISOString(),
        e.updatedAt.toISOString(),
      ];
    }),
  ];

  const csv = toCsv(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="padelleboxd-export.csv"',
    },
  });
}