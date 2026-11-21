import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { EditorColors } from '@/constants/theme';

import { CameraLayout, CameraMotion } from '../constants/camera.constants';

type BusySpinnerProps = {
  /** Content centered inside the ring (stays still while the arc spins). */
  children?: ReactNode;
};

const SIZE = CameraLayout.spinnerSize;
const STROKE = CameraLayout.spinnerStroke;
const OVAL = Skia.XYWHRect(STROKE / 2, STROKE / 2, SIZE - STROKE, SIZE - STROKE);
const TRACK = Skia.PathBuilder.Make().addArc(OVAL, 0, 360).build();
const ARC = Skia.PathBuilder.Make().addArc(OVAL, -90, CameraLayout.spinnerArc).build();

/** Indeterminate ring: an accent arc turning around a faint track. */
export function BusySpinner({ children }: BusySpinnerProps) {
  const turn = useSharedValue(0);

  useEffect(() => {
    turn.set(
      withRepeat(withTiming(360, { duration: CameraMotion.spinnerTurn, easing: Easing.linear }), -1),
    );
    return () => cancelAnimation(turn);
  }, [turn]);

  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get()}deg` }] }));

  return (
    <View style={styles.box}>
      <Canvas style={styles.layer}>
        <Path path={TRACK} style="stroke" strokeWidth={STROKE} color={EditorColors.surfaceHigh} />
      </Canvas>
      <Animated.View style={[styles.layer, spinStyle]}>
        <Canvas style={styles.layer}>
          <Path
            path={ARC}
            style="stroke"
            strokeWidth={STROKE}
            strokeCap="round"
            color={EditorColors.accent}
          />
        </Canvas>
      </Animated.View>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: SIZE,
    height: SIZE,
  },
  layer: {
    ...StyleSheet.absoluteFill,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
