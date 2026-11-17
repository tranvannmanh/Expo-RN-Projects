import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Motion, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedPressableProps = PressableProps & {
  /** Background color when idle */
  type?: ThemeColor;
  /** Background color while pressed */
  pressedType?: ThemeColor;
};

export function ThemedPressable({
  style,
  type = 'backgroundElement',
  pressedType = 'backgroundSelected',
  disabled,
  ...rest
}: ThemedPressableProps) {
  const theme = useTheme();

  return (
    <Pressable
      disabled={disabled}
      style={(state) => [
        { backgroundColor: theme[state.pressed ? pressedType : type] },
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: Motion.disabledOpacity,
  },
});
