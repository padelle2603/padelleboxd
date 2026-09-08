import { revalidatePath } from "next/cache";
import { invalidateContinueWatching } from "@/lib/continue-watching";
import { invalidateUpcoming } from "@/lib/upcoming";

export function revalidateUserPaths(username: string, tmdbId?: number) {
  revalidatePath("/");
  revalidatePath(`/u/${username}`);
  if (tmdbId != null) {
    revalidatePath(`/series/${tmdbId}`);
  }
}

export function notifyWatchChanged(user: { id: string; username: string }, seriesId: number) {
  invalidateContinueWatching(user.id);
  invalidateUpcoming(user.id);
  revalidateUserPaths(user.username, seriesId);
}
