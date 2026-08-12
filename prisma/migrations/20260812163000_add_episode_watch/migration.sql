-- CreateTable
CREATE TABLE "EpisodeWatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EpisodeWatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EpisodeWatch_userId_idx" ON "EpisodeWatch"("userId");

-- CreateIndex
CREATE INDEX "EpisodeWatch_seriesId_idx" ON "EpisodeWatch"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "EpisodeWatch_userId_seriesId_seasonNumber_episodeNumber_key" ON "EpisodeWatch"("userId", "seriesId", "seasonNumber", "episodeNumber");

-- AddForeignKey
ALTER TABLE "EpisodeWatch" ADD CONSTRAINT "EpisodeWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeWatch" ADD CONSTRAINT "EpisodeWatch_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("tmdbId") ON DELETE CASCADE ON UPDATE CASCADE;