export type SeriesStatus =
  | 'WATCHED'
  | 'WATCHING'
  | 'ABANDONED'
  | 'ON_HOLD'
  | 'PLANNED';

export type User = {
  id: string;
  username: string;
  role: 'ADMIN' | 'APPROVED' | 'PENDING' | 'REJECTED';
};

export type SeriesSummary = {
  tmdbId: number;
  name: string;
  overview: string | null;
  firstAirDate: string | null;
  posterUrl: string | null;
  tmdbRating: number | null;
};

export type TrendResponse = {
  results: SeriesSummary[];
  stats: { members: number; trackedSeries: number; catalogSeries: number };
};

export type Season = {
  seasonNumber: number;
  episodeCount: number;
  airDate: string | null;
  overview: string | null;
};

export type SeriesDetailResponse = {
  details: {
    id: number;
    name: string;
    overview: string | null;
    firstAirDate: string | null;
    posterUrl: string | null;
    backdropUrl: string | null;
    genres: { id: number; name: string }[];
    status: string | null;
    numberOfSeasons: number | null;
    numberOfEpisodes: number | null;
    tmdbRating: number;
    tmdbVoteCount: number;
    seasons: Season[];
  };
  trackedCounts: Record<SeriesStatus, number>;
  trackedBy: { username: string; status: SeriesStatus; rating: number | null }[];
  myEntry: { status: SeriesStatus; rating: number | null } | null;
  myWatchedSeasons: number[];
};

export type ListEntry = {
  id: string;
  status: SeriesStatus;
  rating: number | null;
  updatedAt: string;
  series: SeriesSummary;
};

export type MyListResponse = { entries: ListEntry[] };

export type ProfileResponse = {
  username: string;
  createdAt: string;
  counts: Record<SeriesStatus, number>;
  entries: {
    status: SeriesStatus;
    rating: number | null;
    updatedAt: string;
    series: SeriesSummary;
  }[];
};