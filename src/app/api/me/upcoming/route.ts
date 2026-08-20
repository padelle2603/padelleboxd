import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { getUpcomingForUser } from "@/lib/upcoming";

export async function GET() {
  const auth = await requireActiveUser();
  if (!auth.ok) {
    return NextResponse.json({ entries: [] });
  }
  const entries = await getUpcomingForUser(auth.user);
  return NextResponse.json({ entries });
}