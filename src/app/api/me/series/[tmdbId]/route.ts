import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withUser } from "@/lib/auth";
import { getTvDetails, getSeasonEpisodes, todayDateStr } from "@/lib/tmdb";
import { revalidateUserPaths } from "@/lib/revalidate";
import { STATUSES } from "@/lib/constants";
import { parseJsonBody, jsonError } from "@/lib/http";
import { getUserSeriesOr404 } from "@/lib/series-entries";

type Ctx = RouteContext<"/api/me/series/[tmdbId]">;

const updateSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    rating: z.number().int().min(1).max(10).nullable().optional(),
  })
  .refine((d) => d.status || d.rating !== undefined, "Nothing to update");

export const PATCH = withUser(async (req, ctx: Ctx, user) => {
  const { tmdbId } = await ctx.params;
  const seriesId = Number(tmdbId);
  if (!Number.isInteger(seriesId)) {
    return jsonError("Invalid series id");
  }

  const body = await parseJsonBody(req, updateSchema);
  if (!body.ok) return body.response;

  const { status, rating } = body.data;

  const found = await getUserSeriesOr404(user.id, seriesId);
  if (!found.ok) return found.response;
  const existing = found.entry;

  const finalStatus = status ?? existing.status;
  const finalRating = status
    ? status === "PLANNED"
      ? null
      : (rating ?? existing.rating)
    : rating;

  if (finalRating != null && finalStatus === "PLANNED") {
    return jsonError("You cannot rate a series in your planned list.");
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

      if (releasedSeasons.length > 0) {
        const seasonEpisodes = await Promise.all(
          releasedSeasons.map(async (season) => {
            const episodes = await getSeasonEpisodes(seriesId, season);
            return {
              season,
              released: episodes.filter((ep) => ep.air_date && ep.air_date <= today),
            };
          })
        );

        await prisma.$transaction([
          prisma.seasonWatch.createMany({
            data: releasedSeasons.map((season) => ({
              userId: user.id,
              seriesId,
              seasonNumber: season,
            })),
            skipDuplicates: true,
          }),
          prisma.episodeWatch.createMany({
            data: seasonEpisodes.flatMap(({ season, released }) =>
              released.map((ep) => ({
                userId: user.id,
                seriesId,
                seasonNumber: season,
                episodeNumber: ep.episode_number,
              }))
            ),
            skipDuplicates: true,
          }),
        ]);

        seasonsWatched = releasedSeasons.length;
        episodesWatched = seasonEpisodes.reduce((acc, s) => acc + s.released.length, 0);
      }
    } catch {
      // best effort: even if TMDB is unreachable the series is marked watched
    }
  }

  revalidateUserPaths(user.username, seriesId);
  return NextResponse.json({ entry, seasonsWatched, episodesWatched });
});

export const DELETE = withUser(async (_req, ctx: Ctx, user) => {
  const { tmdbId } = await ctx.params;
  const seriesId = Number(tmdbId);
  if (!Number.isInteger(seriesId)) {
    return jsonError("Invalid series id");
  }

  const found = await getUserSeriesOr404(user.id, seriesId);
  if (!found.ok) return found.response;

  await prisma.userSeries.delete({
    where: { userId_seriesId: { userId: user.id, seriesId } },
  });

  revalidateUserPaths(user.username, seriesId);
  return NextResponse.json({ message: "Removed from your list" });
});
