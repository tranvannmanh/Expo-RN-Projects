import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import Animated from 'react-native-reanimated';

export type ThemedTouchableProps = TouchableOpacityProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedTouchableOpacity({
  style,
  lightColor,
  darkColor,
  type,
  ...otherProps
}: ThemedTouchableProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: theme[type ?? 'background'],
          borderColor: theme.border,
        },
        style,
      ]}
      {...otherProps}
    />
  );
}

export const AnimatedThemedTouchable = Animated.createAnimatedComponent(
  ThemedTouchableOpacity,
);
