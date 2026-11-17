import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { ICON_SIZE, ZOOM } from '../constants';

const PERCENT = 100;

type ZoomControlsProps = {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

export function ZoomControls({ scale, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  const canZoomOut = scale > ZOOM.min;
  const canZoomIn = scale < ZOOM.max;

  return (
    <ThemedView type="scrim" style={styles.bar}>
      <ThemedPressable
        type="backgroundSelected"
        pressedType="backgroundElement"
        accessibilityRole="button"
        accessibilityLabel="Zoom out"
        disabled={!canZoomOut}
        onPress={onZoomOut}
        style={styles.iconButton}>
        <AppIcon ios="minus.magnifyingglass" android="zoom_out" size={ICON_SIZE.medium} />
      </ThemedPressable>

      <ThemedPressable
        type="scrim"
        pressedType="backgroundSelected"
        accessibilityRole="button"
        accessibilityLabel="Reset zoom"
        accessibilityHint="Fits the page to the screen"
        disabled={!canZoomOut}
        onPress={onReset}
        style={styles.label}>
        <ThemedText type="smallBold" themeColor="onScrim">
          {Math.round(scale * PERCENT)}%
        </ThemedText>
      </ThemedPressable>

      <ThemedPressable
        type="backgroundSelected"
        pressedType="backgroundElement"
        accessibilityRole="button"
        accessibilityLabel="Zoom in"
        disabled={!canZoomIn}
        onPress={onZoomIn}
        style={styles.iconButton}>
        <AppIcon ios="plus.magnifyingglass" android="zoom_in" size={ICON_SIZE.medium} />
      </ThemedPressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  iconButton: {
    padding: Spacing.two,
    borderRadius: Spacing.five,
  },
  label: {
    minWidth: Spacing.six,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
});
