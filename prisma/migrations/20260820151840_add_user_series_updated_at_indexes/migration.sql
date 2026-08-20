-- CreateIndex
CREATE INDEX "UserSeries_userId_updatedAt_idx" ON "UserSeries"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "UserSeries_seriesId_updatedAt_idx" ON "UserSeries"("seriesId", "updatedAt");
