import { Stack, ThemeProvider } from 'expo-router';
import { StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { NavigationThemes } from '@/constants/navigation-theme';
import { AppProviders } from '@/providers/AppProviders';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppProviders>
        <ThemeProvider value={NavigationThemes[colorScheme === 'dark' ? 'dark' : 'light']}>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="editor" options={{ animation: 'fade', gestureEnabled: false }} />
          </Stack>
        </ThemeProvider>
      </AppProviders>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
