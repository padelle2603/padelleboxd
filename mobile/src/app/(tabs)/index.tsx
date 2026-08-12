import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { PosterCard } from '@/components/poster-card';
import { ErrorState, LoadingState, Screen } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { StatusBar } from 'expo-status-bar';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { TrendResponse } from '@/lib/types';

export default function HomeScreen() {
  const { data, error, loading, reload } = useApi<TrendResponse>('/series/trending');

  const stats = data?.stats;
  const results = data?.results ?? [];

  let body: React.ReactNode;
  if (loading) {
    body = <LoadingState label="Loading trending series…" />;
  } else if (error) {
    body = <ErrorState message={error} onRetry={reload} />;
  } else {
    body = (
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.tmdbId)}
        numColumns={2}
        columnWrapperStyle={styles.gridGap}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <PosterCard series={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.logo}>PadelleBoxd</Text>
            <Text style={styles.tagline}>Track the TV series you love</Text>
            {stats ? (
              <View style={styles.statsRow}>
                <Stat value={stats.members} label="members" />
                <Stat value={stats.trackedSeries} label="tracked" />
                <Stat value={stats.catalogSeries} label="catalog" />
              </View>
            ) : null}
            <Pressable style={styles.searchBtn} onPress={() => router.push('/search')}>
              <Text style={styles.searchBtnText}>Search a TV series</Text>
            </Pressable>
            <Text style={styles.sectionTitle}>Trending this week</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: Spacing.six }} />}
      />
    );
  }

  return (
    <Screen>
      <StatusBar style="light" />
      {body}
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.three,
  },
  gridGap: {
    gap: Spacing.three,
  },
  header: {
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  logo: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: Spacing.two,
    color: Colors.text,
    fontSize: 19,
    fontWeight: '700',
  },
});