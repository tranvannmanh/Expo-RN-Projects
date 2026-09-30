import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  SafeAreaView,
  type SafeAreaViewProps,
} from 'react-native-safe-area-context';
import { ThemedViewProps } from './themed-view';

export type ThemedSafeAreaViewProps = SafeAreaViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedSafeAreaView({
  style,
  lightColor,
  darkColor,
  type,
  ...otherProps
}: ThemedViewProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
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
