import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { APP_FONT_FAMILY, Colors } from '@/constants/theme';
import { AppProviders } from '@/providers/AppProviders';
import '@/shared/appearance/appearance.store';
import { useT } from '@/shared/i18n';
import { useSystemLanguageSync } from '@/shared/i18n/useSystemLanguageSync';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const t = useT();
  useSystemLanguageSync();
  return (
    <AppProviders>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* Dark icons on light backgrounds and vice versa; otherwise they are white-on-white. */}
        <StatusBar style="auto" />
        <AnimatedSplashOverlay />
        {/* Header colours come from the app palette explicitly so they always match the screen
            background in both light and dark mode. */}
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: APP_FONT_FAMILY, fontWeight: '500', color: colors.text },
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="scan" options={{ title: t.nav.newScan }} />
          <Stack.Screen name="documents/[id]" options={{ title: t.nav.document }} />
          <Stack.Screen name="pdf-tools/index" options={{ title: t.nav.pdfTools }} />
          <Stack.Screen name="pdf-tools/[id]" options={{ title: t.nav.pdf }} />
          <Stack.Screen name="pdf-tools/merge" options={{ title: t.nav.mergePdfs }} />
          <Stack.Screen name="pdf-tools/compress" options={{ title: t.nav.compress }} />
          <Stack.Screen name="pdf-tools/watermark" options={{ title: t.nav.watermark }} />
          <Stack.Screen name="pdf-tools/split" options={{ title: t.nav.splitPages }} />
          <Stack.Screen name="documents/pages" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="pdf-tools/viewer" options={{ headerShown: false, animation: 'fade' }} />
        </Stack>
      </ThemeProvider>
    </AppProviders>
  );
}
