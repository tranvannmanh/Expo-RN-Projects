import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  type DerivedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { EditorColors } from '@/constants/theme';

import { EditorLayout } from '../constants/layout.constants';
import { useCropGesture, type FrameRect } from '../hooks/useCropGesture';
import type { Geometry } from '../types/editor.types';

type CropOverlayProps = {
  frameRect: DerivedValue<FrameRect>;
  geometry: SharedValue<Geometry>;
  aspect: number | null;
  onCommit: () => void;
};

export function CropOverlay({ frameRect, geometry, aspect, onCommit }: CropOverlayProps) {
  const gesture = useCropGesture(geometry, frameRect, aspect, onCommit);

  const box = useDerivedValue(() => {
    const f = frameRect.get();
    const c = geometry.get().crop;
    return {
      left: f.x + c.x * f.width,
      top: f.y + c.y * f.height,
      width: c.width * f.width,
      height: c.height * f.height,
    };
  });

  const boxStyle = useAnimatedStyle(() => box.get());
  const dimTop = useAnimatedStyle(() => ({ height: box.get().top }));
  const dimBottom = useAnimatedStyle(() => ({ top: box.get().top + box.get().height }));
  const dimLeft = useAnimatedStyle(() => ({
    top: box.get().top,
    height: box.get().height,
    width: box.get().left,
  }));
  const dimRight = useAnimatedStyle(() => ({
    top: box.get().top,
    height: box.get().height,
    left: box.get().left + box.get().width,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.dim, styles.dimTop, dimTop]} />
        <Animated.View style={[styles.dim, styles.dimBottom, dimBottom]} />
        <Animated.View style={[styles.dim, styles.dimLeft, dimLeft]} />
        <Animated.View style={[styles.dim, styles.dimRight, dimRight]} />
        <Animated.View style={[styles.box, boxStyle]} pointerEvents="none">
          <View style={[styles.gridV, styles.third1V]} />
          <View style={[styles.gridV, styles.third2V]} />
          <View style={[styles.gridH, styles.third1H]} />
          <View style={[styles.gridH, styles.third2H]} />
          <View style={[styles.handle, styles.topLeft]} />
          <View style={[styles.handle, styles.topRight]} />
          <View style={[styles.handle, styles.bottomLeft]} />
          <View style={[styles.handle, styles.bottomRight]} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const HANDLE_OFFSET = -EditorLayout.cropHandleThickness;

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    backgroundColor: EditorColors.overlay,
  },
  dimTop: { top: 0, left: 0, right: 0 },
  dimBottom: { bottom: 0, left: 0, right: 0 },
  dimLeft: { left: 0 },
  dimRight: { right: 0 },
  box: {
    position: 'absolute',
    borderWidth: EditorLayout.cropBorder,
    borderColor: EditorColors.text,
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: EditorColors.grid,
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: EditorColors.grid,
  },
  third1V: { left: '33.333%' },
  third2V: { left: '66.666%' },
  third1H: { top: '33.333%' },
  third2H: { top: '66.666%' },
  handle: {
    position: 'absolute',
    width: EditorLayout.cropHandleSize,
    height: EditorLayout.cropHandleSize,
    borderColor: EditorColors.text,
  },
  topLeft: {
    top: HANDLE_OFFSET,
    left: HANDLE_OFFSET,
    borderTopWidth: EditorLayout.cropHandleThickness,
    borderLeftWidth: EditorLayout.cropHandleThickness,
  },
  topRight: {
    top: HANDLE_OFFSET,
    right: HANDLE_OFFSET,
    borderTopWidth: EditorLayout.cropHandleThickness,
    borderRightWidth: EditorLayout.cropHandleThickness,
  },
  bottomLeft: {
    bottom: HANDLE_OFFSET,
    left: HANDLE_OFFSET,
    borderBottomWidth: EditorLayout.cropHandleThickness,
    borderLeftWidth: EditorLayout.cropHandleThickness,
  },
  bottomRight: {
    bottom: HANDLE_OFFSET,
    right: HANDLE_OFFSET,
    borderBottomWidth: EditorLayout.cropHandleThickness,
    borderRightWidth: EditorLayout.cropHandleThickness,
  },
});
