import { Stack } from 'expo-router';

import { APP_FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ThemedStackHeaderProps = {
  /** Omit to keep the title set in the root layout. */
  title?: string;
};

/**
 * Applies the current palette to this screen's native header.
 *
 * The root Stack's `screenOptions` only reach screens when they are pushed, so a screen that is
 * already open keeps its old header colours when the system switches light/dark. Options set
 * from inside the screen re-render with the theme and are applied immediately.
 */
export function ThemedStackHeader({ title }: ThemedStackHeaderProps) {
  const theme = useTheme();
  return (
    <Stack.Screen
      options={{
        ...(title !== undefined && { title }),
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerTitleStyle: { fontFamily: APP_FONT_FAMILY, fontWeight: '500', color: theme.text },
      }}
    />
  );
}
