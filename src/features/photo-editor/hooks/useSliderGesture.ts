import * as Haptics from 'expo-haptics';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export type SliderConfig = {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  value: SharedValue<number> | Readonly<SharedValue<number>>;
  /** Worklet called on every frame while dragging. */
  onChange: (value: number) => void;
  /** JS callback called once when the drag ends (records history). */
  onCommit: (value: number) => void;
};

const SLIDER_ACTIVE_OFFSET = 4;
const SLIDER_FAIL_OFFSET = 12;

/**
 * Relative drag (fine control, no jump on touch), haptic tick when crossing
 * the default value, double-tap to reset.
 */
export function useSliderGesture({ min, max, step, defaultValue, value, onChange, onCommit }: SliderConfig) {
  const trackWidth = useSharedValue(1);
  const startValue = useSharedValue(0);

  const tick = () => {
    Haptics.selectionAsync();
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-SLIDER_ACTIVE_OFFSET, SLIDER_ACTIVE_OFFSET])
    .failOffsetY([-SLIDER_FAIL_OFFSET, SLIDER_FAIL_OFFSET])
    .onBegin(() => {
      startValue.set(value.get());
    })
    .onUpdate((e) => {
      const raw = startValue.get() + (e.translationX / trackWidth.get()) * (max - min);
      const next = Math.min(max, Math.max(min, Math.round(raw / step) * step));
      const previous = value.get();
      if (next === previous) return;
      const crossed = (previous - defaultValue) * (next - defaultValue) <= 0 && next !== previous;
      if (crossed && next === defaultValue) scheduleOnRN(tick);
      onChange(next);
    })
    .onEnd(() => {
      scheduleOnRN(onCommit, value.get());
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      onChange(defaultValue);
      scheduleOnRN(onCommit, defaultValue);
      scheduleOnRN(tick);
    });

  return { gesture: Gesture.Race(pan, doubleTap), trackWidth };
}
