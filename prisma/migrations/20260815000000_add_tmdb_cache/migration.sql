-- CreateTable
CREATE TABLE "TmdbCache" (
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmdbCache_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "TmdbCache_updatedAt_idx" ON "TmdbCache"("updatedAt");
