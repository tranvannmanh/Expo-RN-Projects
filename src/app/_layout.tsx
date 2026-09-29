import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
  );
}
