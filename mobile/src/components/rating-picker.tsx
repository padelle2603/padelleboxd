import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';

const OPTIONS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export function RatingPicker({
  value,
  onChange,
}: {
  value: number | null | undefined;
  onChange: (rating: number | null) => void;
}) {
  return (
    <View style={styles.wrap}>
      {OPTIONS.map((r) => {
        const active = value === r;
        return (
          <Pressable
            key={r}
            onPress={() => onChange(active ? null : r)}
            style={[styles.cell, active && styles.cellActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>{r}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  cell: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#212225',
  },
  cellActive: {
    backgroundColor: '#16A34A',
  },
  label: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: '#fff',
  },
});