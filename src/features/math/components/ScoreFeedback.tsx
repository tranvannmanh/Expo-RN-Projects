import { AnimatedThemedView, ThemedText } from '@/components';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

type ScoreFeedbackProps = {
	score: number;
	combo: number;
};

export function ScoreFeedback({ score, combo }: ScoreFeedbackProps) {
	const opacity = useSharedValue(0);
	const translateY = useSharedValue(10);
	const scale = useSharedValue(0.8);

	useEffect(() => {
		opacity.value = 0;
		translateY.value = 10;
		scale.value = 0.8;

		opacity.value = withTiming(1, {
			duration: 120,
		});

		translateY.value = withTiming(0, {
			duration: 180,
			easing: Easing.out(Easing.ease),
		});

		scale.value = withSequence(
			withTiming(1.1, {
				duration: 120,
			}),
			withTiming(1, {
				duration: 120,
			}),
		);
	}, [score, combo]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [
			{
				translateY: translateY.value,
			},
			{
				scale: scale.value,
			},
		],
	}));

	function getComboMessage(combo: number): string | null {
		if (combo >= 10) {
			return '🔥 AMAZING!';
		}

		if (combo >= 5) {
			return '🔥 GREAT!';
		}

		if (combo >= 3) {
			return 'Nice!';
		}

		return null;
	}

	const comboMessage = getComboMessage(combo);

	return (
		<AnimatedThemedView style={[styles.container, animatedStyle]}>
			<ThemedText style={styles.score}>+{score}</ThemedText>

			<ThemedText style={styles.combo}>
				Combo ×{combo} {comboMessage && comboMessage}
			</ThemedText>
		</AnimatedThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 70,
	},

	score: {
		fontSize: 28,
		fontWeight: '800',
	},

	combo: {
		marginTop: 4,
		fontSize: 16,
		fontWeight: '700',
	},
});
