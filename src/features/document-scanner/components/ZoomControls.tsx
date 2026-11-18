import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { ICON_SIZE, ZOOM } from '../constants';
import { useT } from '@/shared/i18n';

const PERCENT = 100;

type ZoomControlsProps = {
  scale: number;
  /** Upper zoom limit; defaults to the page viewer's. */
  max?: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

export function ZoomControls({
  scale,
  max = ZOOM.max,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  const t = useT();
  const canZoomOut = scale > ZOOM.min;
  const canZoomIn = scale < max - 0.01;

  return (
    <ThemedView type="background" style={styles.bar}>
      <ThemedPressable
        type="backgroundSelected"
        pressedType="backgroundElement"
        accessibilityRole="button"
        accessibilityLabel={t.pages.zoomOut}
        disabled={!canZoomOut}
        onPress={onZoomOut}
        style={styles.iconButton}>
        <AppIcon ios="minus.magnifyingglass" android="zoom_out" size={ICON_SIZE.medium} />
      </ThemedPressable>

      <ThemedPressable
        type="background"
        pressedType="backgroundElement"
        accessibilityRole="button"
        accessibilityLabel={t.pages.resetZoom}
        accessibilityHint={t.pages.resetZoomHint}
        disabled={!canZoomOut}
        onPress={onReset}
        style={styles.label}>
        <ThemedText type="smallBold" themeColor="text">
          {Math.round(scale * PERCENT)}%
        </ThemedText>
      </ThemedPressable>

      <ThemedPressable
        type="backgroundSelected"
        pressedType="backgroundElement"
        accessibilityRole="button"
        accessibilityLabel={t.pages.zoomIn}
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
