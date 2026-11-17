import { type ReactNode } from 'react';
import {
  type GestureResponderEvent,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText, type ThemedTextProps } from './themed-text';

import { Motion, Spacing, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type AnimatedThemedButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title?: string;
  children?: ReactNode;
  /** Background color when idle */
  type?: ThemeColor;
  /** Background color while pressed */
  pressedType?: ThemeColor;
  textType?: ThemedTextProps['type'];
  textColor?: ThemeColor;
  /** Scale applied while pressed */
  pressedScale?: number;
  style?: StyleProp<ViewStyle>;
};

export function AnimatedThemedButton({
  title,
  children,
  type = 'backgroundElement',
  pressedType = 'backgroundSelected',
  textType = 'smallBold',
  textColor = 'text',
  pressedScale = Motion.pressedScale,
  disabled,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedThemedButtonProps) {
  const theme = useTheme();
  const idleColor = theme[type];
  const activeColor = theme[pressedType];

  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [idleColor, activeColor]),
    transform: [{ scale: 1 - (1 - pressedScale) * progress.value }],
  }));

  const handlePressIn = (event: GestureResponderEvent) => {
    progress.value = withSpring(1, Motion.spring);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    progress.value = withTiming(0, { duration: Motion.colorDuration });
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.button, animatedStyle, disabled && styles.disabled, style]}
      {...rest}>
      {children ?? (
        <ThemedText type={textType} themeColor={textColor}>
          {title}
        </ThemedText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  disabled: {
    opacity: Motion.disabledOpacity,
  },
});
