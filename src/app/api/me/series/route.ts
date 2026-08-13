import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireActiveUser } from "@/lib/auth";
import { getTvDetails, tvToSeriesData, posterUrl } from "@/lib/tmdb";

const STATUSES = ["WATCHED", "WATCHING", "ABANDONED", "ON_HOLD", "PLANNED"] as const;

const addSchema = z.object({
  tmdbId: z.number().int().positive(),
  status: z.enum(STATUSES).default("PLANNED"),
  rating: z.number().int().min(1).max(10).nullable().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const status = req.nextUrl.searchParams.get("status");
  const entries = await prisma.userSeries.findMany({
    where: { userId: user.id, ...(status ? { status: status as never } : {}) },
    include: { series: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
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
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { tmdbId, status, rating } = parsed.data;

  if (rating != null && status === "PLANNED") {
    return NextResponse.json(
      { error: "You cannot rate a series in your planned list." },
      { status: 400 }
    );
  }

  const existing = await prisma.series.findUnique({ where: { tmdbId } });
  if (!existing) {
    const tv = await getTvDetails(tmdbId);
    if (!tv) return NextResponse.json({ error: "Series not found" }, { status: 404 });
    await prisma.series.create({ data: tvToSeriesData(tv) });
  }

  const entry = await prisma.userSeries.upsert({
    where: { userId_seriesId: { userId: user.id, seriesId: tmdbId } },
    update: { status, rating },
    create: { userId: user.id, seriesId: tmdbId, status, rating },
  });

  return NextResponse.json({ entry }, { status: 201 });
}