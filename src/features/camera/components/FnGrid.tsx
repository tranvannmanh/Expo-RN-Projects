import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Spacing } from '@/constants/theme';
import { EditorLayout } from '@/features/photo-editor';

import { CameraLayout } from '../constants/camera.constants';
import type { FnItem } from '../types/fn.types';

type FnGridProps = {
  items: FnItem[];
};

const TILE_WIDTH = `${100 / CameraLayout.fnColumns}%` as const;

/** Sony-style Fn menu: two rows of function tiles separated by thin rules. */
export function FnGrid({ items }: FnGridProps) {
  return (
    <View style={styles.grid}>
      {items.map((item, i) => {
        const lastInRow = (i + 1) % CameraLayout.fnColumns === 0;
        return (
          <Pressable
            key={item.id}
            disabled={item.disabled}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.tile,
              !lastInRow && styles.divider,
              item.disabled && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <View style={styles.head}>
              {item.icon ? (
                <SymbolView
                  name={{ android: item.icon, ios: 'circle' }}
                  size={EditorLayout.iconSize}
                  tintColor={EditorColors.text}
                />
              ) : (
                <ThemedText type="smallBold" style={styles.label}>
                  {item.label}
                </ThemedText>
              )}
            </View>
            {item.value ? (
              <ThemedText numberOfLines={1} style={styles.value}>
                {item.value}
              </ThemedText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.two,
  },
  tile: {
    width: TILE_WIDTH,
    height: CameraLayout.fnTileHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.half,
  },
  divider: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: EditorColors.border,
  },
  head: {
    height: EditorLayout.iconSize,
    justifyContent: 'center',
  },
  label: {
    color: EditorColors.text,
  },
  value: {
    color: EditorColors.textMuted,
    fontSize: EditorLayout.valueFontSize - 2,
  },
  disabled: {
    opacity: Motion.disabledOpacity,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
});
