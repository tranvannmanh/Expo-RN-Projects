import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

type GameTimerProps = {
	remainingTimeMs: number;
	status: 'idle' | 'playing' | 'game_over';
};

export function GameTimer({ remainingTimeMs, status }: GameTimerProps) {
	const seconds = Math.ceil(remainingTimeMs / 1000);

	const scale = useSharedValue(1);

	const isPlaying = status === 'playing';
	const isWarning = isPlaying && seconds <= 5;
	const isCritical = isPlaying && seconds <= 3;

	useEffect(() => {
		if (!isCritical) {
			scale.value = withTiming(1, {
				duration: 150,
			});

			return;
		}

		scale.value = withRepeat(
			withSequence(
				withTiming(1.15, {
					duration: 250,
				}),
				withTiming(1, {
					duration: 250,
				}),
			),
			-1,
			false,
		);

		return () => {
			scale.value = 1;
		};
	}, [isCritical, scale]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{
				scale: scale.value,
			},
		],
	}));

	return (
		<Animated.Text
			style={[
				styles.timer,
				isWarning && styles.warning,
				isCritical && styles.critical,
				animatedStyle,
			]}
		>
			{seconds}
		</Animated.Text>
	);
}

const styles = StyleSheet.create({
	timer: {
		fontSize: 32,
		fontWeight: '800',
		textAlign: 'center',
		color: 'white',
	},

	warning: {
		// giữ style cơ bản ở đây
	},

	critical: {
		fontWeight: '900',
	},
});
