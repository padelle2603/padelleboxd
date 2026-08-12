import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { posterUrl } from "@/lib/tmdb";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/users/[username]">) {
  const { username } = await ctx.params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      list: {
        include: { series: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!user || user.role === "PENDING" || user.role === "REJECTED") {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const entries = user.list.map((e) => ({
    status: e.status,
    rating: e.rating,
    updatedAt: e.updatedAt,
    series: {
      tmdbId: e.series.tmdbId,
      name: e.series.name,
      posterUrl: posterUrl(e.series.posterPath),
      firstAirDate: e.series.firstAirDate,
      tmdbRating: e.series.tmdbRating,
    },
  }));

  return NextResponse.json({
    username: user.username,
    createdAt: user.createdAt,
    counts: {
      WATCHED: entries.filter((e) => e.status === "WATCHED").length,
      WATCHING: entries.filter((e) => e.status === "WATCHING").length,
      ABANDONED: entries.filter((e) => e.status === "ABANDONED").length,
      ON_HOLD: entries.filter((e) => e.status === "ON_HOLD").length,
      PLANNED: entries.filter((e) => e.status === "PLANNED").length,
    },
    entries,
  });
}