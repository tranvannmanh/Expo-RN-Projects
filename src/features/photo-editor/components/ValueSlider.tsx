import { StyleSheet, TextInput, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Radius, Spacing } from '@/constants/theme';

import { EditorLayout } from '../constants/layout.constants';
import { useSliderGesture, type SliderConfig } from '../hooks/useSliderGesture';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type ValueSliderProps = SliderConfig & {
  label: string;
  decimals: number;
};

const formatValue = (v: number, decimals: number, signed: boolean) => {
  'worklet';
  const text = v.toFixed(decimals);
  return signed && v > 0 ? `+${text}` : text;
};

export function ValueSlider({ label, decimals, ...config }: ValueSliderProps) {
  const { min, max, value } = config;
  const { gesture, trackWidth } = useSliderGesture(config);
  const signed = min < 0;
  const origin = Math.min(1, Math.max(0, (0 - min) / (max - min)));

  const onLayout = (e: LayoutChangeEvent) => trackWidth.set(e.nativeEvent.layout.width);

  const knobStyle = useAnimatedStyle(() => ({
    left: `${((value.get() - min) / (max - min)) * 100}%`,
  }));

  const fillStyle = useAnimatedStyle(() => {
    const ratio = (value.get() - min) / (max - min);
    return {
      left: `${Math.min(ratio, origin) * 100}%`,
      width: `${Math.abs(ratio - origin) * 100}%`,
    };
  });

  const textProps = useAnimatedProps(() => {
    const text = formatValue(value.get(), decimals, signed);
    return { text, defaultValue: text };
  });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container} hitSlop={EditorLayout.sliderHitSlop}>
        <View style={styles.labelRow}>
          <ThemedText type="small" style={styles.label}>
            {label}
          </ThemedText>
          <AnimatedTextInput
            editable={false}
            underlineColorAndroid="transparent"
            style={styles.value}
            animatedProps={textProps}
          />
        </View>
        <View style={styles.track} onLayout={onLayout}>
          <Animated.View style={[styles.fill, fillStyle]} />
          <Animated.View style={[styles.knob, knobStyle]} />
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: EditorColors.text,
  },
  value: {
    color: EditorColors.textMuted,
    fontSize: EditorLayout.valueFontSize,
    padding: 0,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  track: {
    height: EditorLayout.sliderTrackHeight,
    borderRadius: Radius.pill,
    backgroundColor: EditorColors.surfaceHigh,
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    height: EditorLayout.sliderTrackHeight,
    backgroundColor: EditorColors.accent,
  },
  knob: {
    position: 'absolute',
    width: EditorLayout.sliderKnobSize,
    height: EditorLayout.sliderKnobSize,
    marginLeft: -EditorLayout.sliderKnobSize / 2,
    borderRadius: Radius.pill,
    backgroundColor: EditorColors.text,
  },
});
