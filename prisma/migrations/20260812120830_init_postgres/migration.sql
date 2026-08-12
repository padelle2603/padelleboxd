-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'APPROVED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('WATCHED', 'ABANDONED', 'ON_HOLD', 'PLANNED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "tmdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "overview" TEXT,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "firstAirDate" TEXT,
    "tmdbRating" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("tmdbId")
);

-- CreateTable
CREATE TABLE "UserSeries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "status" "Status" NOT NULL,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonWatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonWatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserSeries_userId_status_idx" ON "UserSeries"("userId", "status");

-- CreateIndex
CREATE INDEX "UserSeries_seriesId_idx" ON "UserSeries"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSeries_userId_seriesId_key" ON "UserSeries"("userId", "seriesId");

-- CreateIndex
CREATE INDEX "SeasonWatch_userId_idx" ON "SeasonWatch"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonWatch_userId_seriesId_seasonNumber_key" ON "SeasonWatch"("userId", "seriesId", "seasonNumber");

-- AddForeignKey
ALTER TABLE "UserSeries" ADD CONSTRAINT "UserSeries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSeries" ADD CONSTRAINT "UserSeries_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("tmdbId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonWatch" ADD CONSTRAINT "SeasonWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonWatch" ADD CONSTRAINT "SeasonWatch_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("tmdbId") ON DELETE CASCADE ON UPDATE CASCADE;
