import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PosterCard } from '@/components/poster-card';
import { StatusBadge } from '@/components/status-badge';
import { Button, EmptyState, LoadingState, Screen } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { useAuth } from '@/lib/auth-context';
import { STATUSES, STATUS_LABEL } from '@/constants/status';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ListEntry, MyListResponse, SeriesStatus } from '@/lib/types';

type Filter = 'ALL' | SeriesStatus;

export default function MyListScreen() {
  const { user } = useAuth();
  const canManage = !!user && (user.role === 'APPROVED' || user.role === 'ADMIN');
  const [filter, setFilter] = useState<Filter>('ALL');

  const path = canManage ? '/me/series' : null;
  const { data, error, loading, reload } = useApi<MyListResponse>(path);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const entries = data?.entries ?? [];
  const counts = useMemo(() => {
    const c: Record<SeriesStatus, number> = { WATCHED: 0, WATCHING: 0, ABANDONED: 0, ON_HOLD: 0, PLANNED: 0 };
    for (const e of entries) c[e.status] += 1;
    return c;
  }, [entries]);

  const visible = filter === 'ALL' ? entries : entries.filter((e) => e.status === filter);

  return (
    <Screen>
      {!canManage ? (
        <View style={styles.guest}>
          <Text style={styles.title}>My List</Text>
          {user?.role === 'PENDING' ? (
            <EmptyState
              title="Account not active"
              subtitle="Your account is still waiting for an administrator to approve it."
            />
          ) : user?.role === 'REJECTED' ? (
            <EmptyState
              title="Account not approved"
              subtitle="Your account was not approved. Contact an administrator."
            />
          ) : (
            <EmptyState
              title="Log in to see your list"
              subtitle="Track series, rate them and keep your watchlist in sync."
              actionLabel="Log in"
              onAction={() => router.push('/login')}
            />
          )}
          {!user && (
            <Button label="Create an account" variant="ghost" onPress={() => router.push('/register')} />
          )}
        </View>
      ) : loading ? (
        <LoadingState label="Loading your list…" />
      ) : error ? (
        <View style={styles.guest}>
          <EmptyState title="Something went wrong" subtitle={error} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridGap}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <EntryCard entry={item} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>My List</Text>
                <Button label="+ Add series" onPress={() => router.push('/search')} />
              </View>
              <Text style={styles.summary}>
                {entries.length} series ·{' '}
                {STATUSES.map((s) => `${STATUS_LABEL[s].toLowerCase()}: ${counts[s]}`).join('  ')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
                <FilterChip label="All" active={filter === 'ALL'} onPress={() => setFilter('ALL')} />
                {STATUSES.map((s) => (
                  <FilterChip key={s} label={STATUS_LABEL[s]} active={filter === s} onPress={() => setFilter(s)} />
                ))}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title={filter === 'ALL' ? 'Your list is empty' : 'Nothing here'}
              subtitle="Find a TV series to track."
              actionLabel="Search series"
              onAction={() => router.push('/search')}
            />
          }
          ListFooterComponent={<View style={{ height: Spacing.six }} />}
        />
      )}
    </Screen>
  );
}

function EntryCard({ entry }: { entry: ListEntry }) {
  const canRate = typeof entry.rating === 'number';
  return (
    <PosterCard
      series={entry.series}
      footer={
        <View style={styles.entryMeta}>
          <StatusBadge status={entry.status} compact />
          {canRate ? (
            <Text style={styles.entryRating}>★ {entry.rating}/10</Text>
          ) : null}
        </View>
      }
    />
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipInactive]}>
      <Text style={[styles.filterChipLabel, active && { color: Colors.accentText }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  guest: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
  },
  gridGap: {
    gap: Spacing.three,
  },
  header: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  summary: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  entryRating: {
    color: Colors.rating,
    fontSize: 11,
    fontWeight: '700',
  },
  filterChip: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  filterChipActive: {
    borderColor: 'rgba(96, 165, 250, 0.5)',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  filterChipInactive: {
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  filterChipLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});