import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTvDetails, tvToSeriesData, todayDateStr } from "@/lib/tmdb";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

type ImportStatus = "WATCHED" | "WATCHING";

type PayloadEpisode = {
  seasonNumber: number;
  episodeNumber: number;
  watchedAt: string;
};

type PayloadShow = {
  tmdbId: number;
  title: string;
  status: ImportStatus;
  rating?: number | null;
  seasonNumbers?: number[];
  episodes?: PayloadEpisode[];
};

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-import-token");
  if (!process.env.X_IMPORT_TOKEN || token !== process.env.X_IMPORT_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const username = body?.username;
  const shows = body?.shows as PayloadShow[] | undefined;
  if (typeof username !== "string" || !Array.isArray(shows)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: `User "${username}" not found` }, { status: 404 });
  }

  const today = todayDateStr();
  const results = [];
  let totalEpisodes = 0;
  let totalSeasons = 0;
  let totalCreated = 0;
  let totalExisting = 0;

  for (const show of shows) {
    const tmdbId = show.tmdbId;

    let tv = null;
    try {
      tv = await getTvDetails(tmdbId);
    } catch {
      tv = null;
    }

    await prisma.series.upsert({
      where: { tmdbId },
      update: {},
      create: tv ? tvToSeriesData(tv) : { tmdbId, name: show.title },
    });

    const existing = await prisma.userSeries.findUnique({
      where: { userId_seriesId: { userId: user.id, seriesId: tmdbId } },
    });
    const listCreated = !existing;
    if (listCreated) {
      await prisma.userSeries.create({
        data: {
          userId: user.id,
          seriesId: tmdbId,
          status: show.status,
          rating: show.rating ?? null,
        },
      });
      totalCreated++;
    } else {
      totalExisting++;
    }

    let seasonNumbers: number[] = [];
    if (show.status === "WATCHED") {
      seasonNumbers =
        show.seasonNumbers?.length
          ? show.seasonNumbers
          : (tv?.seasons
              ?.filter((s) => s.season_number > 0 && s.air_date && s.air_date <= today)
              .map((s) => s.season_number) ?? []);
    }

    const episodes = (show.episodes ?? []).map((e) => ({
      userId: user.id,
      seriesId: tmdbId,
      seasonNumber: e.seasonNumber,
      episodeNumber: e.episodeNumber,
      watchedAt: new Date(e.watchedAt),
    }));

    if (episodes.length) {
      await prisma.episodeWatch.createMany({
        data: episodes,
        skipDuplicates: true,
      });
    }
    if (seasonNumbers.length) {
      await prisma.seasonWatch.createMany({
        data: seasonNumbers.map((seasonNumber) => ({
          userId: user.id,
          seriesId: tmdbId,
          seasonNumber,
        })),
        skipDuplicates: true,
      });
    }

    totalEpisodes += episodes.length;
    totalSeasons += seasonNumbers.length;
    results.push({
      tmdbId,
      title: show.title,
      status: show.status,
      listCreated,
      listExisting: !listCreated,
      seriesFetched: !!tv,
      episodes: episodes.length,
      seasons: seasonNumbers.length,
      rating: show.rating ?? null,
    });
  }

  return NextResponse.json({
    ok: true,
    user: username,
    shows: results.length,
    totalCreated,
    totalExisting,
    totalEpisodes,
    totalSeasons,
    results,
  });
}