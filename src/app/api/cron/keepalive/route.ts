import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { purgeTmdbCache } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await Promise.all([prisma.user.count(), purgeTmdbCache()]);

  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
