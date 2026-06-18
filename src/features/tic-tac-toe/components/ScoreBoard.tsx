import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTicTacToe } from '../hooks/use-tic-tac-toe';
import { PLAYER_O_COLOR, PLAYER_X_COLOR } from './Cell';

export function ScoreBoard() {
  const { players, scores, currentPlayer, status } = useTicTacToe();

  const isXTurn = currentPlayer === 'X' && status === 'playing';
  const isOTurn = currentPlayer === 'O' && status === 'playing';

  return (
    <View style={styles.container}>
      <PlayerScore
        name={players.X}
        score={scores.X}
        color={PLAYER_X_COLOR}
        mark="X"
        isActive={isXTurn}
      />

      <ThemedView type="backgroundElement" style={styles.divider}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          VS
        </ThemedText>
      </ThemedView>

      <PlayerScore
        name={players.O}
        score={scores.O}
        color={PLAYER_O_COLOR}
        mark="O"
        isActive={isOTurn}
      />
    </View>
  );
}

interface PlayerScoreProps {
  name: string;
  score: number;
  color: string;
  mark: string;
  isActive: boolean;
}

function PlayerScore({ name, score, color, mark, isActive }: PlayerScoreProps) {
  return (
    <ThemedView
      type={isActive ? 'backgroundSelected' : 'backgroundElement'}
      style={[styles.playerCard, isActive && styles.activeCard]}
    >
      <ThemedText type="smallBold" style={[styles.markLabel, { color }]}>
        {mark}
      </ThemedText>
      <ThemedText type="small" numberOfLines={1} style={styles.playerName}>
        {name}
      </ThemedText>
      <ThemedText type="subtitle" style={[styles.score, { color }]}>
        {score}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    width: '100%',
  },
  playerCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    gap: Spacing.half,
  },
  activeCard: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  markLabel: {
    fontSize: 13,
    letterSpacing: 1,
  },
  playerName: {
    textAlign: 'center',
  },
  score: {
    fontSize: 36,
    lineHeight: 40,
  },
  divider: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 8,
  },
});
