import {
	AnimatedThemedView,
	ThemedText,
	ThemedTouchable,
	ThemedView,
} from '@/components';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

type GameOverResult = {
  score: number;
  bestCombo: number;
  totalQuestions: number;
  correctAnswers: number;
};

type GameOverScreenProps = {
  result: GameOverResult;
  onRestart: () => void;
};

export function GameOverScreen({ result, onRestart }: GameOverScreenProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  const accuracy =
    result.totalQuestions > 0
      ? Math.round((result.correctAnswers / result.totalQuestions) * 100)
      : 0;

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 300,
    });

    scale.value = withSpring(1, {
      damping: 20,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      {
        scale: scale.value,
      },
    ],
  }));

  function getResultMessage(accuracy: number): string {
    if (accuracy >= 90) {
      return '🔥 PERFECT!';
    }

    if (accuracy >= 75) {
      return '🎉 GREAT!';
    }

    if (accuracy >= 50) {
      return '👍 GOOD JOB!';
    }

    return '💪 KEEP PRACTICING!';
  }

  return (
    <ThemedView style={styles.container}>
      <AnimatedThemedView style={[styles.content, animatedStyle]}>
        <ThemedText style={styles.title}>Game Over</ThemedText>

        <ThemedText style={styles.subtitle}>
          {getResultMessage(accuracy)}
        </ThemedText>

        <ThemedView style={styles.scoreContainer}>
          <ThemedText style={styles.scoreLabel}>SCORE</ThemedText>

          <ThemedText style={styles.score}>{result.score}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.stats}>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>
              ×{result.bestCombo}
            </ThemedText>

            <ThemedText style={styles.statLabel}>Best Combo</ThemedText>
          </ThemedView>

          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>{accuracy}%</ThemedText>

            <ThemedText style={styles.statLabel}>Accuracy</ThemedText>
          </ThemedView>

          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>
              {result.totalQuestions}
            </ThemedText>

            <ThemedText style={styles.statLabel}>Questions</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedTouchable
          style={styles.restartButton}
          onPress={onRestart}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.restartText}>PLAY AGAIN</ThemedText>
        </ThemedTouchable>
      </AnimatedThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },

  content: {
    alignItems: 'center',
  },

  title: {
    fontSize: 42,
    fontWeight: '900',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 18,
    opacity: 0.6,
  },

  scoreContainer: {
    marginTop: 40,
    alignItems: 'center',
  },

  scoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    opacity: 0.6,
  },

  score: {
    marginTop: 4,
    fontSize: 56,
    fontWeight: '900',
  },

  stats: {
    width: '100%',
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },

  statLabel: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },

  restartButton: {
    width: '100%',
    minHeight: 60,
    marginTop: 48,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  restartText: {
    fontSize: 18,
    fontWeight: '800',
  },
});
