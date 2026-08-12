import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type ExistsRow = { exists: boolean };

const EPISODE_WATCH_DDL = [
  `CREATE TABLE "EpisodeWatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EpisodeWatch_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX "EpisodeWatch_userId_idx" ON "EpisodeWatch"("userId")`,
  `CREATE INDEX "EpisodeWatch_seriesId_idx" ON "EpisodeWatch"("seriesId")`,
  `CREATE UNIQUE INDEX "EpisodeWatch_userId_seriesId_seasonNumber_episodeNumber_key" ON "EpisodeWatch"("userId", "seriesId", "seasonNumber", "episodeNumber")`,
  `ALTER TABLE "EpisodeWatch" ADD CONSTRAINT "EpisodeWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "EpisodeWatch" ADD CONSTRAINT "EpisodeWatch_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("tmdbId") ON DELETE CASCADE ON UPDATE CASCADE`,
];

export async function GET() {
  const exists = (rows: ExistsRow[]) => rows.length > 0 && rows[0].exists;
  const before = await prisma.$queryRaw<ExistsRow[]>`SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'EpisodeWatch'
  ) AS exists`; // temp route

  if (exists(before)) {
    return NextResponse.json({ ok: true, created: false });
  }

  await prisma.$transaction(
    EPISODE_WATCH_DDL.map((sql) => prisma.$executeRawUnsafe(sql))
  );

  const after = await prisma.$queryRaw<ExistsRow[]>`SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'EpisodeWatch'
  ) AS exists`;

  return NextResponse.json({ ok: exists(after), created: true });
}