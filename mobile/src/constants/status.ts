import type { SeriesStatus } from '@/lib/types';

export const STATUSES: SeriesStatus[] = [
  'WATCHED',
  'WATCHING',
  'ABANDONED',
  'ON_HOLD',
  'PLANNED',
];

export const STATUS_LABEL: Record<SeriesStatus, string> = {
  WATCHED: 'Watched',
  WATCHING: 'Watching',
  ABANDONED: 'Abandoned',
  ON_HOLD: 'On Hold',
  PLANNED: 'Planned',
};

export const STATUS_COLOR: Record<SeriesStatus, { fg: string; bg: string; border: string }> = {
  WATCHED: {
    fg: '#34D399',
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(52, 211, 153, 0.35)',
  },
  WATCHING: {
    fg: '#A78BFA',
    bg: 'rgba(139, 92, 246, 0.14)',
    border: 'rgba(167, 139, 250, 0.35)',
  },
  ABANDONED: {
    fg: '#F87171',
    bg: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(248, 113, 113, 0.35)',
  },
  ON_HOLD: {
    fg: '#FBBF24',
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(251, 191, 36, 0.35)',
  },
  PLANNED: {
    fg: '#38BDF8',
    bg: 'rgba(14, 165, 233, 0.14)',
    border: 'rgba(56, 189, 248, 0.35)',
  },
};

export function canRate(status: SeriesStatus): boolean {
  return status === 'WATCHED' || status === 'ABANDONED';
}

export function formatYear(date: string | null | undefined): string {
  if (!date) return '—';
  return date.slice(0, 4) || '—';
}

export function formatAirDate(date: string | null | undefined): string {
  if (!date) return 'Date TBA';
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}