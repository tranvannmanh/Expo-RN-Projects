import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ConnectionSetup, TouchpadSurface, useTouchpadConnection } from '@/features/touchpad';

import { StyleSheet } from 'react-native';

export default function TouchpadScreen() {
  const { connectionStatus, disconnect } = useTouchpadConnection();
  const isConnected = connectionStatus === 'connected';

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {isConnected ? (
            <TouchpadSurface onDisconnect={disconnect} />
          ) : (
            <ConnectionSetup />
          )}
        </SafeAreaView>
      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
