import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PosterCard } from '@/components/poster-card';
import { EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { STATUSES, STATUS_LABEL } from '@/constants/status';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ProfileResponse, SeriesStatus } from '@/lib/types';

type Filter = 'ALL' | SeriesStatus;

export default function ProfileScreen() {
  const params = useLocalSearchParams<{ username: string }>();
  const username = params.username ?? '';
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data, error, loading, reload } = useApi<ProfileResponse>(
    username ? `/users/${encodeURIComponent(username)}` : null
  );

  const visible =
    filter === 'ALL' ? data?.entries ?? [] : (data?.entries ?? []).filter((e) => e.status === filter);

  if (loading) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: true, title: username }} />
        <LoadingState label="Loading profile…" />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: true, title: username }} />
        <View style={styles.pad}>
          <ErrorState message={error ?? 'User not found'} onRetry={reload} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: data.username }} />
      <FlatList
        data={visible}
        keyExtractor={(item, i) => `${item.series.tmdbId}-${i}`}
        numColumns={2}
        columnWrapperStyle={styles.gap}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PosterCard
            series={item.series}
            footer={
              <View style={styles.entryMeta}>
                <Text style={styles.entryStatus}>{STATUS_LABEL[item.status]}</Text>
                {typeof item.rating === 'number' ? (
                  <Text style={styles.entryRating}>★ {item.rating}/10</Text>
                ) : null}
              </View>
            }
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{data.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.avatarInfo}>
                <Text style={styles.name}>@{data.username}</Text>
                <Text style={styles.joined}>
                  Joined {new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>

            <View style={styles.countsRow}>
              {STATUSES.map((s) => (
                <View key={s} style={styles.count}>
                  <Text style={styles.countValue}>{data.counts[s]}</Text>
                  <Text style={styles.countLabel}>{STATUS_LABEL[s].toLowerCase()}</Text>
                </View>
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
              <FilterChip label="All" active={filter === 'ALL'} onPress={() => setFilter('ALL')} />
              {STATUSES.map((s) => (
                <FilterChip key={s} label={STATUS_LABEL[s]} active={filter === s} onPress={() => setFilter(s)} />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <EmptyState title="No series here yet" subtitle="This list is empty." />
        }
        ListFooterComponent={<View style={{ height: Spacing.six }} />}
      />
    </Screen>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
      <Text style={[styles.chipLabel, active && { color: Colors.accentText }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: Spacing.three,
  },
  list: {
    paddingHorizontal: Spacing.three,
  },
  gap: {
    gap: Spacing.three,
  },
  header: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  avatarInfo: {
    gap: Spacing.half,
  },
  name: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  joined: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  count: {
    alignItems: 'center',
  },
  countValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  countLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chip: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipActive: {
    borderColor: 'rgba(96, 165, 250, 0.5)',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  chipInactive: {
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  entryStatus: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  entryRating: {
    color: Colors.rating,
    fontSize: 11,
    fontWeight: '700',
  },
});