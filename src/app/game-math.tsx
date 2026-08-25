import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
	AnswerGrid,
	ComboDisplay,
	GameHeader,
	GameTimer,
} from '@/features/math/components';
import QuestionCard from '@/features/math/components/QuestionCard';
import { useGame } from '@/features/math/hooks/useGame';
import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GameScreen() {
	const {
		state,
		startGame,
		submitAnswer,
		restartGame,
		remainingTimeMs,
		answerFeedback,
	} = useGame();
	const result = state.result;
	const accuracy =
		result && result.totalQuestions > 0
			? Math.round((result.correctAnswers / result.totalQuestions) * 100)
			: 0;

	useEffect(() => {
		startGame();
	}, [startGame]);

	if (state.status === 'game_over') {
		return (
			<SafeAreaView style={styles.resultContainer}>
				<ThemedView style={styles.gameResult}>
					<ThemedText type="title">Game Over</ThemedText>
					<ThemedText>Score: {result?.score}</ThemedText>

					<ThemedText>Best Combo: {result?.bestCombo}</ThemedText>

					<ThemedText>Accuracy: {accuracy}%</ThemedText>

					<ThemedText>Questions: {result?.totalQuestions}</ThemedText>
				</ThemedView>
				<TouchableOpacity style={styles.restartButton} onPress={restartGame}>
					<ThemedText type="default">Play Again</ThemedText>
				</TouchableOpacity>
			</SafeAreaView>
		);
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
				<GameHeader score={state.score} lives={state.lives} />

				<GameTimer remainingTimeMs={remainingTimeMs} status={state.status} />

				<QuestionCard expression={state.question.expression} />

				<AnswerGrid
					options={state.question.options}
					onAnswer={submitAnswer}
					feedback={answerFeedback}
				/>

				<ComboDisplay combo={state.combo} />
			</ThemedView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeAreaView: {
		flex: 1,
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
