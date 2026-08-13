import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireActiveUser } from "@/lib/auth";
import { getTvDetails, getSeasonEpisodes, todayDateStr } from "@/lib/tmdb";

const STATUSES = ["WATCHED", "WATCHING", "ABANDONED", "ON_HOLD", "PLANNED"] as const;

const updateSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    rating: z.number().int().min(1).max(10).nullable().optional(),
  })
  .refine((d) => d.status || d.rating !== undefined, "Nothing to update");

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/me/series/[tmdbId]">) {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const { tmdbId } = await ctx.params;
  const seriesId = Number(tmdbId);
  if (!Number.isInteger(seriesId)) {
    return NextResponse.json({ error: "Invalid series id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { status, rating } = parsed.data;

  const existing = await prisma.userSeries.findUnique({
    where: { userId_seriesId: { userId: user.id, seriesId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Series is not in your list" }, { status: 404 });
  }

  const finalStatus = status ?? existing.status;
  const finalRating = status
    ? status === "PLANNED"
      ? null
      : (rating ?? existing.rating)
    : rating;

  if (finalRating != null && finalStatus === "PLANNED") {
    return NextResponse.json(
      { error: "You cannot rate a series in your planned list." },
      { status: 400 }
    );
  }

  const entry = await prisma.userSeries.update({
    where: { userId_seriesId: { userId: user.id, seriesId } },
    data: { status: finalStatus, rating: finalRating },
  });

  let seasonsWatched = 0;
  let episodesWatched = 0;

  if (status === "WATCHED") {
    try {
      const today = todayDateStr();
      const tv = await getTvDetails(seriesId);
      const releasedSeasons =
        tv?.seasons
          ?.filter((s) => s.season_number >= 0 && s.air_date && s.air_date <= today)
          .map((s) => s.season_number) ?? [];

      for (const season of releasedSeasons) {
        await prisma.seasonWatch.upsert({
          where: {
            userId_seriesId_seasonNumber: { userId: user.id, seriesId, seasonNumber: season },
          },
          update: {},
          create: { userId: user.id, seriesId, seasonNumber: season },
        });
        seasonsWatched++;

        const episodes = await getSeasonEpisodes(seriesId, season);
        for (const ep of episodes) {
          if (ep.air_date && ep.air_date <= today) {
            await prisma.episodeWatch.upsert({
              where: {
                userId_seriesId_seasonNumber_episodeNumber: {
                  userId: user.id,
                  seriesId,
                  seasonNumber: season,
                  episodeNumber: ep.episode_number,
                },
              },
              update: {},
              create: {
                userId: user.id,
                seriesId,
                seasonNumber: season,
                episodeNumber: ep.episode_number,
              },
            });
            episodesWatched++;
          }
        }
      }
    } catch {
      // best effort: even if TMDB is unreachable the series is marked watched
    }
  }

  return NextResponse.json({ entry, seasonsWatched, episodesWatched });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/me/series/[tmdbId]">) {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const { tmdbId } = await ctx.params;
  const seriesId = Number(tmdbId);
  if (!Number.isInteger(seriesId)) {
    return NextResponse.json({ error: "Invalid series id" }, { status: 400 });
  }

  const existing = await prisma.userSeries.findUnique({
    where: { userId_seriesId: { userId: user.id, seriesId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Series is not in your list" }, { status: 404 });
  }

  await prisma.userSeries.delete({
    where: { userId_seriesId: { userId: user.id, seriesId } },
  });

  return NextResponse.json({ message: "Removed from your list" });
}