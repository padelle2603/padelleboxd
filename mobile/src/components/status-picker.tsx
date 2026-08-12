import { ScrollView, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Pressable } from 'react-native';
import { STATUSES, STATUS_COLOR, STATUS_LABEL } from '@/constants/status';
import { Radius, Spacing } from '@/constants/theme';
import type { SeriesStatus } from '@/lib/types';

export function StatusPicker({
  value,
  onChange,
  style,
}: {
  value: SeriesStatus;
  onChange: (status: SeriesStatus) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}>
      {STATUSES.map((s) => {
        const active = s === value;
        const c = STATUS_COLOR[s];
        return (
          <Pressable
            key={s}
            onPress={() => onChange(s)}
            style={[
              styles.chip,
              active ? { backgroundColor: c.bg, borderColor: c.border } : styles.chipInactive,
            ]}>
            <Text style={[styles.label, { color: active ? c.fg : '#A1A1AA' }]}>{STATUS_LABEL[s]}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  chip: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipInactive: {
    borderColor: '#27272A',
    backgroundColor: 'rgba(24, 24, 27, 0.6)',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});