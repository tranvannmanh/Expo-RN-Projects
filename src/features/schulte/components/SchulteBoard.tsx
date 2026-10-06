import { ThemedView } from '@/components';
import { StyleSheet } from 'react-native';

import { SchulteCell } from './SchulteCell';

type SchulteBoardProps = {
  board: number[];
  size: number;
  onSelectNumber: (number: number) => void;
};

export function SchulteBoard({
  board,
  size,
  onSelectNumber,
}: SchulteBoardProps) {
  return (
    <ThemedView style={styles.board}>
      {board.map((number) => (
        <SchulteCell
          key={number}
          number={number}
          onPress={onSelectNumber}
          size={size}
        />
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  board: {
    width: '100%',
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    // padding: 4,
    // borderRadius: 16,
    // backgroundColor: 'blue',
  },
});
