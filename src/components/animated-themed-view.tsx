import { useEffect } from 'react';
import { type ViewProps } from 'react-native';
import Animated, {
  type AnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Motion, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AnimatedThemedViewProps = AnimatedProps<ViewProps> & {
  type?: ThemeColor;
  /** Duration (ms) of the background transition when the theme changes */
  duration?: number;
};

/**
 * Reanimated View whose background smoothly transitions when the color scheme changes.
 * Accepts entering/exiting/layout animations like any Animated.View.
 */
export function AnimatedThemedView({
  style,
  type = 'background',
  duration = Motion.colorDuration,
  ...rest
}: AnimatedThemedViewProps) {
  const theme = useTheme();
  const targetColor = theme[type];
  const backgroundColor = useSharedValue<string>(targetColor);

  useEffect(() => {
    backgroundColor.value = withTiming(targetColor, { duration });
  }, [backgroundColor, targetColor, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  return <Animated.View style={[animatedStyle, style]} {...rest} />;
}
