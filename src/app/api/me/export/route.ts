import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isActiveUser } from "@/lib/auth";

function csvCell(value: string | number | null): string {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function toCsv(rows: (string | number | null)[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export async function GET() {
  const user = await getCurrentUser();
  if (!isActiveUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [entries, seasonWatches] = await Promise.all([
    prisma.userSeries.findMany({
      where: { userId: user!.id },
      include: { series: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.seasonWatch.findMany({
      where: { userId: user!.id },
      select: { seriesId: true, seasonNumber: true },
    }),
  ]);

  const watchedSeasonsBySeries = new Map<number, number[]>();
  for (const w of seasonWatches) {
    const list = watchedSeasonsBySeries.get(w.seriesId) ?? [];
    list.push(w.seasonNumber);
    watchedSeasonsBySeries.set(w.seriesId, list);
  }

  const rows: (string | number | null)[][] = [
    ["tmdb_id", "title", "status", "rating", "watched_seasons", "added_at", "updated_at"],
    ...entries.map((e) => {
      const seasons = watchedSeasonsBySeries.get(e.seriesId) ?? [];
      return [
        e.series.tmdbId,
        e.series.name,
        e.status,
        e.rating,
        seasons.length > 0 ? seasons.sort((a, b) => a - b).join(";") : "",
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