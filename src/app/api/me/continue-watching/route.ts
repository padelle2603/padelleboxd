import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { getContinueWatching } from "@/lib/continue-watching";

export async function GET() {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.response;

  const entries = await getContinueWatching(auth.user);
  return NextResponse.json({ entries });
}