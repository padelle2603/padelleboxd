import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { SeriesSummary } from '@/lib/types';

export function PosterCard({
  series,
  footer,
  width,
}: {
  series: SeriesSummary;
  footer?: React.ReactNode;
  width?: number;
}) {
  const router = useRouter();
  const w = width ?? '100%';

  return (
    <Pressable
      onPress={() => router.push(`/series/${series.tmdbId}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.posterWrap, { width: w }]}>
        {series.posterUrl ? (
          <Image
            source={{ uri: series.posterUrl }}
            style={styles.poster}
            contentFit="cover"
            transition={150}
            recyclingKey={series.posterUrl}
          />
        ) : (
          <View style={[styles.poster, styles.posterFallback]}>
            <Text style={styles.fallbackText}>{series.name}</Text>
          </View>
        )}
        {typeof series.tmdbRating === 'number' && series.tmdbRating > 0 ? (
          <View style={styles.rating}>
            <Text style={styles.ratingText}>★ {series.tmdbRating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} style={styles.name}>
        {series.name}
      </Text>
      {footer}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.one + 2,
  },
  pressed: {
    opacity: 0.7,
  },
  posterWrap: {
    aspectRatio: 2 / 3,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  fallbackText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  rating: {
    position: 'absolute',
    top: Spacing.one + 2,
    right: Spacing.one + 2,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.one + 2,
    paddingVertical: Spacing.half,
  },
  ratingText: {
    color: Colors.rating,
    fontSize: 11,
    fontWeight: '700',
  },
  name: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});