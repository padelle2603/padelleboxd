import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { RatingPicker } from '@/components/rating-picker';
import { SeasonManager } from '@/components/season-manager';
import { StatusBadge } from '@/components/status-badge';
import { StatusPicker } from '@/components/status-picker';
import { canRate, STATUS_LABEL } from '@/constants/status';
import { useApi } from '@/hooks/use-api';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { SeriesDetailResponse, SeriesStatus } from '@/lib/types';

export default function SeriesDetailScreen() {
  const params = useLocalSearchParams<{ tmdbId: string }>();
  const tmdbId = Number(params.tmdbId);
  const { user } = useAuth();

  const { data, error, loading, reload } = useApi<SeriesDetailResponse>(
    Number.isInteger(tmdbId) ? `/series/${tmdbId}` : null
  );

  const detail = data?.details;
  const statuses = ['WATCHED', 'WATCHING', 'ABANDONED', 'ON_HOLD', 'PLANNED'] as const;

  const canManage = !!user && (user.role === 'APPROVED' || user.role === 'ADMIN');

  const [editStatus, setEditStatus] = useState<SeriesStatus>('PLANNED');
  const [editRating, setEditRating] = useState<number | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setEditStatus(data.myEntry?.status ?? 'PLANNED');
    setEditRating(data.myEntry?.rating ?? null);
    setEditError(null);
  }, [data]);

  const exists = !!data?.myEntry;

  const seasonList = useMemo(
    () => (data?.details.seasons ?? []).filter((s) => s.seasonNumber > 0),
    [data]
  );

  async function save() {
    setEditBusy(true);
    setEditError(null);
    try {
      await apiFetch(exists ? `/me/series/${tmdbId}` : '/me/series', {
        method: exists ? 'PATCH' : 'POST',
        body: JSON.stringify({ tmdbId, status: editStatus, rating: editRating }),
      });
      await reload();
    } catch (e) {
      setEditError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setEditBusy(false);
    }
  }

  async function remove() {
    setEditBusy(true);
    setEditError(null);
    try {
      await apiFetch(`/me/series/${tmdbId}`, { method: 'DELETE' });
      setEditStatus('PLANNED');
      setEditRating(null);
      await reload();
    } catch (e) {
      setEditError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setEditBusy(false);
    }
  }

  async function toggleSeason(seasonNumber: number, next: boolean) {
    await apiFetch(`/me/series/${tmdbId}/seasons/${seasonNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({ watched: next }),
    });
    await reload();
  }

  if (!Number.isInteger(tmdbId)) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: true, title: 'Series' }} />
        <View style={styles.pad}>
          <EmptyState title="Invalid series" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: detail?.name ?? 'Series' }} />
      {loading ? (
        <LoadingState label="Loading series…" />
      ) : error || !detail ? (
        <View style={styles.pad}>
          <ErrorState message={error ?? 'Series not found'} onRetry={reload} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.six }}>
          <View style={styles.hero}>
            {detail.backdropUrl ? (
              <Image
                source={{ uri: detail.backdropUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
                recyclingKey={detail.backdropUrl}
              />
            ) : null}
            <LinearGradient
              colors={['rgba(9, 9, 11, 0.30)', 'rgba(9, 9, 11, 0.85)', Colors.background]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroContent}>
              {detail.posterUrl ? (
                <Image
                  source={{ uri: detail.posterUrl }}
                  style={styles.poster}
                  contentFit="cover"
                  transition={200}
                  recyclingKey={detail.posterUrl}
                />
              ) : (
                <View style={[styles.poster, styles.posterFallback]}>
                  <Text style={styles.posterFallbackText}>{detail.name}</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text numberOfLines={1} style={styles.metaLine}>
                  {detail.firstAirDate ? `First aired ${detail.firstAirDate.slice(0, 4)}` : 'Date TBA'}
                  {detail.status ? ` · ${detail.status}` : ''}
                  {detail.numberOfSeasons != null ? ` · ${detail.numberOfSeasons} season${detail.numberOfSeasons === 1 ? '' : 's'}` : ''}
                  {detail.numberOfEpisodes != null ? ` · ${detail.numberOfEpisodes} episodes` : ''}
                </Text>
                <Text style={styles.name}>{detail.name}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.rating}>★ {detail.tmdbRating.toFixed(1)}</Text>
                  <Text style={styles.muted}>{detail.tmdbVoteCount.toLocaleString()} ratings</Text>
                </View>
                {detail.genres.length > 0 ? (
                  <Text numberOfLines={2} style={styles.muted}>
                    {detail.genres.map((g) => g.name).join(', ')}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {detail.overview ? (
            <Text style={styles.overview}>{detail.overview}</Text>
          ) : null}

          <View style={styles.pad}>
            {!canManage ? (
              user?.role === 'PENDING' || user?.role === 'REJECTED' ? (
                <View style={styles.panel}>
                  <Text style={styles.panelText}>
                    Your account is awaiting administrator approval. Once approved, you can add this
                    series to your list.
                  </Text>
                </View>
              ) : (
                <View style={styles.panel}>
                  <Text style={styles.panelText}>
                    Log in to add this series to your list.
                  </Text>
                </View>
              )
            ) : (
              <View style={styles.panel}>
                <Text style={styles.panelLabel}>
                  {exists ? 'Update your entry' : 'Add to my list'}
                </Text>
                <StatusPicker value={editStatus} onChange={(s) => {
                  setEditStatus(s);
                  if (!canRate(s)) setEditRating(null);
                }} />
                {canRate(editStatus) ? (
                  <View style={styles.ratingBlock}>
                    <Text style={styles.panelMinor}>Rating</Text>
                    <RatingPicker value={editRating} onChange={setEditRating} />
                  </View>
                ) : (
                  <Text style={styles.panelMinor}>
                    Rate after you finish watching ({STATUS_LABEL[editStatus].toLowerCase()}
                    {editStatus === 'ON_HOLD' ? '/watching' : ''} lists don&apos;t take ratings).
                  </Text>
                )}
                {editError ? <Text style={styles.error}>{editError}</Text> : null}
                <View style={styles.actionRow}>
                  <Button
                    label={exists ? 'Save changes' : 'Add to my list'}
                    onPress={save}
                    busy={editBusy}
                    style={styles.saveBtn}
                  />
                  {exists ? (
                    <Button label="Remove" variant="danger" onPress={remove} disabled={editBusy} />
                  ) : null}
                </View>
              </View>
            )}
          </View>

          {seasonList.length > 0 ? (
            <View style={styles.pad}>
              <Text style={styles.sectionTitle}>Seasons</Text>
              <Text style={styles.sectionHint}>Mark a season as watched once you finish it.</Text>
              <SeasonManager
                seasons={data.details.seasons ?? []}
                watched={data.myWatchedSeasons}
                canEdit={canManage}
                onToggle={toggleSeason}
              />
            </View>
          ) : null}

          <View style={styles.pad}>
            <Text style={styles.sectionTitle}>Who&apos;s watching this</Text>
            <View style={styles.countsRow}>
              {statuses.map((s) => (
                <View key={s} style={styles.countChip}>
                  <Text style={styles.countLabel}>{s.replaceAll('_', ' ')}</Text>
                  <Text style={styles.countValue}>{data?.trackedCounts[s] ?? 0}</Text>
                </View>
              ))}
            </View>
            {data?.trackedBy.length ? (
              <View style={styles.watchers}>
                {data.trackedBy.map((t) => (
                  <View key={t.username} style={styles.watcherRow}>
                    <Text style={styles.watcherName}>@{t.username}</Text>
                    <View style={styles.watcherMeta}>
                      {typeof t.rating === 'number' ? (
                        <Text style={styles.watcherRating}>★ {t.rating}/10</Text>
                      ) : null}
                      <StatusBadge status={t.status} compact />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title="Nobody is tracking this yet" subtitle="Be the first!" />
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: {
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  hero: {
    height: 340,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    alignItems: 'flex-end',
    flexGrow: 1,
  },
  poster: {
    width: 104,
    aspectRatio: 2 / 3,
    borderRadius: Radius.md,
    backgroundColor: Colors.cardAlt,
  },
  posterFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
  },
  posterFallbackText: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  info: {
    flex: 1,
    gap: Spacing.one,
    paddingBottom: Spacing.one,
  },
  metaLine: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  name: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rating: {
    color: Colors.rating,
    fontSize: 15,
    fontWeight: '700',
  },
  muted: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  overview: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
  },
  panel: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  panelLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  panelMinor: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  panelText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingVertical: Spacing.one,
  },
  ratingBlock: {
    gap: Spacing.one,
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  saveBtn: {
    flex: 1,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHint: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: Spacing.two,
  },
  countsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
  },
  countLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    textTransform: 'lowercase',
  },
  countValue: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  watchers: {
    backgroundColor: 'rgba(24, 24, 27, 0.5)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  watcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  watcherName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  watcherMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  watcherRating: {
    color: Colors.rating,
    fontSize: 12,
    fontWeight: '700',
  },
});