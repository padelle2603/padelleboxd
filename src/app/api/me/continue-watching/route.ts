import { NextResponse } from "next/server";
import { getCurrentUser, isActiveUser } from "@/lib/auth";
import { getContinueWatching } from "@/lib/continue-watching";

export async function GET() {
  const user = await getCurrentUser();
  if (!isActiveUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await getContinueWatching(user!);
  return NextResponse.json({ entries });
}