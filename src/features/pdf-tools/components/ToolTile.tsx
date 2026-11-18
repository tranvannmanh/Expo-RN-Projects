import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

import { ICON } from '../constants';

type ToolTileProps = {
  icon: { ios: SFSymbol; android: AndroidSymbol };
  title: string;
  subtitle: string;
  disabled?: boolean;
  onPress: () => void;
};

/** Large tappable card for one PDF tool (two per row). */
export function ToolTile({ icon, title, subtitle, disabled, onPress }: ToolTileProps) {
  return (
    <ThemedPressable
      type="backgroundElement"
      pressedType="backgroundSelected"
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      disabled={disabled}
      onPress={onPress}
      style={styles.tile}>
      <AppIcon {...icon} size={ICON.large} color="primary" />
      <ThemedText type="smallBold">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {subtitle}
      </ThemedText>
    </ThemedPressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
