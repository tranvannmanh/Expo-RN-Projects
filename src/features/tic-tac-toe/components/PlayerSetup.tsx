import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTicTacToe } from '../hooks/use-tic-tac-toe';
import { PLAYER_O_COLOR, PLAYER_X_COLOR } from './Cell';

export function PlayerSetup() {
  const theme = useTheme();
  const { setPlayers, startGame, players } = useTicTacToe();

  const [nameX, setNameX] = useState(players.X === 'Player 1' ? '' : players.X);
  const [nameO, setNameO] = useState(players.O === 'Player 2' ? '' : players.O);

  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleStart = () => {
    setPlayers({
      X: nameX.trim() || 'Player 1',
      O: nameO.trim() || 'Player 2',
    });
    startGame();
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <ThemedText type="subtitle" style={styles.title}>
        Tic Tac Toe
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
        Nhập tên người chơi để bắt đầu
      </ThemedText>

      <ThemedView style={styles.form}>
        <ThemedView style={styles.fieldGroup}>
          <ThemedView style={styles.labelRow}>
            <ThemedText
              type="smallBold"
              style={[styles.playerBadge, { backgroundColor: PLAYER_X_COLOR }]}
            >
              X
            </ThemedText>
            <ThemedText type="smallBold">Người chơi 1</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.inputWrapper}>
            <TextInput
              value={nameX}
              onChangeText={setNameX}
              placeholder="Player 1"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              maxLength={20}
              returnKeyType="next"
            />
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.fieldGroup}>
          <ThemedView style={styles.labelRow}>
            <ThemedText
              type="smallBold"
              style={[styles.playerBadge, { backgroundColor: PLAYER_O_COLOR }]}
            >
              O
            </ThemedText>
            <ThemedText type="smallBold">Người chơi 2</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.inputWrapper}>
            <TextInput
              value={nameO}
              onChangeText={setNameO}
              placeholder="Player 2"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={handleStart}
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <Pressable onPress={handleStart} style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}>
        <ThemedText type="smallBold" style={styles.startBtnText}>
          Bắt đầu ▶
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    width: '100%',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    width: '100%',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  fieldGroup: {
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  playerBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 28,
    color: Colors.dark.text,
    overflow: 'hidden',
  },
  inputWrapper: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    height: 36,
  },
  startBtn: {
    backgroundColor: '#3c87f7',
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.two + Spacing.half,
    borderRadius: 14,
    marginTop: Spacing.two,
  },
  startBtnPressed: {
    opacity: 0.75,
  },
  startBtnText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
});
