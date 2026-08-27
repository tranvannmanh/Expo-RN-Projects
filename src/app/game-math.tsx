import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
	AnswerGrid,
	ComboDisplay,
	GameHeader,
	GameOverScreen,
	GameTimer,
} from '@/features/math/components';
import QuestionCard from '@/features/math/components/QuestionCard';
import { ScoreFeedback } from '@/features/math/components/ScoreFeedback';
import { useGame } from '@/features/math/hooks/useGame';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GameScreen() {
	const {
		state,
		startGame,
		submitAnswer,
		restartGame,
		remainingTimeMs,
		answerFeedback,
		scoreFeedback,
		highScore,
	} = useGame();

	useEffect(() => {
		startGame();
	}, [startGame]);

	if (state.status === 'game_over') {
		if (!state.result) {
			return null;
		}

		return <GameOverScreen result={state.result} onRestart={restartGame} />;
	}

	if (!state.question) {
		return (
			<SafeAreaView style={styles.container}>
				<ThemedText>No question</ThemedText>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeAreaView}>
			<ThemedView style={styles.container}>
				<ThemedView style={styles.headerContainer}>
					<GameHeader score={state.score} lives={state.lives} />
					<ThemedText style={styles.highScore}>🏆 {highScore}</ThemedText>
					<ComboDisplay combo={state.combo} />
				</ThemedView>

				<GameTimer remainingTimeMs={remainingTimeMs} status={state.status} />

				<QuestionCard expression={state.question.expression} />

				{scoreFeedback && (
					<ScoreFeedback
						score={scoreFeedback.score}
						combo={scoreFeedback.combo}
					/>
				)}

				<AnswerGrid
					options={state.question.options}
					onAnswer={submitAnswer}
					feedback={answerFeedback}
				/>
			</ThemedView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeAreaView: {
		flex: 1,
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
		padding: Spacing.four,
		justifyContent: 'space-between',
		gap: 16,
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
