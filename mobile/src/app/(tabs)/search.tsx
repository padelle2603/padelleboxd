import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SeriesRow } from '@/components/series-row';
import { EmptyState, LoadingState, Screen } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatYear } from '@/constants/status';
import type { SeriesSummary } from '@/lib/types';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const path = debounced ? `/series?q=${encodeURIComponent(debounced)}` : null;
  const { data, error, loading } = useApi<{ results: SeriesSummary[] }>(path);

  const results = data?.results ?? [];

  return (
    <Screen>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.title}>Search</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search a TV series…"
          placeholderTextColor={Colors.textMuted}
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.input}
        />
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.tmdbId)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: Spacing.six }}
          ListEmptyComponent={
            loading ? (
              <LoadingState label="Searching…" />
            ) : error ? (
              <EmptyState title="Something went wrong" subtitle={error} />
            ) : debounced ? (
              <EmptyState title="No results" subtitle={`Nothing found for “${debounced}”.`} />
            ) : (
              <EmptyState title="Find a series" subtitle="Search the TMDB catalog to add series to your list." />
            )
          }
          renderItem={({ item }) => (
            <SeriesRow
              title={item.name}
              subtitle={item.firstAirDate ? `First aired ${formatYear(item.firstAirDate)}` : null}
              posterUrl={item.posterUrl}
              right={
                typeof item.tmdbRating === 'number' && item.tmdbRating > 0 ? (
                  <Text style={styles.rating}>★ {item.tmdbRating.toFixed(1)}</Text>
                ) : undefined
              }
              onPress={() => router.push(`/series/${item.tmdbId}`)}
            />
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.three,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 15,
    marginBottom: Spacing.three,
  },
  rating: {
    color: Colors.rating,
    fontSize: 12,
    fontWeight: '700',
  },
});