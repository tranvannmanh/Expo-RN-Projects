import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  AnswerGrid,
  ComboDisplay,
  GameHeader,
  GameTimer,
  LevelUpFeedback,
  MathOverScreen,
  QuestionCard,
  QuestionProgress,
} from '@/features/math/components';
import { useGame } from '@/features/math/hooks/useGame';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MathScreen() {
  const {
    state,
    startGame,
    submitAnswer,
    restartGame,
    remainingTimeMs,
    answerFeedback,
    scoreFeedback,
    highScore,
    levelUp,
    dismissLevelUp,
  } = useGame();

  useEffect(() => {
    startGame();
  }, [startGame]);

  if (state.status === 'game_over') {
    if (!state.result) {
      return null;
    }

    return <MathOverScreen result={state.result} onRestart={restartGame} />;
  }

  if (!state.question) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText>No question</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeAreaView} edges={['bottom']}>
        <ThemedView style={styles.headerContainer}>
          <GameHeader score={state.score} lives={state.lives} />
          <ThemedText style={styles.highScore}>🏆 {highScore}</ThemedText>
          <QuestionProgress
            level={state.difficulty}
            totalQuestions={state.totalQuestions}
          />
        </ThemedView>
        <ComboDisplay combo={state.combo} />
        <GameTimer remainingTimeMs={remainingTimeMs} status={state.status} />

        <QuestionCard expression={state.question.expression} />

        <AnswerGrid
          options={state.question.options}
          onAnswer={submitAnswer}
          feedback={answerFeedback}
        />

        <LevelUpFeedback level={levelUp} onComplete={dismissLevelUp} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'space-between',
    gap: 16,
  },

  highScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },

  gameResult: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },

  resultContainer: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },

  container: {
    flex: 1,
    // padding: Spacing.four,
    // justifyContent: 'space-between',
    // gap: 16,
  },

  headerContainer: {
    gap: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  questionContainer: {
    alignItems: 'center',
    gap: 28,
  },

  combo: {
    marginTop: 12,
  },

  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  option: {
    width: '47%',
    minHeight: 80,
    // borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'lightgrey',
  },

  restartButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
});
