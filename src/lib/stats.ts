import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

export type SiteStats = [number, number, number];

export const getSiteStats = unstable_cache(
  async (): Promise<SiteStats> =>
    prisma.$transaction([
      prisma.user.count({ where: { role: { in: ["APPROVED", "ADMIN"] } } }),
      prisma.userSeries.count(),
      prisma.series.count(),
    ]),
  ["site-stats"],
  { revalidate: 300 }
);