import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { purgeTmdbCache } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) {
    console.warn(
      "[cron/keepalive] CRON_SECRET is not set: this endpoint is unprotected and open to anyone. " +
        "Set CRON_SECRET in your environment and configure the cron caller to send it as a Bearer token."
    );
  } else if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await Promise.all([prisma.user.count(), purgeTmdbCache()]);

  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
