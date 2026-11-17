import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppIconProps = {
  ios: SFSymbol;
  android: AndroidSymbol;
  size: number;
  color?: ThemeColor;
};

export function AppIcon({ ios, android, size, color = 'text' }: AppIconProps) {
  const theme = useTheme();
  return <SymbolView name={{ ios, android, web: android }} size={size} tintColor={theme[color]} />;
}
