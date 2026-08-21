import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components';
import { AnswerButton, AnswerButtonState } from './AnswerButton';

type AnswerFeedback = {
	answer: number;
	result: 'correct' | 'wrong';
};

type AnswerGridProps = {
	options: number[];
	onAnswer: (answer: number) => void;
	feedback?: AnswerFeedback | null;
	disabled?: boolean;
};

export function AnswerGrid({
	options,
	onAnswer,
	feedback = null,
	disabled = false,
}: AnswerGridProps) {
	return (
		<ThemedView style={styles.container}>
			{options.map((option) => {
				let buttonState: AnswerButtonState = 'idle';

				if (feedback) {
					if (feedback.answer === option) {
						buttonState = feedback.result;
					} else {
						buttonState = 'disabled';
					}
				}

				return (
					<AnswerButton
						key={option}
						value={option}
						state={buttonState}
						onPress={onAnswer}
						disabled={disabled}
					/>
				);
			})}
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 16,
		justifyContent: 'center',
	},
});
