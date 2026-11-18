import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedPressable } from '@/components/themed-pressable';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ICON } from '../constants';

type ViewerActionButtonProps = {
  label: string;
  icon: { ios: SFSymbol; android: AndroidSymbol };
  busy?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/** Icon button for a viewer's top bar; shows a spinner while its action runs. */
export function ViewerActionButton({ label, icon, busy, disabled, onPress }: ViewerActionButtonProps) {
  const theme = useTheme();
  return (
    <ThemedPressable
      type="background"
      pressedType="backgroundElement"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled }}
      hitSlop={Spacing.two}
      disabled={disabled || busy}
      onPress={onPress}
      style={styles.button}>
      {busy ? (
        <ActivityIndicator size="small" color={theme.text} />
      ) : (
        <AppIcon {...icon} size={ICON.medium} color="text" />
      )}
    </ThemedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: Spacing.two,
    borderRadius: Spacing.five,
  },
});
