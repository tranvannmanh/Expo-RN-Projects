
import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ScrollView, type ScrollViewProps } from 'react-native';

export type ThemedScrollViewProps = ScrollViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedScrollView({
  style,
  lightColor,
  darkColor,
  type,
  ...otherProps
}: ThemedScrollViewProps) {
  const theme = useTheme();

  return (
    <ScrollView
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
