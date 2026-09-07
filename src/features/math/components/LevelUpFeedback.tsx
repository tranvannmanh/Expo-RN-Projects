import { AnimatedThemedView, ThemedText, ThemedView } from '@/components';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

type LevelUpFeedbackProps = {
	level: number | null;
	onComplete?: () => void;
};

export function LevelUpFeedback({ level, onComplete }: LevelUpFeedbackProps) {
	const visible = level !== null;

	const opacity = useSharedValue(0);
	const scale = useSharedValue(0.6);

	useEffect(() => {
		if (!visible) {
			return;
		}

		opacity.value = 0;
		scale.value = 0.6;

		opacity.value = withSequence(
			withTiming(1, {
				duration: 200,
				easing: Easing.out(Easing.ease),
			}),
			withTiming(1, {
				duration: 600,
			}),
			withTiming(0, {
				duration: 250,
				easing: Easing.in(Easing.ease),
			}),
		);

		scale.value = withSequence(
			withTiming(1.15, {
				duration: 250,
				easing: Easing.out(Easing.back(2)),
			}),
			withTiming(1, {
				duration: 200,
			}),
			withTiming(1, {
				duration: 600,
			}),
			withTiming(0.9, {
				duration: 250,
			}),
		);

		const timeout = setTimeout(() => {
			onComplete?.();
		}, 1050);

		return () => clearTimeout(timeout);
	}, [visible, opacity, scale, onComplete]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [
			{
				scale: scale.value,
			},
		],
	}));

	if (!visible) {
		return null;
	}

	return (
		<ThemedView style={styles.overlay} pointerEvents="none">
			<AnimatedThemedView style={[styles.container, animatedStyle]}>
				<ThemedText style={styles.emoji}>🎉</ThemedText>

				<ThemedText style={styles.title}>LEVEL UP!</ThemedText>

				<ThemedText style={styles.level}>Level {level}</ThemedText>

				<ThemedText style={styles.subtitle}>Get ready!</ThemedText>
			</AnimatedThemedView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	overlay: {
		...StyleSheet.absoluteFill,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 100,
	},

	container: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 40,
		paddingVertical: 30,
		borderRadius: 24,
		backgroundColor: 'rgba(0, 0, 0, 0.85)',
	},

	emoji: {
		fontSize: 48,
		marginBottom: 8,
	},

	title: {
		fontSize: 32,
		fontWeight: '800',
		color: '#FFFFFF',
	},

	level: {
		marginTop: 8,
		fontSize: 24,
		fontWeight: '700',
		color: '#FFFFFF',
	},

	subtitle: {
		marginTop: 8,
		fontSize: 16,
		color: '#FFFFFF',
	},
});
