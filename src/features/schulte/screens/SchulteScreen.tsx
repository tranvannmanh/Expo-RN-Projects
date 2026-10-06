import {
  ThemedPressable,
  ThemedSafeAreaView,
  ThemedText,
  ThemedView,
} from '@/components';
import { SchulteBoard, SchulteTimer } from '@/features/schulte/components';
import { StyleSheet } from 'react-native';
import { useSchulteGame } from '../hooks/useSchulteGame';

export function SchulteScreen() {
  const { state, elapsedMs, startGame, selectNumber, resetGame } =
    useSchulteGame(5);

  const isPlaying = state.status === 'playing';
  const isCompleted = state.status === 'completed';

  return (
    <ThemedSafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.subtitle}>
          Find the numbers in order
        </ThemedText>

        <SchulteTimer elapsedMs={elapsedMs} />

        {isPlaying && (
          <ThemedView style={styles.targetContainer}>
            <ThemedText style={styles.targetLabel}>Find</ThemedText>

            <ThemedText style={styles.targetNumber}>
              {state.currentNumber}
            </ThemedText>
          </ThemedView>
        )}

        {isCompleted ? (
          <ThemedView style={styles.completedContainer}>
            {/* <ThemedText style={styles.completedTitle}>🎉 Completed!</ThemedText>

            <SchulteTimer elapsedMs={state.elapsedMs} /> */}

            <ThemedPressable onPress={startGame} style={styles.button}>
              <ThemedText style={styles.buttonText}>Play Again</ThemedText>
            </ThemedPressable>

            <ThemedPressable onPress={resetGame} style={styles.secondaryButton}>
              <ThemedText style={styles.secondaryButtonText}>Back</ThemedText>
            </ThemedPressable>
          </ThemedView>
        ) : (
          <>
            {state.board.length > 0 && (
              <SchulteBoard
                board={state.board}
                size={state.size}
                onSelectNumber={selectNumber}
              />
            )}

            {!isPlaying && (
              <>
                <ThemedPressable onPress={startGame} style={styles.button}>
                  <ThemedText style={styles.buttonText}>Start Game</ThemedText>
                </ThemedPressable>
                {/* <ThemedPressable onPress={startGame} style={styles.button}>
                  <ThemedText style={styles.buttonText}>5x5</ThemedText>
                </ThemedPressable>
                <ThemedPressable onPress={startGame} style={styles.button}>
                  <ThemedText style={styles.buttonText}>6x6</ThemedText>
                </ThemedPressable> */}
              </>
            )}
          </>
        )}
      </ThemedView>
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    opacity: 0.6,
  },

  targetContainer: {
    alignItems: 'center',
    marginVertical: 18,
  },

  targetLabel: {
    fontSize: 14,
    opacity: 0.6,
  },

  targetNumber: {
    marginTop: 2,
    fontSize: 36,
    fontWeight: '900',
  },

  completedContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  completedTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
  },

  button: {
    marginTop: 24,
    minWidth: 180,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  secondaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },

  secondaryButtonText: {
    fontSize: 15,
    opacity: 0.6,
  },
});
