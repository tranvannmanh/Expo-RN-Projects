import { useRef, useState } from 'react';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

import { touchpadSocket } from '../api/touchpadSocket';
import { useTouchpadConnection } from '../hooks/useTouchpadConnection';
import { useTouchpadGestures } from '../hooks/useTouchpadGestures';

interface TouchpadSurfaceProps {
  onDisconnect: () => void;
}

export function TouchpadSurface({ onDisconnect }: TouchpadSurfaceProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { connectionStatus, config } = useTouchpadConnection();
  const isConnected = connectionStatus === 'connected';
  const gesture = useTouchpadGestures(isConnected);
  const [isActive, setIsActive] = useState(false);
  const activeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showActiveIndicator() {
    setIsActive(true);
    if (activeTimer.current) clearTimeout(activeTimer.current);
    activeTimer.current = setTimeout(() => setIsActive(false), 200);
  }

  function handleLeftClick() {
    touchpadSocket.send({ type: 'LEFT_CLICK' });
    showActiveIndicator();
  }

  function handleRightClick() {
    touchpadSocket.send({ type: 'RIGHT_CLICK' });
    showActiveIndicator();
  }

  return (
    <View style={styles.container}>
      <View style={[styles.statusBar, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#27ae60' : '#e74c3c' }]} />
          <ThemedText type="small">{config.host}:{config.port}</ThemedText>
        </View>
        <Pressable onPress={onDisconnect} style={styles.disconnectButton}>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Disconnect</ThemedText>
        </Pressable>
      </View>

      <GestureDetector gesture={gesture}>
        <View
          style={[
            styles.surface,
            { backgroundColor: isActive ? colors.backgroundSelected : colors.backgroundElement },
          ]}>
          <ThemedText type="small" style={[styles.hint, { color: colors.textSecondary }]}>
            1 finger — move  ·  tap — left click  ·  hold — right click  ·  2 fingers — scroll
          </ThemedText>
        </View>
      </GestureDetector>

      <View style={[styles.buttonRow, { backgroundColor: colors.backgroundElement }]}>
        <Pressable
          style={({ pressed }) => [
            styles.clickButton,
            { backgroundColor: pressed ? colors.backgroundSelected : colors.background },
          ]}
          onPress={handleLeftClick}
          disabled={!isConnected}>
          <ThemedText type="small">Left Click</ThemedText>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.backgroundSelected }]} />

        <Pressable
          style={({ pressed }) => [
            styles.clickButton,
            { backgroundColor: pressed ? colors.backgroundSelected : colors.background },
          ]}
          onPress={handleRightClick}
          disabled={!isConnected}>
          <ThemedText type="small">Right Click</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  disconnectButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  surface: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Spacing.four,
  },
  hint: {
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    height: 60,
  },
  clickButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    marginVertical: Spacing.two,
  },
});
