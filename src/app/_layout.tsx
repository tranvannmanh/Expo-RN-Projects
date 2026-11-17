import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppProviders } from '@/providers/AppProviders';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AppProviders>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* Dark icons on light backgrounds and vice versa; otherwise they are white-on-white. */}
        <StatusBar style="auto" />
        <AnimatedSplashOverlay />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="scan" options={{ title: 'New scan' }} />
          <Stack.Screen name="documents/[id]" options={{ title: 'Document' }} />
        </Stack>
      </ThemeProvider>
    </AppProviders>
  );
}
