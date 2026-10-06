import { Pressable, PressableProps, ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import Animated from 'react-native-reanimated';

export type ThemedPressableProps = PressableProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
  style?: ViewProps['style'];
};

export function ThemedPressable({
  style,
  lightColor,
  darkColor,
  type,
  ...otherProps
}: ThemedPressableProps) {
  const theme = useTheme();
  return (
    <Pressable
      style={[
        {
          backgroundColor: theme[type ?? 'background'],
          borderColor: theme.border,
        },
        ...(Array.isArray(style) ? style : [style]),
      ]}
      {...otherProps}
    />
  );
}

export const AnimatedThemedPressable =
  Animated.createAnimatedComponent(ThemedPressable);
