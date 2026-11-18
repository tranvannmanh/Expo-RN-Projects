import { StyleSheet } from 'react-native';
import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

import { AnimatedThemedButton } from '@/components/animated-themed-button';
import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';


const ICON_SIZE = 24;

type ActionButtonProps = {
  label: string;
  icon: { ios: SFSymbol; android: AndroidSymbol };
  /** secondary: on screen background; tonal: on a card (backgroundElement) */
  variant?: 'primary' | 'secondary' | 'tonal';
  disabled?: boolean;
  onPress: () => void;
};

/** Icon + label button used in screen toolbars. */
export function ActionButton({ label, icon, variant = 'secondary', disabled, onPress }: ActionButtonProps) {
  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? 'onPrimary' : 'text';
  const colors = {
    primary: { type: 'primary', pressedType: 'primaryPressed' },
    secondary: { type: 'backgroundElement', pressedType: 'backgroundSelected' },
    tonal: { type: 'backgroundSelected', pressedType: 'backgroundElement' },
  } as const;

  return (
    <AnimatedThemedButton
      type={colors[variant].type}
      pressedType={colors[variant].pressedType}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={styles.button}>
      <AppIcon ios={icon.ios} android={icon.android} size={ICON_SIZE} color={textColor} />
      <ThemedText type="smallBold" themeColor={textColor}>
        {label}
      </ThemedText>
    </AnimatedThemedButton>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
});
