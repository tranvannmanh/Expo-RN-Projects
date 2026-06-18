import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useTicTacToe } from '../hooks/use-tic-tac-toe';
import { Cell } from './Cell';
import { GridLines } from './GridLines';
import { WinLine } from './WinLine';

export function Board() {
	const { width } = useWindowDimensions();
	const boardSize = Math.min(width - Spacing.four * 2, 360);

	const { board, winResult, status, makeMove } = useTicTacToe();

	const scale = useSharedValue(0.6);
	const opacity = useSharedValue(0);

	useEffect(() => {
		// scale.value = withSpring(1, { damping: 14, stiffness: 140 });
		scale.value = withSpring(1, { duration: 350 });
		opacity.value = withTiming(1, { duration: 350 });
	}, []);

	const boardStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: opacity.value,
	}));

	const winnerCells = winResult ? new Set(winResult.line) : new Set<number>();
	const isGameOver = status === 'won' || status === 'draw';

	return (
		<Animated.View
			style={[{ width: boardSize, height: boardSize }, boardStyle]}
		>
			<View style={styles.grid}>
				{[0, 1, 2].map((row) => (
					<View key={row} style={styles.row}>
						{[0, 1, 2].map((col) => {
							const index = row * 3 + col;
							return (
								<Cell
									key={col}
									value={board[index]}
									isWinner={winnerCells.has(index)}
									disabled={isGameOver}
									onPress={() => makeMove(index)}
								/>
							);
						})}
					</View>
				))}
			</View>
			<GridLines boardSize={boardSize} />
			<WinLine winResult={winResult} boardSize={boardSize} />
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	grid: {
		flex: 1,
		flexDirection: 'column',
		// padding: Spacing.half,
		gap: Spacing.half,
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		gap: Spacing.half,
	},
});
