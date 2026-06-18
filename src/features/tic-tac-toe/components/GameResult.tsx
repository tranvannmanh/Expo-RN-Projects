import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useTicTacToe } from '../hooks/use-tic-tac-toe';
import { PLAYER_O_COLOR, PLAYER_X_COLOR } from './Cell';

export function GameResult() {
  const { status, winResult, players, resetGame, resetAll } = useTicTacToe();
  const visible = status === 'won' || status === 'draw';

  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 16, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 280 });
    } else {
      backdropOpacity.value = 0;
      translateY.value = 80;
      opacity.value = 0;
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value * 0.55,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const isDraw = status === 'draw';
  const winner = winResult?.winner;
  const winnerName = winner ? players[winner] : null;
  const accentColor = winner === 'X' ? PLAYER_X_COLOR : winner === 'O' ? PLAYER_O_COLOR : '#aaa';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View style={[styles.card, cardStyle]}>
          {isDraw ? (
            <>
              <ThemedText style={styles.emoji}>🤝</ThemedText>
              <ThemedText type="subtitle" style={styles.resultText}>
                Hòa!
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.subText}>
                Không ai thắng ván này
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText style={[styles.emoji, { color: accentColor }]}>
                {winner}
              </ThemedText>
              <ThemedText type="subtitle" style={styles.resultText}>
                {winnerName} thắng!
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.subText}>
                Xuất sắc!
              </ThemedText>
            </>
          )}

          <View style={styles.buttons}>
            <Pressable
              onPress={resetGame}
              style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPressed]}
            >
              <ThemedText type="smallBold" style={styles.btnPrimaryText}>
                Chơi lại
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={resetAll}
              style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.btnPressed]}
            >
              <ThemedText type="smallBold" themeColor="textSecondary">
                Đổi người chơi
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  emoji: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: '800',
  },
  resultText: {
    textAlign: 'center',
    color: '#fff',
  },
  subText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
  },
  buttons: {
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  btn: {
    paddingVertical: Spacing.two + Spacing.half,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#3c87f7',
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  btnPressed: {
    opacity: 0.72,
  },
  btnPrimaryText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
});
