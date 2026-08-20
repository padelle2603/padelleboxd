import { revalidatePath } from "next/cache";

export function revalidateUserPaths(username: string, tmdbId?: number) {
  revalidatePath("/");
  revalidatePath(`/u/${username}`);
  if (tmdbId != null) {
    revalidatePath(`/series/${tmdbId}`);
  }
}