import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            color: theme.text,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen
          name="game/math"
          options={{
            title: 'Math Challenge',
            headerBackTitle: 'Home',
          }}
        />
        <Stack.Screen
          name="game/tic-tac-toe"
          options={{
            title: 'Tic Tac Toe',
            headerBackTitle: 'Home',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
