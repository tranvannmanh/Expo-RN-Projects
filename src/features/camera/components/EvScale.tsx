import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
	Pressable,
	StyleSheet,
	View,
	type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';
import { EditorLayout } from '@/features/photo-editor';

import { CameraLayout } from '../constants/camera.constants';

type EvScaleProps = {
	values: number[];
	index: number;
	onChange: (value: number) => void;
};

const MARKER = CameraLayout.evMarkerSize;
const SLOT = CameraLayout.evSlotWidth;
const MARKER_MS = 120;
const ROW = CameraLayout.evLabelRowHeight;

function evLabel(v: number) {
	if (v === 0) return '0';
	return v > 0 ? `+${v}` : `−${Math.abs(v)}`;
}

/** Sony-style EV ruler: ticks every 1/3 stop, labels on whole stops, ▼ marks the value. */
export function EvScale({ values, index, onChange }: EvScaleProps) {
	const [width, setWidth] = useState(0);
	const lastIndex = useRef(index);
	lastIndex.current = index;

	// Slots are laid out with space-between: centers at SLOT/2 + i * step.
	const step = values.length > 1 ? (width - SLOT) / (values.length - 1) : 0;
	const markerX = useSharedValue(0);
	const markerStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: markerX.get() }],
	}));

	useEffect(() => {
		if (width > 0)
			markerX.set(
				withTiming(SLOT / 2 + index * step - MARKER / 2, {
					duration: MARKER_MS,
				}),
			);
	}, [index, step, width, markerX]);

	const select = (next: number) => {
		const clamped = Math.min(values.length - 1, Math.max(0, next));
		if (clamped === lastIndex.current) return;
		lastIndex.current = clamped;
		Haptics.selectionAsync();
		onChange(values[clamped]);
	};
	const selectAt = (x: number) => {
		if (step > 0) select(Math.round((x - SLOT / 2) / step));
	};

	const gesture = Gesture.Simultaneous(
		Gesture.Tap()
			.runOnJS(true)
			.onEnd((e) => selectAt(e.x)),
		Gesture.Pan()
			.runOnJS(true)
			.onBegin((e) => selectAt(e.x))
			.onUpdate((e) => selectAt(e.x)),
	);

	const onLayout = (e: LayoutChangeEvent) =>
		setWidth(e.nativeEvent.layout.width);

	return (
		<View style={styles.container}>
			{/* <ThemedText type="smallBold" style={styles.label}>
        EV
      </ThemedText> */}
			<View style={styles.row}>
				<Arrow icon="arrow_left" onPress={() => select(index - 1)} />
				<GestureDetector gesture={gesture}>
					<View style={styles.scale} onLayout={onLayout}>
						{width > 0 ? (
							<Animated.View style={[styles.marker, markerStyle]}>
								<SymbolView
									name={{
										android: 'arrow_drop_down',
										ios: 'arrowtriangle.down.fill',
									}}
									size={MARKER}
									tintColor={EditorColors.accent}
								/>
							</Animated.View>
						) : null}
						<View style={styles.ticks}>
							{values.map((v, i) => {
								const whole = Number.isInteger(Math.round(v * 100) / 100);
								return (
									<View key={v} style={styles.tickSlot}>
										{whole ? (
											<ThemedText
												type="smallBold"
												numberOfLines={1}
												style={i === index ? styles.wholeActive : styles.whole}
											>
												{evLabel(v)}
											</ThemedText>
										) : (
											<View
												style={[styles.tick, i === index && styles.tickActive]}
											/>
										)}
									</View>
								);
							})}
						</View>
					</View>
				</GestureDetector>
				<Arrow icon="arrow_right" onPress={() => select(index + 1)} />
			</View>
		</View>
	);
}

function Arrow({
	icon,
	onPress,
}: {
	icon: 'arrow_left' | 'arrow_right';
	onPress: () => void;
}) {
	return (
		<Pressable hitSlop={Spacing.two} onPress={onPress} style={styles.arrow}>
			<SymbolView
				name={{ android: icon, ios: 'circle' }}
				size={EditorLayout.iconSize}
				tintColor={EditorColors.text}
			/>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		backgroundColor: 'brown',
	},
	label: {
		color: EditorColors.accent,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		alignSelf: 'stretch',
		paddingHorizontal: Spacing.two,
	},
	arrow: {
		width: EditorLayout.filmArrowWidth,
		alignItems: 'center',
	},
	scale: {
		flex: 1,
		height: MARKER + ROW,
	},
	marker: {
		position: 'absolute',
		top: 0,
		width: MARKER,
		alignItems: 'center',
	},
	ticks: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: MARKER,
		height: ROW,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	tickSlot: {
		width: SLOT,
		height: ROW,
		alignItems: 'center',
		justifyContent: 'center',
	},
	tick: {
		width: CameraLayout.evTickWidth,
		height: CameraLayout.evTickHeight,
		backgroundColor: EditorColors.textMuted,
	},
	tickActive: {
		height: CameraLayout.evMajorTickHeight,
		backgroundColor: EditorColors.accent,
	},
	// Labels are wider than a slot; the slot centers them over the tick position.
	whole: {
		width: SLOT * 2,
		textAlign: 'center',
		color: EditorColors.text,
	},
	wholeActive: {
		width: SLOT * 2,
		textAlign: 'center',
		color: EditorColors.accent,
	},
});
