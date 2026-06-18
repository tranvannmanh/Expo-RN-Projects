import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { Board } from '@/features/tic-tac-toe/components/Board';
import { PlayerSetup } from '@/features/tic-tac-toe/components/PlayerSetup';
import { ScoreBoard } from '@/features/tic-tac-toe/components/ScoreBoard';
import { useTicTacToe } from '@/features/tic-tac-toe/hooks/use-tic-tac-toe';

export default function TicTacToeScreen() {
	const { status, resetGame, resetAll } = useTicTacToe();
	const insets = useSafeAreaInsets();

	const paddingBottom =
		insets.bottom +
		(Platform.OS !== 'web' ? BottomTabInset : 0) +
		Spacing.three;

	return (
		<ThemedView style={styles.container}>
			<View
				style={[
					styles.content,
					{
						paddingTop: insets.top + Spacing.four,
						paddingBottom,
						paddingLeft: insets.left + Spacing.four,
						paddingRight: insets.right + Spacing.four,
					},
				]}
			>
				{status === 'setup' ? (
					<PlayerSetup />
				) : (
					<View style={styles.gameLayout}>
						<ScoreBoard />
						<View style={styles.boardArea}>
							<Board />
							{/* <GameResult /> */}
						</View>
						<View style={styles.actions}>
							<Pressable
								onPress={resetGame}
								style={({ pressed }) => [
									styles.btn,
									pressed && styles.btnPressed,
								]}
							>
								<ThemedText type="smallBold" style={styles.btnText}>
									↺ Chơi lại
								</ThemedText>
							</Pressable>
							{/* <Pressable
								onPress={resetAll}
								style={({ pressed }) => [
									styles.btn,
									styles.btnSecondary,
									pressed && styles.btnPressed,
								]}
							>
								<ThemedText type="smallBold" themeColor="textSecondary">
									Đổi người chơi
								</ThemedText>
							</Pressable> */}
						</View>
					</View>
				)}
			</View>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	gameLayout: {
		width: '100%',
		alignItems: 'center',
		gap: Spacing.four,
	},
	boardArea: {
		position: 'relative',
	},
	actions: {
		flexDirection: 'row',
		gap: Spacing.two,
	},
	btn: {
		backgroundColor: '#3c87f7',
		paddingHorizontal: Spacing.four,
		paddingVertical: Spacing.two + Spacing.half,
		borderRadius: 14,
		alignItems: 'center',
	},
	btnSecondary: {
		backgroundColor: 'transparent',
		borderWidth: 1.5,
		borderColor: 'rgba(128,128,128,0.3)',
	},
	btnPressed: {
		opacity: 0.72,
	},
	btnText: {
		color: Colors.dark.text,
	},
});
