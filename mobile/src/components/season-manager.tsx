import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatYear } from '@/constants/status';
import type { Season } from '@/lib/types';

export function SeasonManager({
  seasons,
  watched,
  canEdit,
  onToggle,
}: {
  seasons: Season[];
  watched: number[];
  canEdit: boolean;
  onToggle: (seasonNumber: number, next: boolean) => Promise<void>;
}) {
  const [watchedSet, setWatchedSet] = useState<Set<number>>(() => new Set(watched));
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    setWatchedSet(new Set(watched));
  }, [watched]);

  if (seasons.length === 0) return null;

  async function toggle(seasonNumber: number, next: boolean) {
    if (busy !== null) return;
    setBusy(seasonNumber);
    setWatchedSet((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(seasonNumber);
      else copy.delete(seasonNumber);
      return copy;
    });
    try {
      await onToggle(seasonNumber, next);
    } catch {
      setWatchedSet((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(seasonNumber);
        else copy.add(seasonNumber);
        return copy;
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.card}>
      {seasons.map((s) => {
        const isWatched = watchedSet.has(s.seasonNumber);
        const year = formatYear(s.airDate);
        return (
          <View key={s.seasonNumber} style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.title}>{s.seasonNumber === 0 ? 'Specials' : `Season ${s.seasonNumber}`}</Text>
              <Text style={styles.subtitle}>
                {s.episodeCount} episode{s.episodeCount === 1 ? '' : 's'}
                {year !== '—' ? ` · ${year}` : ''}
              </Text>
            </View>
            {canEdit ? (
              <Pressable
                onPress={() => toggle(s.seasonNumber, !isWatched)}
                disabled={busy !== null}
                style={[styles.toggle, isWatched ? styles.toggleOn : styles.toggleOff]}>
                {busy === s.seasonNumber ? (
                  <ActivityIndicator size="small" color={Colors.textMuted} />
                ) : (
                  <Text style={[styles.toggleLabel, isWatched && { color: Colors.emerald }]}>
                    {isWatched ? 'Watched' : 'Mark watched'}
                  </Text>
                )}
              </Pressable>
            ) : isWatched ? (
              <View style={[styles.toggle, styles.toggleOn]}>
                <Text style={[styles.toggleLabel, { color: Colors.emerald }]}>Watched</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(24, 24, 27, 0.6)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  toggle: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 1,
    minWidth: 96,
    alignItems: 'center',
  },
  toggleOn: {
    borderColor: 'rgba(52, 211, 153, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  toggleOff: {
    borderColor: Colors.border,
    backgroundColor: 'rgba(24, 24, 27, 0.6)',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});