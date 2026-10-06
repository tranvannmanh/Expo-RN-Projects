import { ThemedText, ThemedTouchableOpacity, ThemedView } from '@/components';
import { SCREEN_WIDTH } from '@/constants/sizes';
import { StyleSheet } from 'react-native';

type SchulteCellProps = {
  number: number;
  onPress: (number: number) => void;
  size: number;
};

export function SchulteCell({ number, onPress, size }: SchulteCellProps) {
  return (
    <ThemedTouchableOpacity
      onPress={() => onPress(number)}
      style={[styles.cell, { width: (SCREEN_WIDTH - 40) / size }]}
      activeOpacity={0.8}
    >
      <ThemedView
        type="border"
        style={[
          styles.cellContent,
          {
            width: (SCREEN_WIDTH - 40) / size,
            backgroundColor:
              number % 2 === 0 ? 'rgba(16, 60, 4, 1)' : 'rgba(86, 28, 24, 1)',
          },
        ]}
      >
        <ThemedText style={styles.number}>{number}</ThemedText>
      </ThemedView>
    </ThemedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    aspectRatio: 1,
  },
  cellContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 22,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.6,
  },
});
