import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';
import type { CellValue } from '../types';

export const PLAYER_X_COLOR = '#FF6B6B';
export const PLAYER_O_COLOR = '#4ECDC4';

interface CellProps {
	value: CellValue;
	isWinner: boolean;
	disabled: boolean;
	onPress: () => void;
}

export function Cell({ value, isWinner, disabled, onPress }: CellProps) {
	const theme = useTheme();

	const markScale = useSharedValue(0);
	const winPulse = useSharedValue(1);
	const winBg = useSharedValue(0);

	useEffect(() => {
		if (value) {
			markScale.value = 0;
			markScale.value = withSpring(
				1,
				// { damping: 10, stiffness: 200 }
			);
		} else {
			markScale.value = 0;
		}
	}, [value]);

	useEffect(() => {
		if (isWinner) {
			winBg.value = withTiming(1, { duration: 300 });
			winPulse.value = withRepeat(
				withSequence(
					withTiming(1.18, { duration: 380 }),
					withTiming(1, { duration: 380 }),
				),
			);
		} else {
			winBg.value = withTiming(0, { duration: 200 });
			winPulse.value = 1;
		}
	}, [isWinner]);

	const markStyle = useAnimatedStyle(() => ({
		transform: [{ scale: markScale.value * winPulse.value }],
	}));

	const cellBgStyle = useAnimatedStyle(() => ({
		// backgroundColor: 'rgba(128,128,128,0.5)',
		backgroundColor:
			winBg.value > 0
				? `rgba(${value === 'X' ? '255,107,107' : '78,205,196'}, ${winBg.value * 0.2})`
				: theme.backgroundElement,
	}));

	const markColor = value === 'X' ? PLAYER_X_COLOR : PLAYER_O_COLOR;

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled || !!value}
			style={({ pressed }) => [
				styles.pressable,
				pressed && !value && !disabled && styles.pressed,
			]}
		>
			<Animated.View style={[styles.cell, cellBgStyle]}>
				{value && (
					<Animated.Text style={[styles.mark, { color: markColor }, markStyle]}>
						{value}
					</Animated.Text>
				)}
			</Animated.View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	pressable: {
		flex: 1,
	},
	cell: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		// borderRadius: 12,
	},
	mark: {
		fontSize: 56,
		fontWeight: '800',
		lineHeight: 64,
		includeFontPadding: false,
	},
	pressed: {
		opacity: 0.6,
	},
});
