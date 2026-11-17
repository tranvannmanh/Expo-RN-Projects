import { StyleSheet, TouchableOpacity, type TouchableOpacityProps } from 'react-native';

import { Motion, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTouchableOpacityProps = TouchableOpacityProps & {
  type?: ThemeColor;
};

export function ThemedTouchableOpacity({
  style,
  type = 'backgroundElement',
  activeOpacity = Motion.pressedOpacity,
  disabled,
  ...rest
}: ThemedTouchableOpacityProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      disabled={disabled}
      style={[{ backgroundColor: theme[type] }, disabled && styles.disabled, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: Motion.disabledOpacity,
  },
});
