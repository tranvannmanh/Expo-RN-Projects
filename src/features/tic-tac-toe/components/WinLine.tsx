import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import type { WinResult } from '../types';

const WIN_LINE_COLOR = '#FFD93D';

interface WinLineConfig {
	type: 'horizontal' | 'vertical' | 'diagonal';
	centerRatioX: number;
	centerRatioY: number;
	lengthRatio: number;
	angle: number;
}

const WIN_LINE_CONFIGS: WinLineConfig[] = [
	{
		type: 'horizontal',
		centerRatioX: 0.5,
		centerRatioY: 1 / 6,
		lengthRatio: 1.04,
		// lengthRatio: 0.88,
		angle: 0,
	},
	{
		type: 'horizontal',
		centerRatioX: 0.5,
		centerRatioY: 0.5,
		lengthRatio: 1.04,
		// lengthRatio: 0.88,
		angle: 0,
	},
	{
		type: 'horizontal',
		centerRatioX: 0.5,
		centerRatioY: 5 / 6,
		lengthRatio: 1.04,
		// lengthRatio: 0.88,
		angle: 0,
	},
	{
		type: 'vertical',
		centerRatioX: 1 / 6,
		centerRatioY: 0.5,
		lengthRatio: 1.04,
		// lengthRatio: 0.88,
		angle: 0,
	},
	{
		type: 'vertical',
		centerRatioX: 0.5,
		centerRatioY: 0.5,
		lengthRatio: 1.04,
		// lengthRatio: 0.88,
		angle: 0,
	},
	{
		type: 'vertical',
		centerRatioX: 5 / 6,
		centerRatioY: 0.5,
		lengthRatio: 1.04,
		// lengthRatio: 0.88,
		angle: 0,
	},
	{
		type: 'diagonal',
		centerRatioX: 0.5,
		centerRatioY: 0.5,
		lengthRatio: Math.SQRT2 * 1.04,
		// lengthRatio: Math.SQRT2 * 0.88,
		angle: 45,
	},
	{
		type: 'diagonal',
		centerRatioX: 0.5,
		centerRatioY: 0.5,
		lengthRatio: Math.SQRT2 * 1.04,
		// lengthRatio: Math.SQRT2 * 0.88,
		angle: -45,
	},
];

interface WinLineProps {
	winResult: WinResult | null;
	boardSize: number;
}

export function WinLine({ winResult, boardSize }: WinLineProps) {
	const drawProgress = useSharedValue(0);
	const lineLengthSV = useSharedValue(0);

	useEffect(() => {
		if (winResult !== null) {
			const cfg = WIN_LINE_CONFIGS[winResult.lineIndex];
			lineLengthSV.value = boardSize * cfg.lengthRatio;
			drawProgress.value = 0;
			drawProgress.value = withTiming(1, {
				duration: 1080,
				easing: Easing.out(Easing.cubic),
			});
		}
	}, [winResult?.lineIndex, boardSize]);

	// Used for horizontal lines (width animates 0 → lineLength)
	const drawWidthStyle = useAnimatedStyle(() => ({
		width: drawProgress.value * lineLengthSV.value,
	}));

	// Used for vertical lines (height animates 0 → lineLength)
	const drawHeightStyle = useAnimatedStyle(() => ({
		height: drawProgress.value * lineLengthSV.value,
	}));

	// Used for diagonal lines — opacity only, no transform to avoid overriding the static rotate
	const diagStyle = useAnimatedStyle(() => ({
		opacity: drawProgress.value,
	}));

	if (!winResult) return null;

	const cfg = WIN_LINE_CONFIGS[winResult.lineIndex];
	const lineLength = boardSize * cfg.lengthRatio;
	const cx = boardSize * cfg.centerRatioX;
	const cy = boardSize * cfg.centerRatioY;

	if (cfg.type === 'horizontal') {
		return (
			<Animated.View
				style={[
					{
						position: 'absolute',
						left: cx - lineLength / 2,
						top: cy - 4,
						height: 8,
						backgroundColor: WIN_LINE_COLOR,
						borderRadius: 4,
					},
					drawWidthStyle,
				]}
			/>
		);
	}

	if (cfg.type === 'vertical') {
		return (
			<Animated.View
				style={[
					{
						position: 'absolute',
						left: cx - 4,
						top: cy - lineLength / 2,
						width: 8,
						backgroundColor: WIN_LINE_COLOR,
						borderRadius: 4,
					},
					drawHeightStyle,
				]}
			/>
		);
	}

	return (
		<Animated.View
			style={[
				styles.diagonal,
				{
					left: cx - lineLength / 2,
					top: cy - 4,
					width: lineLength,
					transform: [{ rotate: `${cfg.angle}deg` }],
				},
				diagStyle,
			]}
		/>
	);
}

const styles = StyleSheet.create({
	diagonal: {
		position: 'absolute',
		height: 8,
		backgroundColor: WIN_LINE_COLOR,
		borderRadius: 4,
	},
});
