import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function getUserSeriesOr404(
  userId: string,
  seriesId: number
): Promise<
  | { ok: true; entry: NonNullable<Awaited<ReturnType<typeof prisma.userSeries.findUnique>>> }
  | { ok: false; response: NextResponse }
> {
  const entry = await prisma.userSeries.findUnique({
    where: { userId_seriesId: { userId, seriesId } },
  });
  if (!entry) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Series is not in your list" }, { status: 404 }),
    };
  }
  return { ok: true, entry };
}
