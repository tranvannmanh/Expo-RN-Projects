import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useGame } from '@/features/math/hooks/useGame';
import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GameScreen() {
	const { state, startGame, submitAnswer } = useGame();

	useEffect(() => {
		startGame();
	}, [startGame]);

	if (!state.question) {
		return (
			<ThemedView style={styles.container}>
				<ThemedText>No question</ThemedText>
			</ThemedView>
		);
	}

	return (
		<SafeAreaView style={styles.safeAreaView}>
			<ThemedView style={styles.container}>
				<ThemedView>
					<ThemedView style={styles.header}>
						<ThemedText type="subtitle">Score: {state.score}</ThemedText>
						<ThemedText type="default">{'❤️'.repeat(state.lives)}</ThemedText>
					</ThemedView>
					<ThemedText type="default" style={styles.combo}>
						Combo x{state.combo}
					</ThemedText>
				</ThemedView>

				<ThemedView style={styles.questionContainer}>
					<ThemedText type="title">{state.question.expression}</ThemedText>
				</ThemedView>

				<ThemedView style={styles.options}>
					{state.question.options.map((option) => (
						<TouchableOpacity
							key={option}
							style={styles.option}
							onPress={() => submitAnswer(option)}
						>
							<ThemedText type="subtitle">{option}</ThemedText>
						</TouchableOpacity>
					))}
				</ThemedView>
			</ThemedView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeAreaView: {
		flex: 1,
	},

	container: {
		flex: 1,
		padding: 24,
		justifyContent: 'space-between',
	},

	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},

	questionContainer: {
		alignItems: 'center',
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
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
	},
});
