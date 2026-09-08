import type { TmdbTv } from "@/lib/tmdb";

export function candidateSeasonNumbers(tv: TmdbTv): number[] {
  const seasonNums = new Set<number>();
  if (tv.next_episode_to_air?.season_number != null) {
    seasonNums.add(tv.next_episode_to_air.season_number);
    seasonNums.add(tv.next_episode_to_air.season_number + 1);
  } else if (tv.last_episode_to_air?.season_number != null) {
    seasonNums.add(tv.last_episode_to_air.season_number + 1);
  }
  return [...seasonNums];
}