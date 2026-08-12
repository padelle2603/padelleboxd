import { StyleSheet, Text, View } from 'react-native';
import { STATUS_COLOR, STATUS_LABEL } from '@/constants/status';
import { Radius, Spacing } from '@/constants/theme';
import type { SeriesStatus } from '@/lib/types';

export function StatusBadge({ status, compact }: { status: SeriesStatus; compact?: boolean }) {
  const c = STATUS_COLOR[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.label, { color: c.fg }, compact && styles.compact]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half + 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  compact: {
    fontSize: 11,
  },
});