import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Radius, Spacing } from '@/constants/theme';

export function SeriesRow({
  title,
  subtitle,
  posterUrl,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string | null;
  posterUrl?: string | null;
  right?: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.thumbWrap}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.thumb} contentFit="cover" transition={150} recyclingKey={posterUrl} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Text numberOfLines={2} style={styles.thumbFallbackText}>
              {title}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  pressed: {
    opacity: 0.7,
  },
  thumbWrap: {
    width: 40,
    aspectRatio: 2 / 3,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.cardAlt,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.one,
  },
  thumbFallbackText: {
    color: Colors.textMuted,
    fontSize: 8,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  right: {
    alignItems: 'flex-end',
  },
});